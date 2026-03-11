/**
 * AI Tattoo Generation — Hugging Face Image Generation Service
 *
 * Generates tattoo design concepts using Hugging Face image generation.
 * Uses text-to-image models with specialized prompts to produce clean tattoo
 * stencil-style designs on white backgrounds.
 *
 * Results are uploaded to Supabase Storage for permanent access.
 */

import { generateImageWithHuggingFace } from "./_core/aiProviders";
import { logger } from "./_core/logger";
import { uploadFile, getPublicUrl, BUCKETS } from "./_core/supabaseStorage";

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
  traditional:
    "Bold outlines, limited color palette feel, classic American Traditional with thick lines and iconic imagery",
  "neo-traditional":
    "Rich detail with bold lines, more complex shading and subtle depth than classic traditional",
  realism:
    "Photorealistic rendering with detailed shading, smooth gradients, and lifelike proportions",
  watercolor:
    "Splashy, painterly effects with watercolor-style washes, drips, and soft color transitions",
  japanese:
    "Irezumi-style with flowing composition, bold outlines, traditional Japanese motifs (waves, clouds, cherry blossoms)",
  geometric:
    "Precise geometric shapes, sacred geometry patterns, mathematical symmetry and clean lines",
  minimalist:
    "Ultra-clean single-line or simple linework, minimal detail, elegant simplicity",
  blackwork: "Bold solid black fills, heavy contrast, negative space design",
  dotwork:
    "Stippled shading, mandala-influenced patterns built from individual dots",
  "fine-line": "Ultra-thin delicate lines, subtle details, refined and elegant",
  tribal:
    "Bold tribal patterns, solid black geometric motifs, flowing organic shapes",
  biomechanical:
    "Mechanical components intertwined with organic forms, Giger-inspired",
  illustrative:
    "Comic/illustration style with dynamic linework and artistic shading",
  sketch:
    "Raw sketch-like quality with visible pencil strokes and construction lines",
};

export interface GenerationResult {
  imageUrl: string;
  imageKey: string;
}

/**
 * Generate a tattoo design concept using Hugging Face.
 *
 * @param prompt - User's description of the desired tattoo
 * @param style - Optional tattoo style (traditional, realism, etc.)
 * @param userId - The user ID (for storage path organization)
 * @returns URL and storage key of the generated image
 */
export async function generateTattooDesign(
  prompt: string,
  style: string | undefined,
  userId: number,
): Promise<GenerationResult> {
  // Validate prompt
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    throw new Error("Prompt cannot be empty");
  }
  if (trimmedPrompt.length > 2000) {
    throw new Error("Prompt is too long (max 2000 characters)");
  }

  const styleDirection =
    style && STYLE_MAP[style.toLowerCase()]
      ? STYLE_MAP[style.toLowerCase()]
      : "Clean, versatile tattoo style with detailed linework";

  const fullPrompt = TATTOO_GENERATION_PROMPT.replace(
    "{style}",
    styleDirection,
  ).replace("{prompt}", trimmedPrompt);

  try {
    const { buffer: imageBuffer, mimeType: imageMimeType } =
      await generateImageWithHuggingFace(fullPrompt);

    // Upload the generated image to Supabase Storage
    const extension = imageMimeType.includes("png")
      ? "png"
      : imageMimeType.includes("webp")
        ? "webp"
        : "jpg";
    const imageKey = `generated/${userId}/${Date.now()}-design.${extension}`;

    await uploadFile(
      BUCKETS.PORTFOLIO_IMAGES,
      imageKey,
      imageBuffer,
      imageMimeType,
    );

    const imageUrl = getPublicUrl(BUCKETS.PORTFOLIO_IMAGES, imageKey);

    logger.info(`Tattoo design generated for user #${userId}: ${imageKey}`);

    return { imageUrl, imageKey };
  } catch (error) {
    logger.error("Hugging Face tattoo generation failed:", error);
    throw error;
  }
}
