import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Subscription fields removed - app is now completely free
  discoveredCities: integer("discovered_cities").default(0),
  bucketListCities: integer("bucket_list_cities").default(0),
  currentStreak: integer("current_streak").default(0),
  lastVisitDate: timestamp("last_visit_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cities table
export const cities = pgTable("cities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  country: varchar("country").notNull(),
  // state: varchar("state"), // For US cities, Canadian provinces, etc. - TO BE ADDED LATER
  // region: varchar("region"), // Broader geographic regions like "Mediterranean", "Southeast Asia" - TO BE ADDED LATER
  scheduledDate: timestamp("scheduled_date"), // When content should appear to users
  publishedDate: timestamp("published_date"), // When admin published it
  isPublished: boolean("is_published").default(false),
  isPinned: boolean("is_pinned").default(false),
  cityCtaLinks: jsonb("city_cta_links"), // array of {text, url, type} for main city CTAs
  // Content card affiliate links
  morningCtaLink: varchar("morning_cta_link"), // Link for "Explore Landmark" button
  afternoonCtaLink: varchar("afternoon_cta_link"), // Link for "Find Cafés" button  
  eveningCtaLink: varchar("evening_cta_link"), // Link for "Save Money" button
  bonusCtaLink: varchar("bonus_cta_link"), // Link for "Learn More" button
  luxuryCtaLink: varchar("luxury_cta_link"), // Link for "Book Luxury" button
  wildlifeCtaLink: varchar("wildlife_cta_link"), // Link for "Explore Nature" button
  // Social media share templates - NEW FIELDS
  morningShareTemplate: varchar("morning_share_template").default("Wake up in {CITY}! 🌄"),
  afternoonShareTemplate: varchar("afternoon_share_template").default("Spend the afternoon in {CITY}! 🏙️"), 
  eveningShareTemplate: varchar("evening_share_template").default("Evening vibes in {CITY}! 🌆"),
  bonusShareTemplate: varchar("bonus_share_template").default("Hidden gem in {CITY}! 💎"),
  luxuryShareTemplate: varchar("luxury_share_template").default("Luxury awaits in {CITY}! ✨"),
  wildlifeShareTemplate: varchar("wildlife_share_template").default("Wild side of {CITY}! 🦎"),
  // Custom HTML content for sample itinerary
  sampleItinerary: text("sample_itinerary"), // HTML content for custom itinerary section
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// City content cards
export const cityContent = pgTable("city_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cityId: varchar("city_id").references(() => cities.id, { onDelete: "cascade" }),
  cardType: varchar("card_type").notNull(), // morning, afternoon, evening, bonus, luxury, wildlife
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  affiliateLinks: jsonb("affiliate_links"), // array of {text, url, type}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User collected cities (for digital postcards)
export const userCollectedCities = pgTable("user_collected_cities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  cityId: varchar("city_id").references(() => cities.id, { onDelete: "cascade" }),
  collectedAt: timestamp("collected_at").defaultNow(),
});

// User bucket list
export const userBucketList = pgTable("user_bucket_list", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  cityId: varchar("city_id").references(() => cities.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow(),
});

// User travel photos with city tagging
export const userTravelPhotos = pgTable("user_travel_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  cityId: varchar("city_id").references(() => cities.id, { onDelete: "set null" }),
  photoUrl: varchar("photo_url").notNull(), // Object storage URL
  cityName: varchar("city_name").notNull(), // User-tagged city name
  stateName: varchar("state_name"), // User-tagged state name
  caption: text("caption"), // Optional user caption
  fileSize: integer("file_size"), // Optimized file size in bytes
  originalFileName: varchar("original_file_name"),
  isPublic: boolean("is_public").default(false), // Future feature for sharing
  takenAt: timestamp("taken_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  collectedCities: many(userCollectedCities),
  bucketList: many(userBucketList),
  travelPhotos: many(userTravelPhotos),
}));

export const citiesRelations = relations(cities, ({ many }) => ({
  content: many(cityContent),
  collectors: many(userCollectedCities),
  bucketListUsers: many(userBucketList),
  userPhotos: many(userTravelPhotos),
}));

export const cityContentRelations = relations(cityContent, ({ one }) => ({
  city: one(cities, {
    fields: [cityContent.cityId],
    references: [cities.id],
  }),
}));

export const userCollectedCitiesRelations = relations(userCollectedCities, ({ one }) => ({
  user: one(users, {
    fields: [userCollectedCities.userId],
    references: [users.id],
  }),
  city: one(cities, {
    fields: [userCollectedCities.cityId],
    references: [cities.id],
  }),
}));

export const userBucketListRelations = relations(userBucketList, ({ one }) => ({
  user: one(users, {
    fields: [userBucketList.userId],
    references: [users.id],
  }),
  city: one(cities, {
    fields: [userBucketList.cityId],
    references: [cities.id],
  }),
}));

export const userTravelPhotosRelations = relations(userTravelPhotos, ({ one }) => ({
  user: one(users, {
    fields: [userTravelPhotos.userId],
    references: [users.id],
  }),
  city: one(cities, {
    fields: [userTravelPhotos.cityId],
    references: [cities.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCityContentSchema = createInsertSchema(cityContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserCollectedCitySchema = createInsertSchema(userCollectedCities).omit({
  id: true,
  collectedAt: true,
});

export const insertUserBucketListSchema = createInsertSchema(userBucketList).omit({
  id: true,
  addedAt: true,
});

export const insertUserTravelPhotoSchema = createInsertSchema(userTravelPhotos).omit({
  id: true,
  takenAt: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type City = typeof cities.$inferSelect;
export type CityContent = typeof cityContent.$inferSelect;
export type UserCollectedCity = typeof userCollectedCities.$inferSelect;
export type UserBucketList = typeof userBucketList.$inferSelect;
export type UserTravelPhoto = typeof userTravelPhotos.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type InsertCityContent = z.infer<typeof insertCityContentSchema>;
export type InsertUserCollectedCity = z.infer<typeof insertUserCollectedCitySchema>;
export type InsertUserBucketList = z.infer<typeof insertUserBucketListSchema>;
export type InsertUserTravelPhoto = z.infer<typeof insertUserTravelPhotoSchema>;
