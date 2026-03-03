/**
 * AI Tattoo Generation — Gemini Image Generation Service
 *
 * Generates tattoo design concepts using Google Gemini's image generation.
 * Uses Gemini 2.0 Flash with specialized prompts to produce clean tattoo
 * stencil-style designs on white backgrounds.
 *
 * Results are uploaded to Supabase Storage for permanent access.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./_core/env";
import { logger } from "./_core/logger";
import { uploadFile, getPublicUrl, BUCKETS } from "./_core/supabaseStorage";

const genAI = new GoogleGenerativeAI(ENV.googleAiApiKey);

const TATTOO_GENERATION_PROMPT = `You are a world-class tattoo stencil artist. Create a highly detailed, professional tattoo design based on the following description. The design should:

1. Be rendered as clean black linework suitable for a tattoo stencil
2. Use a plain white background
3. Be well-composed and centered in the frame
4. Include appropriate shading using crosshatching or dotwork techniques
5. Show fine detail that a real tattoo artist could replicate

STYLE DIRECTION: {style}

DESIGN REQUEST:
{prompt}

Generate a single cohesive tattoo design image. The output must be a clear, monochrome (black on white) tattoo-ready stencil design. No text, no watermarks, no borders.`;

const STYLE_MAP: Record<string, string> = {
  traditional: "Bold outlines, limited color palette feel, classic American Traditional with thick lines and iconic imagery",
  "neo-traditional": "Rich detail with bold lines, more complex shading and subtle depth than classic traditional",
  realism: "Photorealistic rendering with detailed shading, smooth gradients, and lifelike proportions",
  watercolor: "Splashy, painterly effects with watercolor-style washes, drips, and soft color transitions",
  japanese: "Irezumi-style with flowing composition, bold outlines, traditional Japanese motifs (waves, clouds, cherry blossoms)",
  geometric: "Precise geometric shapes, sacred geometry patterns, mathematical symmetry and clean lines",
  minimalist: "Ultra-clean single-line or simple linework, minimal detail, elegant simplicity",
  blackwork: "Bold solid black fills, heavy contrast, negative space design",
  dotwork: "Stippled shading, mandala-influenced patterns built from individual dots",
  "fine-line": "Ultra-thin delicate lines, subtle details, refined and elegant",
  tribal: "Bold tribal patterns, solid black geometric motifs, flowing organic shapes",
  biomechanical: "Mechanical components intertwined with organic forms, Giger-inspired",
  illustrative: "Comic/illustration style with dynamic linework and artistic shading",
  sketch: "Raw sketch-like quality with visible pencil strokes and construction lines",
};

export interface GenerationResult {
  imageUrl: string;
  imageKey: string;
}

/**
 * Generate a tattoo design concept using Gemini.
 *
 * @param prompt - User's description of the desired tattoo
 * @param style - Optional tattoo style (traditional, realism, etc.)
 * @param userId - The user ID (for storage path organization)
 * @returns URL and storage key of the generated image
 */
export async function generateTattooDesign(
  prompt: string,
  style: string | undefined,
  userId: number
): Promise<GenerationResult> {
  // Validate prompt
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    throw new Error("Prompt cannot be empty");
  }
  if (trimmedPrompt.length > 2000) {
    throw new Error("Prompt is too long (max 2000 characters)");
  }

  const styleDirection = style && STYLE_MAP[style.toLowerCase()]
    ? STYLE_MAP[style.toLowerCase()]
    : "Clean, versatile tattoo style with detailed linework";

  const fullPrompt = TATTOO_GENERATION_PROMPT
    .replace("{style}", styleDirection)
    .replace("{prompt}", trimmedPrompt);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Use Gemini to generate a detailed text description, then create an image prompt
    // Since Gemini 2.0 Flash is primarily a text model, we generate a very detailed
    // image description that can be paired with an image generation pipeline.
    // For now, we use Gemini's image understanding to create a richly described concept.
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"] as any,
      },
    });

    // Extract image data from the response
    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      throw new Error("No generation candidates returned from Gemini");
    }

    const firstCandidate = candidates[0];
    if (!firstCandidate?.content?.parts) {
      throw new Error("Gemini returned an empty candidate with no content parts");
    }

    // Look for image parts in the response
    let imageData: string | null = null;
    let imageMimeType = "image/png";

    for (const part of firstCandidate.content.parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data;
        imageMimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }

    if (!imageData) {
      throw new Error("Gemini did not return an image. The model may not support image generation for this prompt.");
    }

    // Upload the generated image to Supabase Storage
    const imageBuffer = Buffer.from(imageData, "base64");
    const extension = imageMimeType.includes("png") ? "png" : "jpg";
    const imageKey = `generated/${userId}/${Date.now()}-design.${extension}`;

    await uploadFile(
      BUCKETS.PORTFOLIO_IMAGES,
      imageKey,
      imageBuffer,
      imageMimeType
    );

    const imageUrl = getPublicUrl(BUCKETS.PORTFOLIO_IMAGES, imageKey);

    logger.info(`Tattoo design generated for user #${userId}: ${imageKey}`);

    return { imageUrl, imageKey };
  } catch (error) {
    logger.error("Gemini tattoo generation failed:", error);
    throw error;
  }
}
