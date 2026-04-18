import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

// Separate client for TTS — must use the Replit AI Integrations proxy (gpt-audio model)
const ttsOpenai = process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
  ? new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  })
  : openai;

export interface CityContentGeneration {
  morning: {
    title: string;
    content: string;
    landmark: string;
  };
  afternoon: {
    title: string;
    content: string;
    food: string;
  };
  evening: {
    title: string;
    content: string;
    budgetTip: string;
  };
  bonus: {
    title: string;
    content: string;
    funFact: string;
  };
  luxury: {
    title: string;
    content: string;
    luxuryExperience: string;
  };
  wildlife: {
    title: string;
    content: string;
    natureActivity: string;
  };
  highlights: string[]; // 5 scannable key facts about the city
}

export async function generateCityContent(cityName: string, country: string, focus: string = "balanced"): Promise<CityContentGeneration> {
  try {
    const focusPrompts = {
      balanced: "covering landmarks, food, culture, and budget tips equally",
      cultural: "focusing heavily on cultural heritage, traditions, and history",
      food: "emphasizing local cuisine, restaurants, and culinary experiences",
      architecture: "highlighting architectural marvels, buildings, and design",
      budget: "prioritizing budget-friendly activities and money-saving tips",
      luxury: "emphasizing high-end experiences, luxury hotels, fine dining, and premium activities",
      nature: "focusing on natural attractions, wildlife encounters, outdoor adventures, and eco-experiences"
    };

    const focusDescription = focusPrompts[focus as keyof typeof focusPrompts] || focusPrompts.balanced;

    const prompt = `Generate comprehensive daily travel content for ${cityName}, ${country}, ${focusDescription}.

  This destination is in the United States. Keep all writing in a USA domestic travel context only.
  Do not frame this as an international destination, foreign city guide, or overseas trip.
  Do not mention passports, international flights, currency exchange, or cross-border travel.

Create exactly 6 content cards in JSON format:

1. MORNING CARD - Wake up in [City] (Landmark focus)
   - Highlight the most iconic landmark
   - Inspiring morning description
   - Make it feel like the reader is there

2. AFTERNOON CARD - Taste of [City] (Food/Culture focus)  
   - Feature a must-try local dish or drink
   - Include cultural context
   - Mention where to find it

3. EVENING CARD - Budget Smart (Money-saving tip)
   - Provide one practical budget tip
   - Should save significant money
   - Be specific and actionable

4. BONUS CARD - Did You Know? (Fun fact)
   - Share a surprising historical or cultural fact
   - Make it memorable and conversation-worthy
   - Should make people want to share it

5. LUXURY CARD - Indulge in [City] (High-end experience)
   - Feature the best luxury experience or accommodation
   - Highlight premium dining, spas, or exclusive activities
   - Make it aspirational and special

6. WILDLIFE CARD - Nature & Wildlife (Outdoor adventure)
   - Showcase the best nature or wildlife experience
   - Feature parks, gardens, wildlife viewing, or outdoor activities
   - Connect with the natural side of the destination

7. HIGHLIGHTS - 5 quick-scan facts about this city
   - Each highlight is one crisp sentence (max 15 words)
   - Cover: best known for, must-try food, signature experience, surprising fact, best time to visit
   - Make each one feel like a tweet-sized insight
   - No bullet points in the text — just clean sentences

Write in a friendly, upbeat tone with a hint of wanderlust. Use concise, vivid language that evokes sensory detail (sights, tastes, sounds). Aim for modern and approachable — like a travel-savvy friend sharing a great find. Keep it light, not too literary or academic. Avoid clichés and generic praise. Assume the reader is curious, not committed — spark their imagination in 100 words or less. Think curated Instagram caption meets travel-savvy friend, not Lonely Planet chapter.

Respond with JSON in this exact format:
{
  "morning": {
    "title": "Wake up in [City]",
    "content": "...",
    "landmark": "[main landmark name]"
  },
  "afternoon": {
    "title": "Taste of [City]", 
    "content": "...",
    "food": "[local food/drink name]"
  },
  "evening": {
    "title": "Budget Smart",
    "content": "...", 
    "budgetTip": "[concise tip]"
  },
  "bonus": {
    "title": "Did You Know?",
    "content": "...",
    "funFact": "[fact summary]"
  },
  "luxury": {
    "title": "Indulge in [City]",
    "content": "...",
    "luxuryExperience": "[luxury experience name]"
  },
  "wildlife": {
    "title": "Nature & Wildlife",
    "content": "...",
    "natureActivity": "[nature activity name]"
  },
  "highlights": [
    "Highlight sentence one about this city.",
    "Highlight sentence two about this city.",
    "Highlight sentence three about this city.",
    "Highlight sentence four about this city.",
    "Highlight sentence five about this city."
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a travel-savvy friend who creates casual, wanderlust-sparking city content for USA destinations only. Write like curated Instagram captions — vivid, sensory, modern, and approachable. Avoid literary or academic tone. Spark curiosity with light, friendly language. Never treat the destination as international or overseas. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      // GPT-5 only supports default temperature (1), removed custom temperature
    });

    const result = JSON.parse(response.choices[0].message.content!);

    // Validate all required card fields are present before returning
    const requiredCards = ["morning", "afternoon", "evening", "bonus", "luxury", "wildlife"] as const;
    for (const cardType of requiredCards) {
      if (!result[cardType] || typeof result[cardType].title !== "string" || typeof result[cardType].content !== "string") {
        console.error(`[OpenAI] Missing or malformed card "${cardType}" in response:`, JSON.stringify(result).slice(0, 500));
        throw new Error(`AI response missing required card: ${cardType}`);
      }
    }
    if (!Array.isArray(result.highlights) || result.highlights.length === 0) {
      console.error("[OpenAI] Missing highlights in response");
      throw new Error("AI response missing highlights array");
    }

    return result as CityContentGeneration;
  } catch (error) {
    console.error("Error generating city content:", error);
    throw new Error("Failed to generate city content: " + (error as Error).message);
  }
}

export async function generateCityHeroImage(cityName: string, country: string): Promise<Buffer> {
  const prompt = `Breathtaking travel photography of ${cityName}, ${country}. Iconic city skyline or landmark scene at golden hour. Vibrant colors, cinematic composition, professional travel magazine quality. Wide angle landscape shot. Photorealistic. No text, no watermarks, no people in foreground.`;

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1792x1024",
    quality: "standard",
    response_format: "url",
  });

  const imageUrl = response.data[0].url!;
  const fetchRes = await fetch(imageUrl);
  if (!fetchRes.ok) throw new Error("Failed to download DALL-E image");
  const arrayBuffer = await fetchRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generateCityImageSuggestions(cityName: string, cardType: string): Promise<string[]> {
  try {
    const prompt = `Suggest 3 specific, searchable image queries for ${cityName} for a ${cardType} travel card. 
    
    Each suggestion should be:
    - Specific enough to find quality stock photos
    - Relevant to ${cardType === 'morning' ? 'landmarks and morning scenes' :
        cardType === 'afternoon' ? 'local food and cultural activities' :
          cardType === 'evening' ? 'budget-friendly activities and practical scenes' :
            cardType === 'bonus' ? 'historical or cultural scenes' :
              cardType === 'luxury' ? 'luxury hotels, fine dining, and premium experiences' :
                'nature, wildlife, parks, and outdoor activities'}
    - Professional travel photography style
    
    Return as JSON array of strings: ["query1", "query2", "query3"]`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a travel photographer who knows what makes great travel images. Respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result.suggestions || result;
  } catch (error) {
    console.error("Error generating image suggestions:", error);
    throw new Error("Failed to generate image suggestions: " + (error as Error).message);
  }
}

// ─── Text-to-Speech ──────────────────────────────────────────────────────────

function splitChunks(text: string, max = 2000): string[] {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > max) {
    let cut = remaining.lastIndexOf(". ", max);
    if (cut === -1) cut = remaining.lastIndexOf(" ", max);
    if (cut === -1) cut = max;
    else cut += 1;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

async function ttsChunk(text: string): Promise<Buffer> {
  const response = await ttsOpenai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: "onyx", format: "mp3" },
    messages: [
      { role: "system", content: "You are an assistant that performs text-to-speech." },
      { role: "user", content: `Repeat the following text verbatim: ${text}` },
    ],
  } as any);
  const audioData = (response.choices[0]?.message as any)?.audio?.data ?? "";
  return Buffer.from(audioData, "base64");
}

export async function textToSpeech(text: string): Promise<Buffer> {
  const chunks = splitChunks(text);
  const buffers = await Promise.all(chunks.map(ttsChunk));
  return Buffer.concat(buffers);
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export async function textToSpeechWithTimestamps(text: string): Promise<{
  buffer: Buffer;
  timestamps: WordTimestamp[];
}> {
  const buffer = await textToSpeech(text);

  try {
    // Whisper needs a File-like object wrapping the buffer
    const audioFile = new File([buffer], "audio.mp3", { type: "audio/mpeg" });
    const transcription = await ttsOpenai.audio.transcriptions.create({
      file: audioFile as any,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
    } as any);
    const timestamps: WordTimestamp[] = ((transcription as any).words ?? []).map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }));
    return { buffer, timestamps };
  } catch (err) {
    console.warn("[TTS] Whisper timestamps unavailable, proceeding without highlighting:", (err as Error).message);
    return { buffer, timestamps: [] };
  }
}
