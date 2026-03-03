/**
 * Request-to-Bid Optimization — Gemini AI Services
 *
 * 1. Prompt Refiner: Analyzes client tattoo request descriptions and suggests
 *    clarifying questions when the request is too vague.
 *
 * 2. Bid Assistant: Drafts initial bid responses for Professional/Icon tier
 *    artists based on the artist's profile, pricing patterns, and tone.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./_core/env";
import { logger } from "./_core/logger";

const genAI = new GoogleGenerativeAI(ENV.googleAiApiKey);

// ============================================
// PROMPT REFINER (Client Side)
// ============================================

const REFINER_PROMPT = `You are a tattoo consultation expert helping clients create better tattoo requests. Analyze the client's request and assess if the description provides enough detail for an artist to give an accurate bid.

A COMPLETE request should ideally include: specific subject matter, style preference, size indication, color preference, placement specifics, and any meaningful visual details.

Return ONLY a raw JSON object (no markdown fences, no explanation) with these fields:

{
  "isComplete": boolean,          // true if the description is detailed enough for artists to bid confidently
  "completenessScore": number,    // 1-10 score of how complete the description is
  "missingAspects": string[],     // Aspects that are missing or too vague. Pick from: "style", "subject_detail", "size", "color_preference", "placement_specifics", "visual_references", "mood_or_theme", "elements_to_include", "elements_to_avoid", "background_or_filler"
  "suggestedQuestions": string[],  // 1-5 specific follow-up questions the client should answer. Make these conversational and helpful, NOT generic. Tailor them to what the client has already described. E.g. if they said "I want a sleeve" ask about the theme, not about placement.
  "improvedDescription": string | null,  // If the description is quite vague (score < 5), suggest an improved version that keeps the client's intent but adds helpful placeholders. null if score >= 5.
  "tip": string                   // A short, friendly tip about what makes a great tattoo request (1 sentence max)
}

IMPORTANT:
- If the request is already detailed (score 7+), keep suggestedQuestions to 1-2 minor refinements.
- For very vague requests (score < 4), give 3-5 questions.
- Questions should be specific to their tattoo idea, not generic templates.
- If they mentioned a style already, don't ask about style. If they mentioned placement, don't ask about placement.
- Be encouraging, not critical. Frame suggestions as "to help artists give you the best possible bid..."
- Return ONLY the raw JSON object.`;

export interface PromptRefinerResult {
  isComplete: boolean;
  completenessScore: number;
  missingAspects: string[];
  suggestedQuestions: string[];
  improvedDescription: string | null;
  tip: string;
}

/**
 * Analyze a client's tattoo request description and suggest improvements.
 *
 * @param description - The client's tattoo request description
 * @param context - Additional context about the request (style, placement, size, etc.)
 * @returns Analysis with completeness score, missing aspects, and suggested questions
 */
export async function refineRequestPrompt(
  description: string,
  context?: {
    title?: string;
    style?: string;
    placement?: string;
    size?: string;
    colorPreference?: string;
  }
): Promise<PromptRefinerResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Build context string from form fields already filled
    const contextParts: string[] = [];
    if (context?.title) contextParts.push(`Title: "${context.title}"`);
    if (context?.style) contextParts.push(`Style: ${context.style}`);
    if (context?.placement) contextParts.push(`Placement: ${context.placement}`);
    if (context?.size) contextParts.push(`Size: ${context.size}`);
    if (context?.colorPreference) contextParts.push(`Color: ${context.colorPreference}`);

    const contextStr = contextParts.length > 0
      ? `\n\nThe client has also filled in these form fields:\n${contextParts.join("\n")}`
      : "";

    const result = await model.generateContent([
      REFINER_PROMPT,
      `Client's description: "${description}"${contextStr}`,
    ]);

    const text = result.response.text().trim();

    let jsonText = text;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonText);

    const analysis: PromptRefinerResult = {
      isComplete: typeof parsed.isComplete === "boolean" ? parsed.isComplete : false,
      completenessScore:
        typeof parsed.completenessScore === "number"
          ? Math.max(1, Math.min(10, Math.round(parsed.completenessScore)))
          : 5,
      missingAspects: Array.isArray(parsed.missingAspects) ? parsed.missingAspects.slice(0, 10) : [],
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
        ? parsed.suggestedQuestions.slice(0, 5)
        : [],
      improvedDescription:
        typeof parsed.improvedDescription === "string"
          ? parsed.improvedDescription.slice(0, 2000)
          : null,
      tip: typeof parsed.tip === "string" ? parsed.tip.slice(0, 200) : "",
    };

    logger.info(
      `Prompt refiner: score=${analysis.completenessScore}/10, questions=${analysis.suggestedQuestions.length}, complete=${analysis.isComplete}`
    );

    return analysis;
  } catch (error) {
    logger.error("Gemini Prompt Refiner failed:", error);
    return {
      isComplete: true, // Don't block submission on AI failure
      completenessScore: 5,
      missingAspects: [],
      suggestedQuestions: [],
      improvedDescription: null,
      tip: "Add as much detail as possible to help artists give you an accurate bid.",
    };
  }
}

// ============================================
// BID ASSISTANT (Artist Side)
// ============================================

const BID_ASSISTANT_PROMPT = `You are a professional tattoo artist's assistant. Draft a bid response for a tattoo request based on the artist's profile and the client's request details.

The bid should be professional, personable, and confident. Match the tone to a real tattoo artist — friendly but experienced. Include:
1. A brief acknowledgment of what the client wants
2. Why this artist is a good fit (reference their styles/experience)
3. A price rationale (not just a number — explain what's included)
4. Availability/timeline info
5. An invitation to discuss further

Return ONLY a raw JSON object (no markdown fences, no explanation) with these fields:

{
  "message": string,              // The drafted bid message (150-400 words). Professional, warm, specific to this request. DO NOT use emojis.
  "suggestedPrice": number,       // Suggested price in whole dollars based on the request details and market rates. Consider: size, complexity, style, placement, color vs B&W.
  "suggestedHours": number,       // Estimated hours for the session(s)
  "pricingRationale": string,     // Brief internal note explaining the price reasoning (for the artist to review, not sent to client)
  "toneNotes": string             // Brief note about the tone/approach used so the artist can adjust
}

PRICING GUIDELINES (USD):
- Tiny (< 2in): $50-150
- Small (2-4in): $100-300
- Medium (4-6in): $200-500
- Large (6-10in): $400-1000
- Extra Large (10+in): $800-2000+
- Half Sleeve: $1000-3000
- Full Sleeve: $2000-5000+
- Back Piece: $3000-8000+
- Realism/Hyperrealism: +30-50% premium
- Color vs B&W: Color typically +20-30%
- Complex detail (geometric, dotwork): +20%

IMPORTANT:
- Personalize to the artist's actual specialties and style
- If the request falls within the artist's styles, emphasize that
- Always be honest — if the request is outside the artist's listed styles, mention versatility but be transparent
- Stay within the client's stated budget if provided
- Return ONLY the raw JSON object.`;

export interface BidAssistantResult {
  message: string;
  suggestedPrice: number;
  suggestedHours: number;
  pricingRationale: string;
  toneNotes: string;
}

/**
 * Draft a bid response for a tattoo request based on the artist's profile.
 * Available for Professional and Icon (frontPage) tier artists only.
 *
 * @param request - The tattoo request details
 * @param artist - The artist's profile with styles, experience, etc.
 * @returns Drafted bid with message, suggested price, and hours
 */
export async function draftBidResponse(
  request: {
    title: string;
    description: string;
    style?: string | null;
    placement: string;
    size: string;
    colorPreference?: string | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    desiredTimeframe?: string | null;
  },
  artist: {
    shopName: string;
    bio?: string | null;
    styles?: string | null;
    specialties?: string | null;
    experience?: number | null;
    city?: string | null;
    state?: string | null;
  }
): Promise<BidAssistantResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Build request context
    const requestContext = [
      `Title: "${request.title}"`,
      `Description: "${request.description}"`,
      request.style ? `Style: ${request.style}` : null,
      `Placement: ${request.placement}`,
      `Size: ${request.size}`,
      request.colorPreference ? `Color Preference: ${request.colorPreference.replace("_", " & ")}` : null,
      request.budgetMin || request.budgetMax
        ? `Budget: ${request.budgetMin ? `$${(request.budgetMin / 100).toFixed(0)}` : "?"} - ${request.budgetMax ? `$${(request.budgetMax / 100).toFixed(0)}` : "?"}`
        : null,
      request.desiredTimeframe ? `Timeframe: ${request.desiredTimeframe}` : null,
    ].filter(Boolean).join("\n");

    // Build artist context
    const artistContext = [
      `Shop/Artist Name: ${artist.shopName}`,
      artist.styles ? `Specializes in: ${artist.styles}` : null,
      artist.specialties ? `Known for: ${artist.specialties}` : null,
      artist.experience ? `${artist.experience} years of experience` : null,
      artist.city && artist.state ? `Based in ${artist.city}, ${artist.state}` : null,
      artist.bio ? `Bio: ${artist.bio}` : null,
    ].filter(Boolean).join("\n");

    const result = await model.generateContent([
      BID_ASSISTANT_PROMPT,
      `CLIENT'S REQUEST:\n${requestContext}\n\nARTIST PROFILE:\n${artistContext}`,
    ]);

    const text = result.response.text().trim();

    let jsonText = text;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonText);

    const draft: BidAssistantResult = {
      message: typeof parsed.message === "string" ? parsed.message.slice(0, 2000) : "",
      suggestedPrice:
        typeof parsed.suggestedPrice === "number" ? Math.max(50, Math.round(parsed.suggestedPrice)) : 200,
      suggestedHours:
        typeof parsed.suggestedHours === "number" ? Math.max(1, Math.round(parsed.suggestedHours)) : 2,
      pricingRationale:
        typeof parsed.pricingRationale === "string" ? parsed.pricingRationale.slice(0, 500) : "",
      toneNotes:
        typeof parsed.toneNotes === "string" ? parsed.toneNotes.slice(0, 300) : "",
    };

    logger.info(
      `Bid assistant draft: $${draft.suggestedPrice}, ${draft.suggestedHours}hrs for "${request.title}"`
    );

    return draft;
  } catch (error) {
    logger.error("Gemini Bid Assistant failed:", error);
    return {
      message: "",
      suggestedPrice: 0,
      suggestedHours: 0,
      pricingRationale: "AI draft generation failed — please write your bid manually.",
      toneNotes: "",
    };
  }
}
