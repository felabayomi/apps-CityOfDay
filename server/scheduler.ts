import cron from "node-cron";
import { storage } from "./storage";
import { generateCityContent } from "./openai";
import { log } from "./vite";

// Large pool of world cities to cycle through
const WORLD_CITIES: { name: string; country: string }[] = [
  { name: "Paris", country: "France" },
  { name: "Tokyo", country: "Japan" },
  { name: "Rome", country: "Italy" },
  { name: "Barcelona", country: "Spain" },
  { name: "Amsterdam", country: "Netherlands" },
  { name: "Prague", country: "Czech Republic" },
  { name: "Vienna", country: "Austria" },
  { name: "Budapest", country: "Hungary" },
  { name: "Lisbon", country: "Portugal" },
  { name: "Athens", country: "Greece" },
  { name: "Istanbul", country: "Turkey" },
  { name: "Cairo", country: "Egypt" },
  { name: "Marrakech", country: "Morocco" },
  { name: "Cape Town", country: "South Africa" },
  { name: "Nairobi", country: "Kenya" },
  { name: "Dubai", country: "UAE" },
  { name: "Bangkok", country: "Thailand" },
  { name: "Singapore", country: "Singapore" },
  { name: "Bali", country: "Indonesia" },
  { name: "Kyoto", country: "Japan" },
  { name: "Seoul", country: "South Korea" },
  { name: "Beijing", country: "China" },
  { name: "Shanghai", country: "China" },
  { name: "Mumbai", country: "India" },
  { name: "Delhi", country: "India" },
  { name: "Sydney", country: "Australia" },
  { name: "Melbourne", country: "Australia" },
  { name: "Auckland", country: "New Zealand" },
  { name: "Vancouver", country: "Canada" },
  { name: "Toronto", country: "Canada" },
  { name: "Mexico City", country: "Mexico" },
  { name: "Buenos Aires", country: "Argentina" },
  { name: "Rio de Janeiro", country: "Brazil" },
  { name: "Cartagena", country: "Colombia" },
  { name: "Lima", country: "Peru" },
  { name: "Cusco", country: "Peru" },
  { name: "New York City", country: "USA" },
  { name: "San Francisco", country: "USA" },
  { name: "New Orleans", country: "USA" },
  { name: "Chicago", country: "USA" },
  { name: "Miami", country: "USA" },
  { name: "Havana", country: "Cuba" },
  { name: "Reykjavik", country: "Iceland" },
  { name: "Edinburgh", country: "Scotland" },
  { name: "Dublin", country: "Ireland" },
  { name: "Copenhagen", country: "Denmark" },
  { name: "Stockholm", country: "Sweden" },
  { name: "Oslo", country: "Norway" },
  { name: "Helsinki", country: "Finland" },
  { name: "Dubrovnik", country: "Croatia" },
  { name: "Santorini", country: "Greece" },
  { name: "Porto", country: "Portugal" },
  { name: "Seville", country: "Spain" },
  { name: "Florence", country: "Italy" },
  { name: "Venice", country: "Italy" },
  { name: "Milan", country: "Italy" },
  { name: "Zurich", country: "Switzerland" },
  { name: "Geneva", country: "Switzerland" },
  { name: "Brussels", country: "Belgium" },
  { name: "Warsaw", country: "Poland" },
  { name: "Krakow", country: "Poland" },
  { name: "Tallinn", country: "Estonia" },
  { name: "Riga", country: "Latvia" },
  { name: "Vilnius", country: "Lithuania" },
  { name: "Tbilisi", country: "Georgia" },
  { name: "Yerevan", country: "Armenia" },
  { name: "Baku", country: "Azerbaijan" },
  { name: "Almaty", country: "Kazakhstan" },
  { name: "Tashkent", country: "Uzbekistan" },
  { name: "Kathmandu", country: "Nepal" },
  { name: "Colombo", country: "Sri Lanka" },
  { name: "Dhaka", country: "Bangladesh" },
  { name: "Yangon", country: "Myanmar" },
  { name: "Hanoi", country: "Vietnam" },
  { name: "Ho Chi Minh City", country: "Vietnam" },
  { name: "Phnom Penh", country: "Cambodia" },
  { name: "Vientiane", country: "Laos" },
  { name: "Kuala Lumpur", country: "Malaysia" },
  { name: "Manila", country: "Philippines" },
  { name: "Taipei", country: "Taiwan" },
  { name: "Hong Kong", country: "China" },
  { name: "Osaka", country: "Japan" },
  { name: "Sapporo", country: "Japan" },
  { name: "Accra", country: "Ghana" },
  { name: "Lagos", country: "Nigeria" },
  { name: "Dakar", country: "Senegal" },
  { name: "Addis Ababa", country: "Ethiopia" },
  { name: "Kigali", country: "Rwanda" },
  { name: "Zanzibar", country: "Tanzania" },
  { name: "Lusaka", country: "Zambia" },
  { name: "Casablanca", country: "Morocco" },
  { name: "Tunis", country: "Tunisia" },
  { name: "Amman", country: "Jordan" },
  { name: "Beirut", country: "Lebanon" },
  { name: "Tel Aviv", country: "Israel" },
  { name: "Jerusalem", country: "Israel" },
  { name: "Muscat", country: "Oman" },
  { name: "Doha", country: "Qatar" },
  { name: "Abu Dhabi", country: "UAE" },
  { name: "Riyadh", country: "Saudi Arabia" },
  { name: "Lahore", country: "Pakistan" },
  { name: "Karachi", country: "Pakistan" },
  { name: "Bogota", country: "Colombia" },
  { name: "Quito", country: "Ecuador" },
  { name: "Santiago", country: "Chile" },
  { name: "Montevideo", country: "Uruguay" },
  { name: "Asuncion", country: "Paraguay" },
  { name: "La Paz", country: "Bolivia" },
  { name: "Georgetown", country: "Guyana" },
  { name: "Port of Spain", country: "Trinidad and Tobago" },
  { name: "Kingston", country: "Jamaica" },
  { name: "San Jose", country: "Costa Rica" },
  { name: "Panama City", country: "Panama" },
  { name: "Guatemala City", country: "Guatemala" },
  { name: "Tegucigalpa", country: "Honduras" },
  { name: "Auckland", country: "New Zealand" },
  { name: "Queenstown", country: "New Zealand" },
  { name: "Perth", country: "Australia" },
  { name: "Brisbane", country: "Australia" },
  { name: "Adelaide", country: "Australia" },
  { name: "Hobart", country: "Australia" },
  { name: "Suva", country: "Fiji" },
  { name: "Papeete", country: "French Polynesia" },
];

async function getNextCityToGenerate(): Promise<{ name: string; country: string } | null> {
  const existingCities = await storage.getAllCities();
  const existingNames = new Set(existingCities.map(c => c.name.toLowerCase()));

  const available = WORLD_CITIES.filter(c => !existingNames.has(c.name.toLowerCase()));

  if (available.length === 0) return null;

  // Pick a random city from the available pool
  return available[Math.floor(Math.random() * available.length)];
}

// Get tomorrow's date as a UTC midnight Date object
function getTomorrowUTC(): Date {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return tomorrow;
}

// Get today's date string in Eastern time (handles EST/EDT automatically)
function getTodayEastern(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export async function generateTomorrowsDraft() {
  try {
    const tomorrow = getTomorrowUTC();
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    log(`[Scheduler] Auto-generate: checking if ${tomorrowStr} already has a city...`);

    // Check if tomorrow already has a scheduled city (draft or published)
    const existing = await storage.getCityByScheduledDate(tomorrowStr);
    if (existing) {
      log(`[Scheduler] Auto-generate: ${tomorrowStr} already has "${existing.name}" — skipping`);
      return;
    }

    // Pick the next city
    const cityToGenerate = await getNextCityToGenerate();
    if (!cityToGenerate) {
      log("[Scheduler] Auto-generate: All cities in the pool have been generated");
      return;
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
      publishedDate: null,
      scheduledDate: tomorrow,
      sampleItinerary: null,
      highlights: (generatedContent.highlights || null) as any,
    });

    // Create all content cards
    const cardTypes = ["morning", "afternoon", "evening", "bonus", "luxury", "wildlife"] as const;
    const contentCards = cardTypes.map(type => ({
      cityId: city.id,
      cardType: type,
      title: generatedContent[type].title,
      content: generatedContent[type].content,
    }));
    await Promise.all(contentCards.map(card => storage.createCityContent(card)));

    log(`[Scheduler] Auto-generate: Draft created — ${cityToGenerate.name} scheduled for ${tomorrowStr} (id: ${city.id})`);
  } catch (error) {
    log(`[Scheduler] Auto-generate ERROR: ${(error as Error).message}`);
  }
}

export async function autoApproveTodaysDrafts() {
  try {
    const todayEST = getTodayEastern();
    log(`[Scheduler] Auto-approve: checking for drafts scheduled for ${todayEST} (Eastern)...`);

    const drafts = await storage.getDraftCities();
    let approved = 0;

    for (const draft of drafts) {
      if (!draft.scheduledDate) continue;

      const scheduledStr = new Date(draft.scheduledDate).toISOString().split('T')[0];
      if (scheduledStr === todayEST) {
        log(`[Scheduler] Auto-approve: approving "${draft.name}" (${draft.id})`);
        await storage.approveDraft(draft.id);
        approved++;
      }
    }

    if (approved === 0) {
      log(`[Scheduler] Auto-approve: no drafts found for today (${todayEST})`);
    } else {
      log(`[Scheduler] Auto-approve: approved ${approved} city(ies) for today`);
    }
  } catch (error) {
    log(`[Scheduler] Auto-approve ERROR: ${(error as Error).message}`);
  }
}

export function startScheduler() {
  // Generate tomorrow's draft daily at 3pm Eastern (handles EST/EDT automatically)
  cron.schedule("0 15 * * *", generateTomorrowsDraft, { timezone: "America/New_York" });

  // Auto-approve today's drafts at 9am Eastern (handles EST/EDT automatically)
  cron.schedule("0 9 * * *", autoApproveTodaysDrafts, { timezone: "America/New_York" });

  log("[Scheduler] Started — daily draft generation at 2pm Eastern, auto-approve at 9am Eastern");
}
