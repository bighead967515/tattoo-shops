import OpenAI from "openai";
import { ENV } from "./env";

const GROQ_BASE_URL = ENV.groqBaseUrl || "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL = ENV.groqModel || "llama-3.3-70b-versatile";

const HF_BASE_URL = "https://api-inference.huggingface.co/models";
const DEFAULT_HF_IMAGE_MODEL =
  ENV.huggingFaceImageModel || "stabilityai/stable-diffusion-xl-base-1.0";
const DEFAULT_HF_CAPTION_MODEL =
  ENV.huggingFaceCaptionModel || "Salesforce/blip-image-captioning-large";
const DEFAULT_HF_OCR_MODEL =
  ENV.huggingFaceOcrModel || "microsoft/trocr-base-printed";

const groqClient = new OpenAI({
  apiKey: ENV.groqApiKey,
  baseURL: GROQ_BASE_URL,
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

export function parseJsonFromModel<T>(text: string): T {
  const stripped = stripCodeFences(text);

  try {
    return JSON.parse(stripped) as T;
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON object found in model response");
    }
    return JSON.parse(match[0]) as T;
  }
}

export async function groqGenerateJson<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  },
): Promise<T> {
  const response = await groqClient.chat.completions.create({
    model: options?.model || DEFAULT_GROQ_MODEL,
    temperature: options?.temperature ?? 0.2,
    max_tokens: options?.maxTokens ?? 2000,
    response_format: { type: "json_object" } as any,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty response");
  }

  return parseJsonFromModel<T>(content);
}

async function huggingFaceRequest(
  model: string,
  init: RequestInit,
  retries = 2,
): Promise<Response> {
  const response = await fetch(`${HF_BASE_URL}/${model}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${ENV.huggingFaceApiKey}`,
      ...(init.headers || {}),
    },
  });

  if (response.status === 503 && retries > 0) {
    try {
      const loading = (await response.clone().json()) as {
        estimated_time?: number;
      };
      const waitMs = Math.min(
        10000,
        Math.max(1000, Math.round((loading.estimated_time ?? 1) * 1000)),
      );
      await sleep(waitMs);
    } catch {
      await sleep(1500);
    }

    return huggingFaceRequest(model, init, retries - 1);
  }

  return response;
}

export async function generateImageWithHuggingFace(prompt: string): Promise<{
  buffer: Buffer;
  mimeType: string;
}> {
  const response = await huggingFaceRequest(DEFAULT_HF_IMAGE_MODEL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "image/png",
    },
    body: JSON.stringify({
      inputs: prompt,
      options: { wait_for_model: true },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Hugging Face image generation failed (${response.status}): ${details.slice(0, 400)}`,
    );
  }

  const contentType = response.headers.get("content-type") || "image/png";
  if (contentType.includes("application/json")) {
    const details = await response.text();
    throw new Error(
      `Hugging Face image generation returned JSON instead of image: ${details.slice(0, 400)}`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    buffer,
    mimeType: contentType.split(";")[0],
  };
}

export async function imageToTextWithHuggingFace(
  imageBuffer: Buffer,
  mimeType: string,
  purpose: "caption" | "ocr",
): Promise<string> {
  const model = purpose === "ocr" ? DEFAULT_HF_OCR_MODEL : DEFAULT_HF_CAPTION_MODEL;

  const response = await huggingFaceRequest(model, {
    method: "POST",
    headers: {
      "Content-Type": mimeType,
      Accept: "application/json",
    },
    body: imageBuffer as unknown as BodyInit,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Hugging Face ${purpose} request failed (${response.status}): ${details.slice(0, 400)}`,
    );
  }

  const payload = (await response.json()) as
    | Array<{ generated_text?: string; text?: string }>
    | { generated_text?: string; text?: string }
    | string;

  if (typeof payload === "string") {
    return payload.trim();
  }

  if (Array.isArray(payload)) {
    const first = payload[0];
    if (!first) return "";
    return String(first.generated_text || first.text || "").trim();
  }

  return String(payload.generated_text || payload.text || "").trim();
}
