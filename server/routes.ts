import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateCityContent, generateCityImageSuggestions, generateCityHeroImage, textToSpeechWithTimestamps } from "./openai";
import { insertCitySchema, insertCityContentSchema, insertUserTravelPhotoSchema, insertColorThemeSchema, cities } from "@shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { ObjectStorageService } from "./objectStorage";
import { generateTomorrowsDraft, autoApproveTodaysDrafts } from "./scheduler";
import { VAPID_PUBLIC_KEY, sendPushToAll } from "./push";

// Simple in-memory cache for daily city content
const todaysCityCache = {
  data: null as any,
  timestamp: 0,
  ttl: 15 * 60 * 1000, // 15 minutes in milliseconds
  
  get() {
    if (Date.now() - this.timestamp > this.ttl) {
      return null; // Cache expired
    }
    return this.data;
  },
  
  set(data: any) {
    this.data = data;
    this.timestamp = Date.now();
  },
  
  clear() {
    this.data = null;
    this.timestamp = 0;
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Add isAdmin flag based on server-side check
      const adminEmail = process.env.ADMIN_EMAIL;
      const userEmail = req.user.claims.email?.toLowerCase();
      const isAdmin = adminEmail && userEmail === adminEmail.toLowerCase();
      
      // Debug admin access
      console.log("🔐 ADMIN ACCESS CHECK:");
      console.log("   User email:", userEmail);
      console.log("   Admin email from env:", adminEmail);
      console.log("   Emails match:", isAdmin);
      console.log("   Raw claims:", req.user.claims);
      
      res.json({
        ...user,
        isAdmin
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public city routes
  app.get("/api/cities/today", async (req, res) => {
    try {
      // Get timezone offset from query parameter (JavaScript getTimezoneOffset returns minutes west of UTC)
      const tzOffsetMinutes = req.query.tzOffset ? parseInt(req.query.tzOffset as string) : undefined;
      
      // Add no-cache headers to prevent stale data in production
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Fetch fresh data from database (no caching)
      const todaysCity = await storage.getTodaysCity(tzOffsetMinutes);
      if (!todaysCity) {
        return res.status(404).json({ message: "No city published for today" });
      }
      
      const content = await storage.getCityContent(todaysCity.id);
      const responseData = { city: todaysCity, content };
      
      res.json(responseData);
    } catch (error) {
      console.error("Error fetching today's city:", error);
      res.status(500).json({ message: "Failed to fetch today's city" });
    }
  });

  app.get("/api/cities/published", async (req, res) => {
    try {
      const cities = await storage.getPublishedCities();
      res.json(cities);
    } catch (error) {
      console.error("Error fetching published cities:", error);
      res.status(500).json({ message: "Failed to fetch published cities" });
    }
  });

  // Library routes - for Evergreen Library feature (now public)
  // IMPORTANT: These specific routes must come BEFORE the wildcard :id route
  app.get("/api/cities/library", async (req, res) => {
    try {
      // Get all published cities except today's city
      const allPublishedCities = await storage.getPublishedCities();
      const todaysCity = await storage.getTodaysCity();
      
      // Filter out today's city from the library
      const libraryCities = allPublishedCities.filter(city => 
        !todaysCity || city.id !== todaysCity.id
      );
      
      res.json(libraryCities);
    } catch (error) {
      console.error("Error fetching library cities:", error);
      res.status(500).json({ message: "Failed to fetch library cities" });
    }
  });

  app.get("/api/cities/all-content", async (req, res) => {
    try {
      // Get all published cities except today's city  
      const allPublishedCities = await storage.getPublishedCities();
      const todaysCity = await storage.getTodaysCity();
      
      // Filter out today's city from the library
      const libraryCities = allPublishedCities.filter(city => 
        !todaysCity || city.id !== todaysCity.id
      );
      
      const citiesWithContent = await Promise.all(
        libraryCities.map(async (city) => {
          const content = await storage.getCityContent(city.id);
          return { city, content };
        })
      );
      res.json(citiesWithContent);
    } catch (error) {
      console.error("Error fetching all cities content:", error);
      res.status(500).json({ message: "Failed to fetch all cities content" });
    }
  });

  // Wildcard route for individual cities - MUST come after specific routes
  app.get("/api/cities/:id", async (req, res) => {
    try {
      const city = await storage.getCityById(req.params.id);
      if (!city) {
        return res.status(404).json({ message: "City not found" });
      }
      
      const content = await storage.getCityContent(city.id);
      res.json({ city, content });
    } catch (error) {
      console.error("Error fetching city:", error);
      res.status(500).json({ message: "Failed to fetch city" });
    }
  });

  // Admin check middleware
  const isAdmin = (req: any, res: any, next: any) => {
    const userEmail = req.user?.claims?.email;
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      console.error("ADMIN_EMAIL environment variable not set");
      return res.status(500).json({ message: "Admin configuration error" });
    }
    
    if (userEmail !== adminEmail) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  };

  // Admin routes (protected)
  app.get("/api/admin/cities", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const cities = await storage.getAllCities();
      res.json(cities);
    } catch (error) {
      console.error("Error fetching all cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  app.get("/api/admin/drafts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const drafts = await storage.getDraftCities();
      res.json(drafts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drafts" });
    }
  });

  app.post("/api/admin/cities/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { scheduledDate } = req.body;
      const city = await storage.approveDraft(req.params.id, scheduledDate ? new Date(scheduledDate) : undefined);
      todaysCityCache.clear();
      // Send push notification if this city is approved for today (or immediately)
      const todayStr = new Date().toISOString().split('T')[0];
      const cityDateStr = city.scheduledDate ? new Date(city.scheduledDate).toISOString().split('T')[0] : todayStr;
      if (cityDateStr === todayStr && city.status === "approved") {
        notifyCityOfTheDay(city.name, city.country).catch(err =>
          console.error("[Routes] Push notify error:", err.message)
        );
      }
      res.json(city);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve draft" });
    }
  });

  app.post("/api/admin/cities/:id/reject", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const city = await storage.rejectDraft(req.params.id);
      res.json(city);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject draft" });
    }
  });

  // Manual scheduler triggers
  app.post("/api/admin/scheduler/generate-tomorrow", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await generateTomorrowsDraft();
      // Return fresh drafts after generation
      const drafts = await storage.getDraftCities();
      res.json({ message: "Tomorrow's draft generation triggered", drafts });
    } catch (error) {
      res.status(500).json({ message: "Generation failed: " + (error as Error).message });
    }
  });

  app.post("/api/admin/scheduler/approve-today", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await autoApproveTodaysDrafts();
      todaysCityCache.clear();
      res.json({ message: "Auto-approve triggered for today's drafts" });
    } catch (error) {
      res.status(500).json({ message: "Auto-approve failed: " + (error as Error).message });
    }
  });

  app.post("/api/admin/cities/generate", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { cityName, country, focus = "balanced", autoPublish = false, scheduledDate, sampleItinerary } = req.body;
      
      if (!cityName) {
        return res.status(400).json({ message: "City name is required" });
      }
      
      // Handle flexible city name format
      let finalCityName = cityName.trim();
      let finalCountry = country?.trim() || "";
      
      // If city name contains comma and no country provided, extract country from city name
      if (cityName.includes(',') && !finalCountry) {
        const parts = cityName.split(',').map((part: string) => part.trim());
        finalCityName = parts[0];
        finalCountry = parts.slice(1).join(', ');
      }
      
      // If still no country, require it
      if (!finalCountry) {
        return res.status(400).json({ message: "Country is required (or include state/region in city name)" });
      }

      // Check if city already exists
      const existingCity = await storage.getCityByName(finalCityName);
      if (existingCity) {
        return res.status(400).json({ message: "City already exists" });
      }

      // Generate content using OpenAI
      const generatedContent = await generateCityContent(finalCityName, finalCountry, focus);
      
      // Check if date is already scheduled (if scheduledDate provided)
      if (scheduledDate) {
        const existingScheduled = await storage.getCityByScheduledDate(scheduledDate);
        if (existingScheduled) {
          return res.status(400).json({ message: "A city is already scheduled for this date" });
        }
      }

      // Create city record - always as draft, admin reviews before publishing
      const cityData = {
        name: finalCityName,
        country: finalCountry,
        isPublished: false,
        status: "draft",
        publishedDate: null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        sampleItinerary: sampleItinerary || null,
      };
      
      const city = await storage.createCity(cityData);

      // Create content cards
      const contentCards = [
        {
          cityId: city.id,
          cardType: "morning",
          title: generatedContent.morning.title,
          content: generatedContent.morning.content,
        },
        {
          cityId: city.id,
          cardType: "afternoon", 
          title: generatedContent.afternoon.title,
          content: generatedContent.afternoon.content,
        },
        {
          cityId: city.id,
          cardType: "evening",
          title: generatedContent.evening.title,
          content: generatedContent.evening.content,
        },
        {
          cityId: city.id,
          cardType: "bonus",
          title: generatedContent.bonus.title,
          content: generatedContent.bonus.content,
        },
        {
          cityId: city.id,
          cardType: "luxury",
          title: generatedContent.luxury.title,
          content: generatedContent.luxury.content,
        },
        {
          cityId: city.id,
          cardType: "wildlife",
          title: generatedContent.wildlife.title,
          content: generatedContent.wildlife.content,
        }
      ];

      const createdContent = await Promise.all(
        contentCards.map(card => storage.createCityContent(card))
      );

      // Save highlights to the city record if generated
      if (generatedContent.highlights && Array.isArray(generatedContent.highlights)) {
        await storage.updateCity(city.id, { highlights: generatedContent.highlights } as any);
      }

      // Auto-generate hero image via DALL-E 3 (non-blocking — runs after response)
      const objStorage = new ObjectStorageService();
      setImmediate(async () => {
        try {
          const imgBuffer = await generateCityHeroImage(finalCityName, finalCountry);
          await objStorage.uploadCityImage(city.id, imgBuffer);
          await storage.updateCity(city.id, { imageUrl: `/api/city-image/${city.id}` } as any);
          console.log(`Auto-generated hero image for ${finalCityName} (id: ${city.id})`);
        } catch (imgErr) {
          console.error(`Image generation failed for ${finalCityName}:`, imgErr);
        }
      });

      res.json({ 
        city, 
        content: createdContent, 
        generated: generatedContent 
      });
    } catch (error) {
      console.error("Error generating city content:", error);
      res.status(500).json({ message: "Failed to generate city content: " + (error as Error).message });
    }
  });

  app.post("/api/admin/cities", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertCitySchema.parse(req.body);
      const city = await storage.createCity(validatedData);
      res.json(city);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid city data", errors: error.errors });
      }
      console.error("Error creating city:", error);
      res.status(500).json({ message: "Failed to create city" });
    }
  });

  // Specific publish route to avoid timestamp conflicts
  app.put("/api/admin/cities/:id/publish", isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log('Publishing city:', req.params.id);
      
      // Use storage layer but with minimal data to avoid timestamp conflicts
      const city = await storage.updateCity(req.params.id, {
        isPublished: true,
        publishedDate: new Date() // Always use current server time
      });
      
      // Clear cache when city is published
      todaysCityCache.clear();
      
      if (!city) {
        return res.status(404).json({ message: "City not found" });
      }
      
      res.json(city);
    } catch (error) {
      console.error("Error publishing city:", error);
      res.status(500).json({ message: "Failed to publish city" });
    }
  });

  app.put("/api/admin/cities/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Only allow specific fields to be updated to avoid timestamp field conflicts
      const allowedFields = ['name', 'country', 'isPublished', 'isPinned', 'publishedDate', 'scheduledDate', 'cityCtaLinks', 'morningCtaLink', 'afternoonCtaLink', 'eveningCtaLink', 'bonusCtaLink', 'luxuryCtaLink', 'wildlifeCtaLink', 'sampleItinerary', 'highlights', 'status'];
      const updateData: any = {};
      
      // Only copy allowed fields
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      // Handle date conversions - only convert valid date strings
      if (updateData.publishedDate && typeof updateData.publishedDate === 'string') {
        const date = new Date(updateData.publishedDate);
        if (!isNaN(date.getTime())) {
          updateData.publishedDate = date;
        } else {
          delete updateData.publishedDate; // Remove invalid date
        }
      }
      
      if (updateData.scheduledDate && typeof updateData.scheduledDate === 'string') {
        const date = new Date(updateData.scheduledDate);
        if (!isNaN(date.getTime())) {
          updateData.scheduledDate = date;
        } else {
          delete updateData.scheduledDate; // Remove invalid date
        }
      }
      
      console.log('Filtered update data:', updateData);
      console.log('Type check - publishedDate:', typeof updateData.publishedDate, updateData.publishedDate);
      console.log('Type check - scheduledDate:', typeof updateData.scheduledDate, updateData.scheduledDate);
      
      const city = await storage.updateCity(req.params.id, updateData);
      res.json(city);
    } catch (error) {
      console.error("Error updating city:", error);
      res.status(500).json({ message: "Failed to update city" });
    }
  });

  app.delete("/api/admin/cities/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCity(req.params.id);
      res.json({ message: "City deleted successfully" });
    } catch (error) {
      console.error("Error deleting city:", error);
      res.status(500).json({ message: "Failed to delete city" });
    }
  });

  // Content management routes
  app.post("/api/admin/content", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertCityContentSchema.parse(req.body);
      const content = await storage.createCityContent(validatedData);
      res.json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid content data", errors: error.errors });
      }
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  app.put("/api/admin/content/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const content = await storage.updateCityContent(req.params.id, req.body);
      res.json(content);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  app.delete("/api/admin/content/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCityContent(req.params.id);
      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  // User interaction routes (protected)
  app.post("/api/user/collect/:cityId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.addCityToCollection(userId, req.params.cityId);
      res.json({ message: "City added to collection" });
    } catch (error) {
      console.error("Error collecting city:", error);
      res.status(500).json({ message: "Failed to collect city" });
    }
  });

  app.delete("/api/user/collect/:cityId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeCityFromCollection(userId, req.params.cityId);
      res.json({ message: "City removed from collection" });
    } catch (error) {
      console.error("Error removing city from collection:", error);
      res.status(500).json({ message: "Failed to remove city from collection" });
    }
  });

  app.post("/api/user/bucket-list/:cityId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.addCityToBucketList(userId, req.params.cityId);
      res.json({ message: "City added to bucket list" });
    } catch (error) {
      console.error("Error adding city to bucket list:", error);
      res.status(500).json({ message: "Failed to add city to bucket list" });
    }
  });

  app.delete("/api/user/bucket-list/:cityId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeCityFromBucketList(userId, req.params.cityId);
      res.json({ message: "City removed from bucket list" });
    } catch (error) {
      console.error("Error removing city from bucket list:", error);
      res.status(500).json({ message: "Failed to remove city from bucket list" });
    }
  });

  app.get("/api/user/collected", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collectedCities = await storage.getUserCollectedCities(userId);
      res.json(collectedCities);
    } catch (error) {
      console.error("Error fetching collected cities:", error);
      res.status(500).json({ message: "Failed to fetch collected cities" });
    }
  });

  app.get("/api/user/bucket-list", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bucketList = await storage.getUserBucketList(userId);
      res.json(bucketList);
    } catch (error) {
      console.error("Error fetching bucket list:", error);
      res.status(500).json({ message: "Failed to fetch bucket list" });
    }
  });

  // Travel photo routes
  app.post("/api/photos/upload", isAuthenticated, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getTravelPhotoUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting photo upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.post("/api/photos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const photoData = insertUserTravelPhotoSchema.parse({
        ...req.body,
        userId,
      });
      
      const photo = await storage.createTravelPhoto(photoData);
      res.json(photo);
    } catch (error) {
      console.error("Error saving travel photo:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid photo data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save photo" });
    }
  });

  app.get("/api/photos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const photos = await storage.getUserTravelPhotos(userId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching user photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Serve city hero image from object storage
  app.get("/api/city-image/:cityId", async (req, res) => {
    try {
      const objStorage = new ObjectStorageService();
      await objStorage.streamCityImage(req.params.cityId, res);
    } catch (error) {
      console.error("Error serving city image:", error);
      if (!res.headersSent) res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // Admin: on-demand image generation for a city
  app.post("/api/admin/cities/:id/generate-image", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const city = await storage.getCityById(req.params.id);
      if (!city) return res.status(404).json({ message: "City not found" });

      const objStorage = new ObjectStorageService();
      const imgBuffer = await generateCityHeroImage(city.name, city.country || "USA");
      await objStorage.uploadCityImage(city.id, imgBuffer);
      await storage.updateCity(city.id, { imageUrl: `/api/city-image/${city.id}` } as any);

      res.json({ imageUrl: `/api/city-image/${city.id}` });
    } catch (error) {
      console.error("Error generating city image:", error);
      res.status(500).json({ message: "Failed to generate image: " + (error as Error).message });
    }
  });

  // Image suggestion route
  app.post("/api/admin/image-suggestions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { cityName, cardType } = req.body;
      const suggestions = await generateCityImageSuggestions(cityName, cardType);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating image suggestions:", error);
      res.status(500).json({ message: "Failed to generate image suggestions" });
    }
  });

  // Color theme admin routes
  app.get("/api/admin/color-themes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const themes = await storage.getAllColorThemes();
      res.json(themes);
    } catch (error) {
      console.error("Error fetching color themes:", error);
      res.status(500).json({ message: "Failed to fetch color themes" });
    }
  });

  app.get("/api/color-themes/active", async (req, res) => {
    try {
      const activeTheme = await storage.getActiveColorTheme();
      res.json(activeTheme);
    } catch (error) {
      console.error("Error fetching active color theme:", error);
      res.status(500).json({ message: "Failed to fetch active color theme" });
    }
  });

  app.post("/api/admin/color-themes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertColorThemeSchema.parse(req.body);
      const theme = await storage.createColorTheme(validatedData);
      res.json(theme);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid color theme data", errors: error.errors });
      }
      console.error("Error creating color theme:", error);
      res.status(500).json({ message: "Failed to create color theme" });
    }
  });

  app.put("/api/admin/color-themes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const theme = await storage.updateColorTheme(req.params.id, req.body);
      res.json(theme);
    } catch (error) {
      console.error("Error updating color theme:", error);
      res.status(500).json({ message: "Failed to update color theme" });
    }
  });

  app.put("/api/admin/color-themes/:id/activate", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const activeTheme = await storage.setActiveColorTheme(req.params.id);
      res.json(activeTheme);
    } catch (error) {
      console.error("Error activating color theme:", error);
      res.status(500).json({ message: "Failed to activate color theme" });
    }
  });

  app.delete("/api/admin/color-themes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteColorTheme(req.params.id);
      res.json({ message: "Color theme deleted successfully" });
    } catch (error) {
      console.error("Error deleting color theme:", error);
      res.status(500).json({ message: "Failed to delete color theme" });
    }
  });

  // Push notification routes — public (no auth needed, users subscribe from home screen)
  app.get("/api/push/vapid-public-key", (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ message: "Invalid subscription data" });
      }
      await storage.savePushSubscription({ endpoint, p256dh: keys.p256dh, auth: keys.auth });
      res.json({ message: "Subscribed successfully" });
    } catch (error) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ message: "Failed to save subscription" });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) return res.status(400).json({ message: "Endpoint required" });
      await storage.deletePushSubscription(endpoint);
      res.json({ message: "Unsubscribed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  // TTS: generate (or return cached) MP3 for a city — admin only
  app.post("/api/tts/:cityId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { cityId } = req.params;

      // Fetch city + content
      const city = await storage.getCityById(cityId);
      if (!city) return res.status(404).json({ message: "City not found" });

      const content = await storage.getCityContent(cityId);

      // Return cached audio + timestamps if fully cached (audio + text).
      // If audioText is missing the cache is stale (pre-highlighting) so we regenerate.
      if (city.audioUrl && (city as any).audioText) {
        const audioBase64 = city.audioUrl.replace(/^data:audio\/mpeg;base64,/, "");
        return res.json({
          audioBase64,
          timestamps: (city as any).audioTimestamps ?? [],
          text: (city as any).audioText ?? "",
        });
      }

      // Assemble narration text: name + country + highlights + all card content
      const highlightLines = Array.isArray(city.highlights)
        ? (city.highlights as string[]).map((h, i) => `${i + 1}. ${h}`).join("\n")
        : "";

      const cardOrder = ["morning", "afternoon", "evening", "bonus", "luxury", "wildlife"];
      const cardLines = cardOrder
        .map(type => {
          const card = content.find(c => c.cardType === type);
          if (!card) return null;
          return `${card.title}\n${card.content}`;
        })
        .filter(Boolean)
        .join("\n\n");

      const fullText = [
        `${city.name}, ${city.country}.`,
        highlightLines,
        cardLines,
      ]
        .filter(Boolean)
        .join("\n\n");

      // Generate audio + Whisper word timestamps in one call
      const { buffer: audioBuffer, timestamps } = await textToSpeechWithTimestamps(fullText);

      // Cache everything in DB
      const dataUrl = `data:audio/mpeg;base64,${audioBuffer.toString("base64")}`;
      await storage.updateCity(cityId, {
        audioUrl: dataUrl,
        audioTimestamps: timestamps,
        audioText: fullText,
      } as any);

      return res.json({
        audioBase64: audioBuffer.toString("base64"),
        timestamps,
        text: fullText,
      });
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ message: "Failed to generate audio" });
    }
  });

  // Admin-only: send a manual push notification (e.g., for testing)
  app.post("/api/admin/push/test", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { title, body } = req.body;
      await sendPushToAll({ title: title || "Test Notification", body: body || "City Discoverer push is working!" });
      res.json({ message: "Test notification sent" });
    } catch (error) {
      console.error("Test push error:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
