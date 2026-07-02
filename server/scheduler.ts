import cron from "node-cron";
import { storage } from "./storage";
import { generateCityContent } from "./openai";
import { notifyCityOfTheDay, notifyEveningReminder } from "./push";

const log = (message: string) => {
  console.log(message);
};

// US cities only — all 50 states represented
const WORLD_CITIES: { name: string; country: string }[] = [
  // Northeast
  { name: "New York City", country: "New York, USA" },
  { name: "Brooklyn", country: "New York, USA" },
  { name: "Buffalo", country: "New York, USA" },
  { name: "Albany", country: "New York, USA" },
  { name: "Saratoga Springs", country: "New York, USA" },
  { name: "Boston", country: "Massachusetts, USA" },
  { name: "Cambridge", country: "Massachusetts, USA" },
  { name: "Salem", country: "Massachusetts, USA" },
  { name: "Provincetown", country: "Massachusetts, USA" },
  { name: "Philadelphia", country: "Pennsylvania, USA" },
  { name: "Pittsburgh", country: "Pennsylvania, USA" },
  { name: "Lancaster", country: "Pennsylvania, USA" },
  { name: "Baltimore", country: "Maryland, USA" },
  { name: "Annapolis", country: "Maryland, USA" },
  { name: "Washington DC", country: "Washington DC, USA" },
  { name: "Providence", country: "Rhode Island, USA" },
  { name: "Newport", country: "Rhode Island, USA" },
  { name: "Hartford", country: "Connecticut, USA" },
  { name: "New Haven", country: "Connecticut, USA" },
  { name: "Portland", country: "Maine, USA" },
  { name: "Bar Harbor", country: "Maine, USA" },
  { name: "Burlington", country: "Vermont, USA" },
  { name: "Stowe", country: "Vermont, USA" },
  { name: "Concord", country: "New Hampshire, USA" },
  { name: "Portsmouth", country: "New Hampshire, USA" },
  { name: "Manchester", country: "New Hampshire, USA" },
  // Southeast
  { name: "Miami", country: "Florida, USA" },
  { name: "Orlando", country: "Florida, USA" },
  { name: "Tampa", country: "Florida, USA" },
  { name: "Jacksonville", country: "Florida, USA" },
  { name: "Key West", country: "Florida, USA" },
  { name: "St. Augustine", country: "Florida, USA" },
  { name: "Sarasota", country: "Florida, USA" },
  { name: "Pensacola", country: "Florida, USA" },
  { name: "Fort Lauderdale", country: "Florida, USA" },
  { name: "Atlanta", country: "Georgia, USA" },
  { name: "Savannah", country: "Georgia, USA" },
  { name: "Athens", country: "Georgia, USA" },
  { name: "Charlotte", country: "North Carolina, USA" },
  { name: "Asheville", country: "North Carolina, USA" },
  { name: "Raleigh", country: "North Carolina, USA" },
  { name: "Durham", country: "North Carolina, USA" },
  { name: "Outer Banks", country: "North Carolina, USA" },
  { name: "Charleston", country: "South Carolina, USA" },
  { name: "Myrtle Beach", country: "South Carolina, USA" },
  { name: "Columbia", country: "South Carolina, USA" },
  { name: "New Orleans", country: "Louisiana, USA" },
  { name: "Baton Rouge", country: "Louisiana, USA" },
  { name: "Nashville", country: "Tennessee, USA" },
  { name: "Memphis", country: "Tennessee, USA" },
  { name: "Knoxville", country: "Tennessee, USA" },
  { name: "Chattanooga", country: "Tennessee, USA" },
  { name: "Birmingham", country: "Alabama, USA" },
  { name: "Mobile", country: "Alabama, USA" },
  { name: "Montgomery", country: "Alabama, USA" },
  { name: "Jackson", country: "Mississippi, USA" },
  { name: "Oxford", country: "Mississippi, USA" },
  { name: "Richmond", country: "Virginia, USA" },
  { name: "Virginia Beach", country: "Virginia, USA" },
  { name: "Norfolk", country: "Virginia, USA" },
  { name: "Charlottesville", country: "Virginia, USA" },
  { name: "Shenandoah Valley", country: "Virginia, USA" },
  { name: "Charleston", country: "West Virginia, USA" },
  { name: "Harpers Ferry", country: "West Virginia, USA" },
  { name: "Lexington", country: "Kentucky, USA" },
  { name: "Louisville", country: "Kentucky, USA" },
  { name: "Wilmington", country: "Delaware, USA" },
  // Midwest
  { name: "Chicago", country: "Illinois, USA" },
  { name: "Springfield", country: "Illinois, USA" },
  { name: "Galena", country: "Illinois, USA" },
  { name: "Detroit", country: "Michigan, USA" },
  { name: "Ann Arbor", country: "Michigan, USA" },
  { name: "Traverse City", country: "Michigan, USA" },
  { name: "Mackinac Island", country: "Michigan, USA" },
  { name: "Grand Rapids", country: "Michigan, USA" },
  { name: "Minneapolis", country: "Minnesota, USA" },
  { name: "Duluth", country: "Minnesota, USA" },
  { name: "St. Paul", country: "Minnesota, USA" },
  { name: "Cleveland", country: "Ohio, USA" },
  { name: "Columbus", country: "Ohio, USA" },
  { name: "Cincinnati", country: "Ohio, USA" },
  { name: "Indianapolis", country: "Indiana, USA" },
  { name: "Bloomington", country: "Indiana, USA" },
  { name: "Milwaukee", country: "Wisconsin, USA" },
  { name: "Madison", country: "Wisconsin, USA" },
  { name: "Door County", country: "Wisconsin, USA" },
  { name: "Kansas City", country: "Missouri, USA" },
  { name: "St. Louis", country: "Missouri, USA" },
  { name: "Branson", country: "Missouri, USA" },
  { name: "Omaha", country: "Nebraska, USA" },
  { name: "Lincoln", country: "Nebraska, USA" },
  { name: "Des Moines", country: "Iowa, USA" },
  { name: "Iowa City", country: "Iowa, USA" },
  { name: "Sioux Falls", country: "South Dakota, USA" },
  { name: "Rapid City", country: "South Dakota, USA" },
  { name: "Fargo", country: "North Dakota, USA" },
  { name: "Bismarck", country: "North Dakota, USA" },
  { name: "Wichita", country: "Kansas, USA" },
  // Southwest
  { name: "Los Angeles", country: "California, USA" },
  { name: "San Francisco", country: "California, USA" },
  { name: "San Diego", country: "California, USA" },
  { name: "Santa Barbara", country: "California, USA" },
  { name: "Monterey", country: "California, USA" },
  { name: "Napa", country: "California, USA" },
  { name: "Carmel-by-the-Sea", country: "California, USA" },
  { name: "Lake Tahoe", country: "California, USA" },
  { name: "Palm Springs", country: "California, USA" },
  { name: "Sacramento", country: "California, USA" },
  { name: "Las Vegas", country: "Nevada, USA" },
  { name: "Reno", country: "Nevada, USA" },
  { name: "Phoenix", country: "Arizona, USA" },
  { name: "Scottsdale", country: "Arizona, USA" },
  { name: "Sedona", country: "Arizona, USA" },
  { name: "Tucson", country: "Arizona, USA" },
  { name: "Flagstaff", country: "Arizona, USA" },
  { name: "Santa Fe", country: "New Mexico, USA" },
  { name: "Albuquerque", country: "New Mexico, USA" },
  { name: "Taos", country: "New Mexico, USA" },
  { name: "Houston", country: "Texas, USA" },
  { name: "Austin", country: "Texas, USA" },
  { name: "San Antonio", country: "Texas, USA" },
  { name: "Dallas", country: "Texas, USA" },
  { name: "Fort Worth", country: "Texas, USA" },
  { name: "El Paso", country: "Texas, USA" },
  { name: "Marfa", country: "Texas, USA" },
  { name: "Galveston", country: "Texas, USA" },
  // Northwest / Mountain West
  { name: "Seattle", country: "Washington, USA" },
  { name: "Spokane", country: "Washington, USA" },
  { name: "Olympia", country: "Washington, USA" },
  { name: "Port Townsend", country: "Washington, USA" },
  { name: "Portland", country: "Oregon, USA" },
  { name: "Bend", country: "Oregon, USA" },
  { name: "Ashland", country: "Oregon, USA" },
  { name: "Crater Lake", country: "Oregon, USA" },
  { name: "Denver", country: "Colorado, USA" },
  { name: "Boulder", country: "Colorado, USA" },
  { name: "Aspen", country: "Colorado, USA" },
  { name: "Telluride", country: "Colorado, USA" },
  { name: "Colorado Springs", country: "Colorado, USA" },
  { name: "Durango", country: "Colorado, USA" },
  { name: "Boise", country: "Idaho, USA" },
  { name: "Coeur d'Alene", country: "Idaho, USA" },
  { name: "Sun Valley", country: "Idaho, USA" },
  { name: "Salt Lake City", country: "Utah, USA" },
  { name: "Moab", country: "Utah, USA" },
  { name: "Park City", country: "Utah, USA" },
  { name: "St. George", country: "Utah, USA" },
  { name: "Zion National Park area", country: "Utah, USA" },
  { name: "Billings", country: "Montana, USA" },
  { name: "Bozeman", country: "Montana, USA" },
  { name: "Missoula", country: "Montana, USA" },
  { name: "Glacier National Park area", country: "Montana, USA" },
  { name: "Cheyenne", country: "Wyoming, USA" },
  { name: "Jackson", country: "Wyoming, USA" },
  { name: "Laramie", country: "Wyoming, USA" },
  // Alaska & Hawaii
  { name: "Anchorage", country: "Alaska, USA" },
  { name: "Juneau", country: "Alaska, USA" },
  { name: "Fairbanks", country: "Alaska, USA" },
  { name: "Sitka", country: "Alaska, USA" },
  { name: "Ketchikan", country: "Alaska, USA" },
  { name: "Honolulu", country: "Hawaii, USA" },
  { name: "Maui", country: "Hawaii, USA" },
  { name: "Kauai", country: "Hawaii, USA" },
  { name: "Hilo", country: "Hawaii, USA" },
  { name: "Lanai", country: "Hawaii, USA" },
];

async function getNextCityToGenerate(): Promise<{ name: string; country: string } | null> {
  const existingCities = await storage.getAllCities();
  const existingNames = new Set(existingCities.map(c => c.name.toLowerCase()));

  const available = WORLD_CITIES.filter(c => !existingNames.has(c.name.toLowerCase()));

  if (available.length === 0) return null;

  // Pick a random city from the available pool
  return available[Math.floor(Math.random() * available.length)];
}

// Get today's date string in Eastern time (handles EST/EDT automatically)
function getTodayEastern(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

// Get tomorrow's date based on Eastern time (not UTC), so 8pm Eastern on the 22nd → March 23, not 24
function getTomorrowEastern(): Date {
  const todayEastern = getTodayEastern(); // e.g. "2026-03-22"
  const [year, month, day] = todayEastern.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
}

export async function generateTomorrowsDraft(force = false): Promise<{
  generated: boolean;
  cityName?: string;
  cityId?: string;
  publishDate?: string;
  status?: string;
  skippedReason?: string;
}> {
  try {
    const tomorrow = getTomorrowEastern();
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    log(`[Scheduler] Auto-generate: checking if ${tomorrowStr} already has a city...`);

    // Check if tomorrow already has a scheduled city (draft or published)
    const existing = await storage.getCityByScheduledDate(tomorrowStr);
    if (existing) {
      // In force mode, delete the existing draft if it has no content (orphaned)
      if (force && !existing.isPublished) {
        const existingContent = await storage.getCityContent(existing.id);
        if (existingContent.length === 0) {
          log(`[Scheduler] Auto-generate: force=true — deleting orphaned draft "${existing.name}" (no content)`);
          await storage.deleteCity(existing.id);
        } else {
          log(`[Scheduler] Auto-generate: force=true but "${existing.name}" has content — skipping`);
          return {
            generated: false,
            cityName: `${existing.name}, ${existing.country}`,
            cityId: existing.id,
            publishDate: tomorrowStr,
            status: existing.status,
            skippedReason: `"${existing.name}" is already scheduled for ${tomorrowStr} and has content. Delete it first to regenerate.`,
          };
        }
      } else if (!force) {
        log(`[Scheduler] Auto-generate: ${tomorrowStr} already has "${existing.name}" — skipping`);
        return {
          generated: false,
          cityName: `${existing.name}, ${existing.country}`,
          cityId: existing.id,
          publishDate: tomorrowStr,
          status: existing.status,
          skippedReason: `"${existing.name}" is already scheduled for ${tomorrowStr}.`,
        };
      }
    }

    // Pick the next city
    const cityToGenerate = await getNextCityToGenerate();
    if (!cityToGenerate) {
      log("[Scheduler] Auto-generate: All cities in the pool have been generated");
      return {
        generated: false,
        publishDate: tomorrowStr,
        status: "none-available",
        skippedReason: "All cities in the pool have already been generated.",
      };
    }

    log(`[Scheduler] Auto-generate: Generating ${cityToGenerate.name}, ${cityToGenerate.country} for ${tomorrowStr}`);

    // Generate content via OpenAI
    const generatedContent = await generateCityContent(cityToGenerate.name, cityToGenerate.country);

    // Create the draft city with scheduledDate = tomorrow
    const city = await storage.createCity({
      name: cityToGenerate.name,
      country: cityToGenerate.country,
      isPublished: false,
      status: "draft",
      // DB requires published_date non-null; drafts still remain hidden via isPublished=false.
      publishedDate: tomorrow,
      scheduledDate: tomorrow,
      sampleItinerary: null,
      highlights: (generatedContent.highlights || null) as any,
    });

    // Create all content cards — if this fails, delete the orphaned city to keep DB consistent
    try {
      const cardTypes = ["morning", "afternoon", "evening", "bonus", "luxury", "wildlife"] as const;
      const contentCards = cardTypes.map(type => ({
        cityId: city.id,
        cardType: type,
        title: generatedContent[type].title,
        content: generatedContent[type].content,
      }));
      await Promise.all(contentCards.map(card => storage.createCityContent(card)));
    } catch (contentErr) {
      log(`[Scheduler] Auto-generate: Content card creation failed for ${city.id} — cleaning up orphaned city`);
      await storage.deleteCity(city.id).catch(() => { });
      throw contentErr;
    }

    log(`[Scheduler] Auto-generate: Draft created — ${cityToGenerate.name} scheduled for ${tomorrowStr} (id: ${city.id})`);
    return {
      generated: true,
      cityName: `${cityToGenerate.name}, ${cityToGenerate.country}`,
      cityId: city.id,
      publishDate: tomorrowStr,
      status: city.status,
    };
  } catch (error) {
    log(`[Scheduler] Auto-generate ERROR: ${(error as Error).message}`);
    throw error;
  }
}

export async function autoApproveTodaysDrafts(): Promise<{
  approvedCount: number;
  approvedCities: Array<{ cityId: string; publishDate: string | null; status: string }>;
}> {
  try {
    const todayEST = getTodayEastern();
    log(`[Scheduler] Auto-approve: checking for drafts scheduled for ${todayEST} (Eastern)...`);

    const drafts = await storage.getDraftCities();
    let approved = 0;
    const approvedCities: Array<{ cityId: string; publishDate: string | null; status: string }> = [];

    for (const draft of drafts) {
      if (!draft.scheduledDate) continue;

      const scheduledStr = new Date(draft.scheduledDate).toISOString().split('T')[0];
      if (scheduledStr === todayEST) {
        log(`[Scheduler] Auto-approve: approving "${draft.name}" (${draft.id})`);
        const approvedCity = await storage.approveDraft(draft.id);
        approved++;
        approvedCities.push({
          cityId: approvedCity.id,
          publishDate: approvedCity.publishedDate ? new Date(approvedCity.publishedDate).toISOString().split("T")[0] : null,
          status: approvedCity.status,
        });
        // Notify all subscribers that today's city is live
        notifyCityOfTheDay(draft.name, draft.country).catch(err =>
          log(`[Scheduler] Push notify error: ${err.message}`)
        );
      }
    }

    if (approved === 0) {
      log(`[Scheduler] Auto-approve: no drafts found for today (${todayEST})`);
    } else {
      log(`[Scheduler] Auto-approve: approved ${approved} city(ies) for today`);
    }

    return { approvedCount: approved, approvedCities };
  } catch (error) {
    log(`[Scheduler] Auto-approve ERROR: ${(error as Error).message}`);
    throw error;
  }
}

// Returns the current hour (0-23) in Eastern time
function getCurrentHourEastern(): number {
  const easternTime = new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false });
  return parseInt(easternTime, 10);
}

// On startup, catch up on any jobs missed due to a server restart or deployment
async function runCatchUpChecks() {
  const hourEastern = getCurrentHourEastern();
  log(`[Scheduler] Startup catch-up — current Eastern hour: ${hourEastern}`);

  // Past 9am? Make sure today's draft has been auto-approved if not manually approved
  if (hourEastern >= 9) {
    log("[Scheduler] Catch-up: running auto-approve check...");
    await autoApproveTodaysDrafts();
  }

  // Past 3pm? Make sure tomorrow's draft has been generated
  if (hourEastern >= 15) {
    log("[Scheduler] Catch-up: running draft generation check...");
    await generateTomorrowsDraft();
  }
}

export function startScheduler() {
  // Generate tomorrow's draft daily at 3pm Eastern (handles EST/EDT automatically)
  cron.schedule("0 15 * * *", generateTomorrowsDraft, { timezone: "America/New_York" });

  // Auto-approve today's drafts + notify subscribers at midnight Eastern
  cron.schedule("0 0 * * *", autoApproveTodaysDrafts, { timezone: "America/New_York" });

  // Evening reminder at 7pm Eastern for anyone who hasn't visited yet
  cron.schedule("0 19 * * *", () => {
    notifyEveningReminder().catch(err => log(`[Scheduler] Evening reminder error: ${err.message}`));
  }, { timezone: "America/New_York" });

  log("[Scheduler] Started — daily draft generation at 3pm Eastern, auto-approve at midnight Eastern, evening reminder at 7pm Eastern");

  // Run catch-up immediately so missed jobs recover after restarts/deployments
  runCatchUpChecks().catch(err => log(`[Scheduler] Catch-up ERROR: ${(err as Error).message}`));
}
