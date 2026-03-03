/**
 * Smart Portfolio Tagging — Gemini Vision Service
 *
 * Analyzes uploaded portfolio images using Google Gemini to:
 * 1. Detect tattoo styles (Traditional, Biomechanical, Fine-line, etc.)
 * 2. Tag content/subjects (floral, skulls, geometric, etc.)
 * 3. Generate SEO descriptions
 * 4. Score image quality and flag issues (blurry, low-res, etc.)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./_core/env";
import { logger } from "./_core/logger";

const genAI = new GoogleGenerativeAI(ENV.googleAiApiKey);

const ANALYSIS_PROMPT = `You are a tattoo industry expert and image analyst. Analyze this tattoo portfolio image and return a JSON object with the following fields. Be precise and concise.

{
  "styles": string[],         // Detected tattoo styles. Pick from: "Traditional", "Neo-Traditional", "Realism", "Hyperrealism", "Watercolor", "Tribal", "Japanese", "Biomechanical", "Geometric", "Dotwork", "Pointillism", "Fine-line", "Minimalist", "Blackwork", "Trash Polka", "New School", "Old School", "Illustrative", "Surrealism", "Lettering", "Chicano", "Ornamental", "Abstract", "Sketch", "Portrait". Return 1-4 styles max.
  "tags": string[],           // Content/subject tags describing what is depicted. E.g. "floral", "rose", "skull", "dragon", "butterfly", "lion", "clock", "compass", "mandala", "snake", "eagle", "wolf", "heart", "dagger", "anchor", "phoenix", "eye", "tree", "mountain", "moon", "sun", "cross", "angel", "demon", "samurai", "koi fish", "octopus", "waves", "clouds", "fire", "sacred geometry". Return 2-8 tags.
  "description": string,      // A 1-2 sentence SEO-friendly description of the tattoo for search indexing. Mention the style and subject matter.
  "qualityScore": number,     // Image quality from 1-100. Consider: focus/sharpness, lighting, resolution clarity, composition, color accuracy. A well-lit, sharp, properly framed photo of a healed tattoo = 80-100. Slightly soft/uneven lighting = 50-79. Blurry, dark, or very low resolution = below 50.
  "qualityIssues": string[]   // List any issues: "blurry", "low-resolution", "poor-lighting", "overexposed", "underexposed", "out-of-focus", "excessive-glare", "watermark", "heavy-filter", "not-a-tattoo". Empty array if no issues.
}

IMPORTANT:
- Return ONLY the raw JSON object, no markdown code fences, no explanation.
- If the image is not a tattoo, still analyze it but include "not-a-tattoo" in qualityIssues and give qualityScore below 30.
- Be conservative with quality scores — most phone photos of tattoos score 60-85.`;

export interface PortfolioAnalysis {
  styles: string[];
  tags: string[];
  description: string;
  qualityScore: number;
  qualityIssues: string[];
}

const DEFAULT_ANALYSIS: PortfolioAnalysis = {
  styles: [],
  tags: [],
  description: "",
  qualityScore: 0,
  qualityIssues: ["analysis-failed"],
};

/**
 * Analyze a portfolio image using Gemini Vision.
 * Fetches the image from its public URL and sends it to Gemini for analysis.
 *
 * @param imageUrl - The public URL of the uploaded image
 * @returns Analysis result with styles, tags, description, quality score, and issues
 */
export async function analyzePortfolioImage(
  imageUrl: string
): Promise<PortfolioAnalysis> {
  try {
    // Fetch the image as a buffer
    const response = await fetch(imageUrl);
    if (!response.ok) {
      logger.warn(`Failed to fetch image for analysis: ${response.status} ${imageUrl}`);
      return DEFAULT_ANALYSIS;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Call Gemini Vision
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      ANALYSIS_PROMPT,
      {
        inlineData: {
          mimeType: contentType,
          data: base64Data,
        },
      },
    ]);

    const text = result.response.text().trim();

    // Parse JSON response — strip markdown fences if present
    let jsonText = text;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonText);

    // Validate and normalize the response
    const analysis: PortfolioAnalysis = {
      styles: Array.isArray(parsed.styles) ? parsed.styles.slice(0, 4) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
      description: typeof parsed.description === "string" ? parsed.description.slice(0, 500) : "",
      qualityScore:
        typeof parsed.qualityScore === "number"
          ? Math.max(1, Math.min(100, Math.round(parsed.qualityScore)))
          : 0,
      qualityIssues: Array.isArray(parsed.qualityIssues) ? parsed.qualityIssues : [],
    };

    logger.info(
      `Portfolio image analyzed: ${analysis.styles.join(", ")} | quality=${analysis.qualityScore} | tags=${analysis.tags.length}`
    );

    return analysis;
  } catch (error) {
    logger.error("Gemini Vision analysis failed:", error);
    return DEFAULT_ANALYSIS;
  }
}
