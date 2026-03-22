import {
  users,
  cities,
  cityContent,
  userCollectedCities,
  userBucketList,
  userTravelPhotos,
  colorThemes,
  pushSubscriptions,
  type User,
  type UpsertUser,
  type City,
  type CityContent,
  type UserTravelPhoto,
  type ColorTheme,
  type PushSubscription,
  type InsertPushSubscription,
  type InsertCity,
  type InsertCityContent,
  type InsertUserCollectedCity,
  type InsertUserBucketList,
  type InsertUserTravelPhoto,
  type InsertColorTheme,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lt, lte, asc, isNull, isNotNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStats(userId: string, stats: { discoveredCities?: number; bucketListCities?: number; currentStreak?: number }): Promise<User>;

  // City operations
  getAllCities(): Promise<City[]>;
  getDraftCities(): Promise<City[]>;
  getPublishedCities(): Promise<City[]>;
  getCityById(id: string): Promise<City | undefined>;
  getCityByName(name: string): Promise<City | undefined>;
  getCityByScheduledDate(date: string): Promise<City | undefined>;
  createCity(city: InsertCity): Promise<City>;
  updateCity(id: string, city: Partial<InsertCity>): Promise<City>;
  deleteCity(id: string): Promise<void>;
  getTodaysCity(): Promise<City | undefined>;
  getScheduledCities(): Promise<City[]>;
  approveDraft(id: string, scheduledDate?: Date): Promise<City>;
  rejectDraft(id: string): Promise<City>;

  // City content operations
  getCityContent(cityId: string): Promise<CityContent[]>;
  createCityContent(content: InsertCityContent): Promise<CityContent>;
  updateCityContent(id: string, content: Partial<InsertCityContent>): Promise<CityContent>;
  deleteCityContent(id: string): Promise<void>;

  // User interactions
  addCityToCollection(userId: string, cityId: string): Promise<void>;
  removeCityFromCollection(userId: string, cityId: string): Promise<void>;
  addCityToBucketList(userId: string, cityId: string): Promise<void>;
  removeCityFromBucketList(userId: string, cityId: string): Promise<void>;
  getUserCollectedCities(userId: string): Promise<City[]>;
  getUserBucketList(userId: string): Promise<City[]>;

  // Travel photo operations
  createTravelPhoto(photo: InsertUserTravelPhoto): Promise<UserTravelPhoto>;
  getUserTravelPhotos(userId: string): Promise<UserTravelPhoto[]>;
  deleteTravelPhoto(id: string): Promise<void>;

  // Color theme operations
  getAllColorThemes(): Promise<ColorTheme[]>;
  getActiveColorTheme(): Promise<ColorTheme | undefined>;
  getColorThemeById(id: string): Promise<ColorTheme | undefined>;
  createColorTheme(theme: InsertColorTheme): Promise<ColorTheme>;
  updateColorTheme(id: string, theme: Partial<InsertColorTheme>): Promise<ColorTheme>;
  deleteColorTheme(id: string): Promise<void>;
  setActiveColorTheme(id: string): Promise<ColorTheme>;

  // Push subscription operations
  savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription>;
  deletePushSubscription(endpoint: string): Promise<void>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }


  async updateUserStats(userId: string, stats: { discoveredCities?: number; bucketListCities?: number; currentStreak?: number }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...stats,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // City operations
  async getAllCities(): Promise<City[]> {
    return await db.select().from(cities).orderBy(desc(cities.createdAt));
  }

  async getDraftCities(): Promise<City[]> {
    return await db.select().from(cities)
      .where(eq(cities.status, "draft"))
      .orderBy(desc(cities.createdAt));
  }

  async getPublishedCities(): Promise<City[]> {
    return await db.select().from(cities).where(eq(cities.isPublished, true)).orderBy(desc(cities.publishedDate));
  }

  async approveDraft(id: string, scheduledDate?: Date): Promise<City> {
    const [city] = await db.update(cities)
      .set({
        status: "published",
        isPublished: true,
        publishedDate: new Date(),
        scheduledDate: scheduledDate || null,
        updatedAt: new Date(),
      })
      .where(eq(cities.id, id))
      .returning();
    todaysCityCache: null; // signal to clear cache
    return city;
  }

  async rejectDraft(id: string): Promise<City> {
    const [city] = await db.update(cities)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(cities.id, id))
      .returning();
    return city;
  }

  async getCityById(id: string): Promise<City | undefined> {
    const [city] = await db.select().from(cities).where(eq(cities.id, id));
    return city;
  }

  async getCityByName(name: string): Promise<City | undefined> {
    const [city] = await db.select().from(cities).where(eq(cities.name, name));
    return city;
  }

  async getCityByScheduledDate(date: string): Promise<City | undefined> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    
    const [city] = await db
      .select()
      .from(cities)
      .where(
        and(
          gte(cities.scheduledDate, startOfDay),
          lt(cities.scheduledDate, endOfDay)
        )
      );
    return city;
  }

  async createCity(cityData: InsertCity): Promise<City> {
    const [city] = await db.insert(cities).values(cityData).returning();
    return city;
  }

  async updateCity(id: string, cityData: Partial<InsertCity>): Promise<City> {
    console.log('Storage updateCity - received data:', cityData);
    
    // Ensure all date fields are proper Date objects
    const sanitizedData = { ...cityData };
    
    if (sanitizedData.publishedDate && typeof sanitizedData.publishedDate === 'string') {
      sanitizedData.publishedDate = new Date(sanitizedData.publishedDate);
    }
    if (sanitizedData.scheduledDate && typeof sanitizedData.scheduledDate === 'string') {
      sanitizedData.scheduledDate = new Date(sanitizedData.scheduledDate);
    }
    
    console.log('Storage updateCity - sanitized data:', sanitizedData);
    
    const [city] = await db
      .update(cities)
      .set({ ...sanitizedData, updatedAt: new Date() })
      .where(eq(cities.id, id))
      .returning();
    return city;
  }

  async deleteCity(id: string): Promise<void> {
    await db.delete(cities).where(eq(cities.id, id));
  }

  async getTodaysCity(tzOffsetMinutes?: number): Promise<City | undefined> {
    // Use client timezone offset to determine the correct local calendar date
    const offsetMs = (tzOffsetMinutes || 0) * 60 * 1000;
    const clientNow = new Date(Date.now() + offsetMs); // Convert to client local time
    
    // Get UTC midnight bounds for the client's current calendar date
    // This matches cities scheduled at 00:00:00Z for the target date
    const year = clientNow.getFullYear();
    const month = clientNow.getMonth(); 
    const date = clientNow.getDate();
    const startOfDay = new Date(Date.UTC(year, month, date, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, date + 1, 0, 0, 0));
    
    // FIXED: First try to find a city specifically scheduled for today
    let result = await db
      .select()
      .from(cities)
      .where(
        and(
          eq(cities.isPublished, true),
          gte(cities.scheduledDate, startOfDay),
          lt(cities.scheduledDate, endOfDay)
        )
      )
      .orderBy(desc(cities.publishedDate))
      .limit(1);
    
    // If no city is scheduled for today, find published cities that are NOT scheduled for future dates
    if (result.length === 0) {
      result = await db
        .select()
        .from(cities)
        .where(
          and(
            eq(cities.isPublished, true),
            or(
              // Cities with no scheduled date (general published content)
              isNull(cities.scheduledDate),
              // Cities scheduled for today or earlier (not future)
              lte(cities.scheduledDate, clientNow)
            )
          )
        )
        .orderBy(desc(cities.publishedDate))
        .limit(1);
    }
    
    return result[0];
  }

  async getScheduledCities(): Promise<City[]> {
    return await db
      .select()
      .from(cities)
      .where(isNotNull(cities.scheduledDate))
      .orderBy(asc(cities.scheduledDate));
  }

  // City content operations
  async getCityContent(cityId: string): Promise<CityContent[]> {
    return await db.select().from(cityContent).where(eq(cityContent.cityId, cityId));
  }

  async createCityContent(content: InsertCityContent): Promise<CityContent> {
    const [newContent] = await db.insert(cityContent).values(content).returning();
    return newContent;
  }

  async updateCityContent(id: string, contentData: Partial<InsertCityContent>): Promise<CityContent> {
    const [updatedContent] = await db
      .update(cityContent)
      .set({ ...contentData, updatedAt: new Date() })
      .where(eq(cityContent.id, id))
      .returning();
    return updatedContent;
  }

  async deleteCityContent(id: string): Promise<void> {
    await db.delete(cityContent).where(eq(cityContent.id, id));
  }

  // User interactions
  async addCityToCollection(userId: string, cityId: string): Promise<void> {
    await db.insert(userCollectedCities).values({ userId, cityId }).onConflictDoNothing();
    
    // Update user stats
    const collectedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(userCollectedCities)
      .where(eq(userCollectedCities.userId, userId));
    
    await this.updateUserStats(userId, { discoveredCities: collectedCount[0].count });
  }

  async removeCityFromCollection(userId: string, cityId: string): Promise<void> {
    await db.delete(userCollectedCities).where(
      and(
        eq(userCollectedCities.userId, userId),
        eq(userCollectedCities.cityId, cityId)
      )
    );
  }

  async addCityToBucketList(userId: string, cityId: string): Promise<void> {
    await db.insert(userBucketList).values({ userId, cityId }).onConflictDoNothing();
    
    // Update user stats
    const bucketListCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(userBucketList)
      .where(eq(userBucketList.userId, userId));
    
    await this.updateUserStats(userId, { bucketListCities: bucketListCount[0].count });
  }

  async removeCityFromBucketList(userId: string, cityId: string): Promise<void> {
    await db.delete(userBucketList).where(
      and(
        eq(userBucketList.userId, userId),
        eq(userBucketList.cityId, cityId)
      )
    );
  }

  async getUserCollectedCities(userId: string): Promise<City[]> {
    const result = await db
      .select({ city: cities })
      .from(userCollectedCities)
      .innerJoin(cities, eq(userCollectedCities.cityId, cities.id))
      .where(eq(userCollectedCities.userId, userId));
    
    return result.map(r => r.city);
  }

  async getUserBucketList(userId: string): Promise<City[]> {
    const result = await db
      .select({ city: cities })
      .from(userBucketList)
      .innerJoin(cities, eq(userBucketList.cityId, cities.id))
      .where(eq(userBucketList.userId, userId));
    
    return result.map(r => r.city);
  }

  // Travel photo operations
  async createTravelPhoto(photo: InsertUserTravelPhoto): Promise<UserTravelPhoto> {
    const [newPhoto] = await db
      .insert(userTravelPhotos)
      .values(photo)
      .returning();
    return newPhoto;
  }

  async getUserTravelPhotos(userId: string): Promise<UserTravelPhoto[]> {
    return await db
      .select()
      .from(userTravelPhotos)
      .where(eq(userTravelPhotos.userId, userId))
      .orderBy(desc(userTravelPhotos.takenAt));
  }

  async deleteTravelPhoto(id: string): Promise<void> {
    await db.delete(userTravelPhotos).where(eq(userTravelPhotos.id, id));
  }

  // Color theme operations
  async getAllColorThemes(): Promise<ColorTheme[]> {
    return await db
      .select()
      .from(colorThemes)
      .orderBy(desc(colorThemes.createdAt));
  }

  async getActiveColorTheme(): Promise<ColorTheme | undefined> {
    const [theme] = await db
      .select()
      .from(colorThemes)
      .where(eq(colorThemes.isActive, true));
    return theme;
  }

  async getColorThemeById(id: string): Promise<ColorTheme | undefined> {
    const [theme] = await db
      .select()
      .from(colorThemes)
      .where(eq(colorThemes.id, id));
    return theme;
  }

  async createColorTheme(theme: InsertColorTheme): Promise<ColorTheme> {
    const [newTheme] = await db
      .insert(colorThemes)
      .values(theme)
      .returning();
    return newTheme;
  }

  async updateColorTheme(id: string, theme: Partial<InsertColorTheme>): Promise<ColorTheme> {
    const [updatedTheme] = await db
      .update(colorThemes)
      .set({
        ...theme,
        updatedAt: new Date(),
      })
      .where(eq(colorThemes.id, id))
      .returning();
    return updatedTheme;
  }

  async deleteColorTheme(id: string): Promise<void> {
    await db.delete(colorThemes).where(eq(colorThemes.id, id));
  }

  async setActiveColorTheme(id: string): Promise<ColorTheme> {
    // First deactivate all themes
    await db
      .update(colorThemes)
      .set({ isActive: false, updatedAt: new Date() });
    
    // Then activate the selected theme
    const [activeTheme] = await db
      .update(colorThemes)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(colorThemes.id, id))
      .returning();
    
    return activeTheme;
  }

  // Push subscription operations
  async savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription> {
    const [saved] = await db
      .insert(pushSubscriptions)
      .values(sub)
      .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { p256dh: sub.p256dh, auth: sub.auth } })
      .returning();
    return saved;
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions);
  }
}

export const storage = new DatabaseStorage();
