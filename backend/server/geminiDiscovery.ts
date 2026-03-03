/**
 * Tattoo Discovery — Gemini-powered Natural Language Search
 *
 * Parses user queries like "I want a small, minimalist mountain range on my
 * inner forearm that looks like a sketch" into structured search criteria that
 * can be matched against AI-tagged portfolio data.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./_core/env";
import { logger } from "./_core/logger";

const genAI = new GoogleGenerativeAI(ENV.googleAiApiKey);

const DISCOVERY_PROMPT = `You are a tattoo industry expert. A user is describing the tattoo they want. Parse their description and extract structured search criteria as a JSON object.

Return ONLY a raw JSON object (no markdown fences, no explanation) with these fields:

{
  "styles": string[],       // Tattoo styles that match the description. Pick from: "Traditional", "Neo-Traditional", "Realism", "Hyperrealism", "Watercolor", "Tribal", "Japanese", "Biomechanical", "Geometric", "Dotwork", "Pointillism", "Fine-line", "Minimalist", "Blackwork", "Trash Polka", "New School", "Old School", "Illustrative", "Surrealism", "Lettering", "Chicano", "Ornamental", "Abstract", "Sketch", "Portrait". Return 1-5 styles max.
  "tags": string[],          // Content/subject tags the user is describing. E.g. "floral", "rose", "skull", "dragon", "butterfly", "lion", "clock", "compass", "mandala", "snake", "eagle", "wolf", "heart", "dagger", "anchor", "phoenix", "eye", "tree", "mountain", "moon", "sun", "cross", "angel", "demon", "samurai", "koi fish", "octopus", "waves", "clouds", "fire", "sacred geometry", "lettering", "script", "portrait", "animal", "nature", "mythology". Return 1-8 tags.
  "keywords": string[],      // Additional freeform keywords extracted from the query that don't fit into styles/tags but are useful for text search. E.g. "couples", "matching", "cover-up", "sleeve", "half-sleeve", "backpiece", "colorful", "dark", "feminine", "masculine". Return 0-5 keywords.
  "placement": string | null, // Body placement if mentioned: "arm", "forearm", "upper arm", "wrist", "hand", "finger", "shoulder", "chest", "back", "ribs", "hip", "thigh", "calf", "ankle", "foot", "neck", "behind ear", "collarbone", "spine", "sleeve", "half-sleeve", "full back", or null.
  "size": string | null,      // Size if mentioned: "tiny", "small", "medium", "large", "full-sleeve", "half-sleeve", "backpiece" or null.
  "vibeDescription": string   // A concise 1-sentence summary of what the user wants, optimized for matching against AI-generated image descriptions. Focus on visual characteristics.
}

IMPORTANT:
- Be generous with style matching — if someone says "sketch" or "line drawing", include both "Sketch" and "Fine-line".
- If someone says "realistic" or "photo-realistic", include "Realism" and possibly "Hyperrealism" or "Portrait".
- "Norse mythology" should map to tags like "mythology", "viking", and styles like "Blackwork", "Traditional".
- "Couples" or "matching" tattoos should go into keywords.
- Always return at least 1 style and 1 tag. Make reasonable inferences from context.
- Return ONLY the raw JSON object.`;

export interface DiscoveryIntent {
  styles: string[];
  tags: string[];
  keywords: string[];
  placement: string | null;
  size: string | null;
  vibeDescription: string;
}

const DEFAULT_INTENT: DiscoveryIntent = {
  styles: [],
  tags: [],
  keywords: [],
  placement: null,
  size: null,
  vibeDescription: "",
};

/**
 * Parse a natural language tattoo query into structured search criteria using Gemini.
 *
 * @param query - The user's natural language description (e.g. "I want a small, minimalist mountain range on my inner forearm that looks like a sketch")
 * @returns Structured intent with styles, tags, keywords, placement, size, and a vibe description
 */
export async function parseDiscoveryQuery(
  query: string
): Promise<DiscoveryIntent> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      DISCOVERY_PROMPT,
      `User query: "${query}"`,
    ]);

    const text = result.response.text().trim();

    // Strip markdown fences if present
    let jsonText = text;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonText);

    // Validate and normalize
    const intent: DiscoveryIntent = {
      styles: Array.isArray(parsed.styles) ? parsed.styles.slice(0, 5) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
      placement: typeof parsed.placement === "string" ? parsed.placement : null,
      size: typeof parsed.size === "string" ? parsed.size : null,
      vibeDescription:
        typeof parsed.vibeDescription === "string"
          ? parsed.vibeDescription.slice(0, 300)
          : "",
    };

    logger.info(
      `Discovery query parsed: "${query}" => styles=[${intent.styles.join(", ")}] tags=[${intent.tags.join(", ")}] placement=${intent.placement} size=${intent.size}`
    );

    return intent;
  } catch (error) {
    logger.error("Gemini Discovery query parsing failed:", error);
    return DEFAULT_INTENT;
  }
}
