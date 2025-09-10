import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateCityContent, generateCityImageSuggestions } from "./openai";
import { insertCitySchema, insertCityContentSchema, insertUserTravelPhotoSchema, cities } from "@shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { ObjectStorageService } from "./objectStorage";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
}) : null;

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
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public city routes
  app.get("/api/cities/today", async (req, res) => {
    try {
      const todaysCity = await storage.getTodaysCity();
      if (!todaysCity) {
        return res.status(404).json({ message: "No city published for today" });
      }
      
      const content = await storage.getCityContent(todaysCity.id);
      res.json({ city: todaysCity, content });
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

  // Library routes - for Evergreen Library feature
  app.get("/api/cities/library", isAuthenticated, async (req, res) => {
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

  app.get("/api/cities/all-content", isAuthenticated, async (req, res) => {
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

  // Admin routes (protected)
  app.get("/api/admin/cities", isAuthenticated, async (req, res) => {
    try {
      const cities = await storage.getAllCities();
      res.json(cities);
    } catch (error) {
      console.error("Error fetching all cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  app.post("/api/admin/cities/generate", isAuthenticated, async (req, res) => {
    try {
      const { cityName, country, focus = "balanced", autoPublish = false, scheduledDate } = req.body;
      
      if (!cityName) {
        return res.status(400).json({ message: "City name is required" });
      }
      
      // Handle flexible city name format
      let finalCityName = cityName.trim();
      let finalCountry = country?.trim() || "";
      
      // If city name contains comma and no country provided, extract country from city name
      if (cityName.includes(',') && !finalCountry) {
        const parts = cityName.split(',').map(part => part.trim());
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

      // Create city record
      const cityData = {
        name: finalCityName,
        country: finalCountry,
        isPublished: autoPublish,
        publishedDate: autoPublish ? new Date() : null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
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
        }
      ];

      const createdContent = await Promise.all(
        contentCards.map(card => storage.createCityContent(card))
      );

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

  app.post("/api/admin/cities", isAuthenticated, async (req, res) => {
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
  app.put("/api/admin/cities/:id/publish", isAuthenticated, async (req, res) => {
    try {
      console.log('Publishing city:', req.params.id);
      
      // Use storage layer but with minimal data to avoid timestamp conflicts
      const city = await storage.updateCity(req.params.id, {
        isPublished: true,
        publishedDate: new Date() // Always use current server time
      });
      
      if (!city) {
        return res.status(404).json({ message: "City not found" });
      }
      
      res.json(city);
    } catch (error) {
      console.error("Error publishing city:", error);
      res.status(500).json({ message: "Failed to publish city" });
    }
  });

  app.put("/api/admin/cities/:id", isAuthenticated, async (req, res) => {
    try {
      // Only allow specific fields to be updated to avoid timestamp field conflicts
      const allowedFields = ['name', 'country', 'isPublished', 'isPinned', 'publishedDate', 'scheduledDate', 'cityCtaLinks', 'morningCtaLink', 'afternoonCtaLink', 'eveningCtaLink', 'bonusCtaLink'];
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

  app.delete("/api/admin/cities/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCity(req.params.id);
      res.json({ message: "City deleted successfully" });
    } catch (error) {
      console.error("Error deleting city:", error);
      res.status(500).json({ message: "Failed to delete city" });
    }
  });

  // Content management routes
  app.post("/api/admin/content", isAuthenticated, async (req, res) => {
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

  app.put("/api/admin/content/:id", isAuthenticated, async (req, res) => {
    try {
      const content = await storage.updateCityContent(req.params.id, req.body);
      res.json(content);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  app.delete("/api/admin/content/:id", isAuthenticated, async (req, res) => {
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

  // Image suggestion route
  app.post("/api/admin/image-suggestions", isAuthenticated, async (req, res) => {
    try {
      const { cityName, cardType } = req.body;
      const suggestions = await generateCityImageSuggestions(cityName, cardType);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating image suggestions:", error);
      res.status(500).json({ message: "Failed to generate image suggestions" });
    }
  });

  // Subscription routes removed - app is now completely free

  const httpServer = createServer(app);
  return httpServer;
}
