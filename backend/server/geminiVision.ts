/**
 * Smart Portfolio Tagging — Hugging Face + Groq Service
 *
 * Analyzes uploaded portfolio images using Hugging Face image captioning and
 * Groq JSON extraction to:
 * 1. Detect tattoo styles (Traditional, Biomechanical, Fine-line, etc.)
 * 2. Tag content/subjects (floral, skulls, geometric, etc.)
 * 3. Generate SEO descriptions
 * 4. Score image quality and flag issues (blurry, low-res, etc.)
 */

import dns from "dns";
import { isIPv4, isIPv6 } from "net";
import {
  groqGenerateJson,
  imageToTextWithHuggingFace,
} from "./_core/aiProviders";
import { logger } from "./_core/logger";

const ANALYSIS_PROMPT = `You are a tattoo industry expert and image analyst. You will receive an image caption and technical metadata produced by an upstream vision model. Infer likely tattoo attributes and return a JSON object with the following fields. Be precise and concise.

{
  "styles": string[],         // Detected tattoo styles. Pick from: "Traditional", "Neo-Traditional", "Realism", "Hyperrealism", "Watercolor", "Tribal", "Japanese", "Biomechanical", "Geometric", "Dotwork", "Pointillism", "Fine-line", "Minimalist", "Blackwork", "Trash Polka", "New School", "Old School", "Illustrative", "Surrealism", "Lettering", "Chicano", "Ornamental", "Abstract", "Sketch", "Portrait". Return 1-4 styles max.
  "tags": string[],           // Content/subject tags describing what is depicted. E.g. "floral", "rose", "skull", "dragon", "butterfly", "lion", "clock", "compass", "mandala", "snake", "eagle", "wolf", "heart", "dagger", "anchor", "phoenix", "eye", "tree", "mountain", "moon", "sun", "cross", "angel", "demon", "samurai", "koi fish", "octopus", "waves", "clouds", "fire", "sacred geometry". Return 2-8 tags.
  "description": string,      // A 1-2 sentence SEO-friendly description of the tattoo for search indexing. Mention the style and subject matter.
  "qualityScore": number,     // Image quality from 1-100. Consider: focus/sharpness, lighting, resolution clarity, composition, color accuracy. A well-lit, sharp, properly framed photo of a healed tattoo = 80-100. Slightly soft/uneven lighting = 50-79. Blurry, dark, or very low resolution = below 50.
  "qualityIssues": string[]   // List any issues: "blurry", "low-resolution", "poor-lighting", "overexposed", "underexposed", "out-of-focus", "excessive-glare", "watermark", "heavy-filter", "not-a-tattoo". Empty array if no issues.
}

IMPORTANT:
- Return ONLY the raw JSON object, no markdown code fences, no explanation.
 - If the caption suggests this is not a tattoo, include "not-a-tattoo" in qualityIssues and give qualityScore below 30.
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
 * Strip query parameters from URLs before logging to avoid leaking signed tokens.
 */
function sanitizeUrlForLogging(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return "[invalid-url]";
  }
}

/**
 * Check if an IP address falls within private, loopback, or reserved ranges.
 * Covers RFC1918, loopback, link-local, CGN, IPv6 equivalents, and IPv4-mapped IPv6.
 */
function isPrivateOrReservedIp(ip: string): boolean {
  // Handle IPv4-mapped IPv6 (::ffff:x.x.x.x)
  const v4Mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4Mapped) return isPrivateOrReservedIp(v4Mapped[1]);

  if (isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.some((p) => isNaN(p))) return true; // Malformed
    const [a, b] = parts;
    if (ip === "0.0.0.0") return true;
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGN
    return false;
  }

  if (isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // IPv6 loopback
    if (lower === "::") return true; // Unspecified
    if (/^f[cd]/i.test(lower)) return true; // fc00::/7 unique-local
    if (/^fe[89ab]/i.test(lower)) return true; // fe80::/10 link-local
    if (lower.startsWith("::ffff:")) return true; // IPv4-mapped (caught above, safety net)
    return false;
  }

  // Not a valid IP format — treat as suspicious
  return true;
}

/**
 * Analyze a portfolio image using Hugging Face captioning + Groq extraction.
 * Fetches the image from its public URL and derives structured metadata.
 *
 * @param imageUrl - The public URL of the uploaded image
 * @returns Analysis result with styles, tags, description, quality score, and issues
 */
export async function analyzePortfolioImage(
  imageUrl: string,
): Promise<PortfolioAnalysis> {
  try {
    // Validate URL to prevent SSRF — only allow HTTPS and block private/reserved IPs
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      logger.warn(
        `Invalid image URL for analysis: ${sanitizeUrlForLogging(imageUrl)}`,
      );
      return DEFAULT_ANALYSIS;
    }
    if (parsedUrl.protocol !== "https:") {
      logger.warn(`Rejected non-HTTPS image URL: ${parsedUrl.protocol}`);
      return DEFAULT_ANALYSIS;
    }

    // Resolve hostname to IP addresses and validate against private/reserved ranges
    const hostname = parsedUrl.hostname.toLowerCase();
    try {
      const resolvedAddresses = await dns.promises.lookup(hostname, {
        all: true,
      });
      for (const { address } of resolvedAddresses) {
        if (isPrivateOrReservedIp(address)) {
          logger.warn(
            `Rejected image URL resolving to private/reserved IP: ${hostname} → ${address}`,
          );
          return DEFAULT_ANALYSIS;
        }
      }
    } catch {
      logger.warn(`DNS resolution failed for image URL hostname: ${hostname}`);
      return DEFAULT_ANALYSIS;
    }

    // Fetch the image as a buffer with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
    let response: Response;
    try {
      response = await fetch(imageUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      logger.warn(
        `Failed to fetch image for analysis: ${response.status} ${sanitizeUrlForLogging(imageUrl)}`,
      );
      return DEFAULT_ANALYSIS;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Step 1: Hugging Face captioning for image understanding
    const caption = await imageToTextWithHuggingFace(
      imageBuffer,
      contentType,
      "caption",
    );

    // Step 2: Groq structured extraction from caption + metadata
    const parsed = await groqGenerateJson<Partial<PortfolioAnalysis>>(
      ANALYSIS_PROMPT,
      `Image caption: "${caption.slice(0, 1200)}"
Content-Type: ${contentType}
ByteLength: ${imageBuffer.length}

Return the JSON object only.`,
      { maxTokens: 1200 },
    );

    // Validate and normalize the response
    const analysis: PortfolioAnalysis = {
      styles: Array.isArray(parsed.styles) ? parsed.styles.slice(0, 4) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
      description:
        typeof parsed.description === "string"
          ? parsed.description.slice(0, 500)
          : "",
      qualityScore:
        typeof parsed.qualityScore === "number"
          ? Math.max(1, Math.min(100, Math.round(parsed.qualityScore)))
          : 65,
      qualityIssues: Array.isArray(parsed.qualityIssues)
        ? parsed.qualityIssues
        : [],
    };

    logger.info(
      `Portfolio image analyzed: ${analysis.styles.join(", ")} | quality=${analysis.qualityScore} | tags=${analysis.tags.length}`,
    );

    return analysis;
  } catch (error) {
    logger.error("Hugging Face/Groq portfolio analysis failed:", error);
    return DEFAULT_ANALYSIS;
  }
}
