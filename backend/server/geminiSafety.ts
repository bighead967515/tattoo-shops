/**
 * Administrative Safety — Gemini AI Services
 *
 * 1. License Verification OCR: Extracts names, dates, and license numbers
 *    from uploaded health permits / state IDs, then cross-references against
 *    the artist's profile to verify authenticity.
 *
 * 2. Review Sentiment Analysis: Analyzes review text for fraudulent patterns,
 *    abusive language, or competitor sabotage, flagging suspicious reviews
 *    for human moderation.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./_core/env";
import { logger } from "./_core/logger";

const genAI = new GoogleGenerativeAI(ENV.googleAiApiKey);

// ============================================
// LICENSE VERIFICATION OCR
// ============================================

const LICENSE_OCR_PROMPT = `You are a document verification specialist. Analyze this uploaded document image and extract all verifiable information. The document should be a tattoo/body art license, health permit, state-issued ID, or business permit related to tattooing.

Return a JSON object with the following fields:

{
  "documentType": string,        // Detected document type: "tattoo_license", "health_permit", "business_permit", "state_id", "drivers_license", "other", "not_a_document"
  "isLegible": boolean,          // Whether the document is legible enough to extract information
  "extractedName": string|null,  // Full name as it appears on the document
  "extractedBusinessName": string|null, // Business/shop name if present
  "licenseNumber": string|null,  // License or permit number if present
  "issuingAuthority": string|null, // Who issued the document (state, county, health department, etc.)
  "issueDate": string|null,      // Issue date in ISO format (YYYY-MM-DD) if present
  "expirationDate": string|null, // Expiration date in ISO format (YYYY-MM-DD) if present
  "isExpired": boolean|null,     // Whether the document appears expired (based on expiration date vs today)
  "state": string|null,          // State/jurisdiction if identifiable
  "confidence": number,          // Overall extraction confidence 0-100
  "issues": string[]             // Any issues detected: "blurry", "partially-obscured", "possibly-altered", "low-resolution", "glare", "cropped", "not-a-license", "expired", "unrecognized-format"
}

IMPORTANT:
- Return ONLY the raw JSON object, no markdown code fences, no explanation.
- If the image is not a document at all, set documentType to "not_a_document" and confidence to 0.
- If the document is too blurry or obscured to read, set isLegible to false and confidence below 30.
- Be conservative with confidence scores — only go above 80 if details are clearly readable.
- Today's date is ${new Date().toISOString().split("T")[0]} — use this to determine if expired.
- Extract names exactly as written on the document (preserve casing, middle names, suffixes).`;

export interface LicenseOCRResult {
  documentType: string;
  isLegible: boolean;
  extractedName: string | null;
  extractedBusinessName: string | null;
  licenseNumber: string | null;
  issuingAuthority: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  isExpired: boolean | null;
  state: string | null;
  confidence: number;
  issues: string[];
}

export interface LicenseVerificationResult extends LicenseOCRResult {
  nameMatch: "exact" | "partial" | "mismatch" | "unavailable";
  nameMatchDetails: string;
  overallVerdict: "verified" | "needs_review" | "rejected";
  verdictReason: string;
}

const DEFAULT_OCR_RESULT: LicenseOCRResult = {
  documentType: "not_a_document",
  isLegible: false,
  extractedName: null,
  extractedBusinessName: null,
  licenseNumber: null,
  issuingAuthority: null,
  issueDate: null,
  expirationDate: null,
  isExpired: null,
  state: null,
  confidence: 0,
  issues: ["analysis-failed"],
};

/**
 * Fuzzy name comparison — handles middle names, abbreviations, casing.
 */
function compareNames(
  extractedName: string | null,
  profileName: string | null
): { match: "exact" | "partial" | "mismatch" | "unavailable"; details: string } {
  if (!extractedName || !profileName) {
    return { match: "unavailable", details: "One or both names are missing" };
  }

  const normalize = (n: string) =>
    n
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .sort();

  const extracted = normalize(extractedName);
  const profile = normalize(profileName);

  // Exact match (all tokens match)
  if (extracted.join(" ") === profile.join(" ")) {
    return { match: "exact", details: `Names match exactly: "${extractedName}"` };
  }

  // Partial match — check if first and last name tokens overlap
  const overlap = extracted.filter((t) => profile.includes(t));
  const overlapRatio = overlap.length / Math.max(extracted.length, profile.length);

  if (overlapRatio >= 0.5) {
    return {
      match: "partial",
      details: `Partial match (${Math.round(overlapRatio * 100)}%): extracted "${extractedName}" vs profile "${profileName}". Common tokens: ${overlap.join(", ")}`,
    };
  }

  return {
    match: "mismatch",
    details: `Name mismatch: extracted "${extractedName}" does not match profile "${profileName}"`,
  };
}

/**
 * Verify a license document using Gemini Vision OCR.
 * Downloads the document image, runs OCR, and cross-references extracted
 * information against the artist's profile.
 *
 * @param imageData - Base64-encoded image data OR a signed URL to fetch from
 * @param mimeType - MIME type of the document image
 * @param artistProfile - Artist profile info for cross-referencing
 * @returns Verification result with OCR data and match status
 */
export async function verifyLicenseDocument(
  imageData: string,
  mimeType: string,
  artistProfile: {
    name: string | null;
    shopName: string | null;
    state: string | null;
  }
): Promise<LicenseVerificationResult> {
  try {
    let base64Data: string;

    // If it looks like a URL, fetch and convert to base64
    if (imageData.startsWith("http")) {
      const response = await fetch(imageData);
      if (!response.ok) {
        logger.warn(`Failed to fetch document for OCR: ${response.status}`);
        return {
          ...DEFAULT_OCR_RESULT,
          nameMatch: "unavailable",
          nameMatchDetails: "Could not fetch document image",
          overallVerdict: "needs_review",
          verdictReason: "Document image could not be retrieved for analysis",
        };
      }
      const arrayBuffer = await response.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString("base64");
      mimeType = response.headers.get("content-type") || mimeType;
    } else {
      base64Data = imageData;
    }

    // Skip OCR for PDFs — Gemini Vision doesn't process PDF documents
    if (mimeType === "application/pdf") {
      return {
        ...DEFAULT_OCR_RESULT,
        documentType: "unknown",
        issues: ["pdf-format-requires-manual-review"],
        nameMatch: "unavailable",
        nameMatchDetails: "PDF documents require manual review",
        overallVerdict: "needs_review",
        verdictReason: "PDF documents cannot be analyzed via OCR — requires manual admin review",
      };
    }

    // Call Gemini Vision for OCR
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      LICENSE_OCR_PROMPT,
      {
        inlineData: {
          mimeType,
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

    const parsed = JSON.parse(jsonText) as LicenseOCRResult;

    // Normalize and validate
    const ocr: LicenseOCRResult = {
      documentType: parsed.documentType || "other",
      isLegible: Boolean(parsed.isLegible),
      extractedName: parsed.extractedName || null,
      extractedBusinessName: parsed.extractedBusinessName || null,
      licenseNumber: parsed.licenseNumber || null,
      issuingAuthority: parsed.issuingAuthority || null,
      issueDate: parsed.issueDate || null,
      expirationDate: parsed.expirationDate || null,
      isExpired: parsed.isExpired ?? null,
      state: parsed.state || null,
      confidence: typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.confidence)))
        : 0,
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    };

    // Cross-reference against artist profile
    const nameComparison = compareNames(ocr.extractedName, artistProfile.name);

    // Also check business/shop name if personal name doesn't match
    let shopNameComparison: ReturnType<typeof compareNames> | null = null;
    if (nameComparison.match === "mismatch" && ocr.extractedBusinessName) {
      shopNameComparison = compareNames(ocr.extractedBusinessName, artistProfile.shopName);
    }

    // Determine overall verdict
    let verdict: LicenseVerificationResult["overallVerdict"];
    let verdictReason: string;

    if (ocr.documentType === "not_a_document") {
      verdict = "rejected";
      verdictReason = "Uploaded file does not appear to be a valid document";
    } else if (!ocr.isLegible || ocr.confidence < 30) {
      verdict = "needs_review";
      verdictReason = "Document is too unclear for automated verification — needs manual review";
    } else if (ocr.isExpired === true) {
      verdict = "rejected";
      verdictReason = `Document appears to be expired (expiration: ${ocr.expirationDate})`;
    } else if (nameComparison.match === "exact" && ocr.confidence >= 70 && !ocr.isExpired) {
      verdict = "verified";
      verdictReason = `Name matches profile exactly, document type: ${ocr.documentType}, confidence: ${ocr.confidence}%`;
    } else if (
      nameComparison.match === "partial" ||
      (shopNameComparison && shopNameComparison.match !== "mismatch")
    ) {
      verdict = "needs_review";
      verdictReason = `Partial name match detected — admin should verify. ${nameComparison.details}`;
    } else if (nameComparison.match === "mismatch") {
      verdict = "needs_review";
      verdictReason = `Name on document does not match profile — possible issue. ${nameComparison.details}`;
    } else {
      verdict = "needs_review";
      verdictReason = "Automated checks inconclusive — requires manual admin review";
    }

    // Add any issues that affect the verdict
    if (ocr.issues.includes("possibly-altered")) {
      verdict = "needs_review";
      verdictReason += " | Document may have been altered";
    }

    logger.info(
      `License OCR: type=${ocr.documentType} confidence=${ocr.confidence} name=${nameComparison.match} verdict=${verdict}`
    );

    return {
      ...ocr,
      nameMatch: nameComparison.match,
      nameMatchDetails: nameComparison.details,
      overallVerdict: verdict,
      verdictReason,
    };
  } catch (error) {
    logger.error("Gemini License OCR failed:", error);
    return {
      ...DEFAULT_OCR_RESULT,
      nameMatch: "unavailable",
      nameMatchDetails: "OCR analysis failed",
      overallVerdict: "needs_review",
      verdictReason: "Automated verification failed — requires manual review",
    };
  }
}

// ============================================
// REVIEW SENTIMENT ANALYSIS
// ============================================

const REVIEW_ANALYSIS_PROMPT = `You are a content moderation specialist for a tattoo artist booking platform. Analyze this review for potential issues that warrant human moderation.

Review details:
- Rating: {rating}/5
- Comment: "{comment}"
- Reviewer has verified booking: {verifiedBooking}

Analyze for the following concerns and return a JSON object:

{
  "overallSentiment": string,     // "positive", "neutral", "negative", "mixed"
  "toxicityScore": number,        // 0-100: How toxic/abusive the language is (0 = completely clean, 100 = severely abusive)
  "spamScore": number,            // 0-100: Likelihood of spam (generic text, SEO stuffing, promotional links, etc.)
  "fraudScore": number,           // 0-100: Likelihood of being fraudulent/fake. Consider:
                                  //   - Suspiciously generic praise/criticism
                                  //   - Mismatch between rating and comment tone
                                  //   - Competitor sabotage patterns (detailed negative review mentioning another shop)
                                  //   - Review bombing language
                                  //   - Impossible claims ("I've never been here but...")
  "flags": string[],              // Specific flags: "abusive-language", "hate-speech", "threats", "personal-info-exposed",
                                  //   "competitor-mention", "spam-link", "fake-positive", "fake-negative",
                                  //   "rating-comment-mismatch", "review-bombing", "irrelevant-content",
                                  //   "harassment", "defamation", "solicitation"
  "moderationAction": string,     // Recommended action: "approve", "flag_for_review", "auto_hide"
  "moderationReason": string,     // Brief explanation for the recommended action
  "summary": string               // 1-sentence summary of the review's content and tone
}

IMPORTANT:
- Return ONLY the raw JSON object, no markdown code fences.
- Most reviews are legitimate — don't over-flag. Only flag genuinely suspicious content.
- A negative review alone is NOT suspicious. Even harsh but factual criticism is legitimate.
- "auto_hide" should only be recommended for clearly abusive, spam, or obviously fake content.
- "flag_for_review" for borderline cases that need human judgment.
- "approve" for reviews that appear legitimate, even if negative.
- Rating-comment mismatch: e.g., 5-star rating with a scathing negative comment or 1-star with glowing praise.
- A verified booking review should have a lower fraud score since it's tied to an actual transaction.`;

export interface ReviewAnalysisResult {
  overallSentiment: string;
  toxicityScore: number;
  spamScore: number;
  fraudScore: number;
  flags: string[];
  moderationAction: "approve" | "flag_for_review" | "auto_hide";
  moderationReason: string;
  summary: string;
}

const DEFAULT_REVIEW_ANALYSIS: ReviewAnalysisResult = {
  overallSentiment: "neutral",
  toxicityScore: 0,
  spamScore: 0,
  fraudScore: 0,
  flags: [],
  moderationAction: "approve",
  moderationReason: "Analysis unavailable — defaulting to approve",
  summary: "Review analysis could not be completed",
};

/**
 * Analyze a review for fraudulent/abusive content using Gemini.
 *
 * @param review - The review to analyze
 * @returns Moderation analysis with scores, flags, and recommended action
 */
export async function analyzeReviewSentiment(review: {
  rating: number;
  comment: string | null;
  verifiedBooking: boolean;
}): Promise<ReviewAnalysisResult> {
  // Skip analysis for reviews without comments — nothing to analyze
  if (!review.comment || review.comment.trim().length === 0) {
    return {
      ...DEFAULT_REVIEW_ANALYSIS,
      moderationReason: "No comment text to analyze — rating-only review auto-approved",
    };
  }

  try {
    const prompt = REVIEW_ANALYSIS_PROMPT
      .replace("{rating}", String(review.rating))
      .replace("{comment}", review.comment.replace(/"/g, '\\"'))
      .replace("{verifiedBooking}", String(review.verifiedBooking ?? false));

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON response — strip markdown fences if present
    let jsonText = text;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonText);

    // Normalize and validate
    const analysis: ReviewAnalysisResult = {
      overallSentiment: ["positive", "neutral", "negative", "mixed"].includes(parsed.overallSentiment)
        ? parsed.overallSentiment
        : "neutral",
      toxicityScore: typeof parsed.toxicityScore === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.toxicityScore)))
        : 0,
      spamScore: typeof parsed.spamScore === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.spamScore)))
        : 0,
      fraudScore: typeof parsed.fraudScore === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.fraudScore)))
        : 0,
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      moderationAction: ["approve", "flag_for_review", "auto_hide"].includes(parsed.moderationAction)
        ? parsed.moderationAction
        : "approve",
      moderationReason: typeof parsed.moderationReason === "string"
        ? parsed.moderationReason.slice(0, 500)
        : "No reason provided",
      summary: typeof parsed.summary === "string"
        ? parsed.summary.slice(0, 300)
        : "No summary available",
    };

    logger.info(
      `Review sentiment: ${analysis.overallSentiment} | toxicity=${analysis.toxicityScore} spam=${analysis.spamScore} fraud=${analysis.fraudScore} | action=${analysis.moderationAction}`
    );

    return analysis;
  } catch (error) {
    logger.error("Gemini review sentiment analysis failed:", error);
    return DEFAULT_REVIEW_ANALYSIS;
  }
}
