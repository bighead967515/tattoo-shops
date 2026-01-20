/**
 * Voice transcription helper using internal Speech-to-Text service
 *
 * Frontend implementation guide:
 * 1. Capture audio using MediaRecorder API
 * 2. Upload audio to storage (e.g., S3) to get URL
 * 3. Call transcription with the URL
 * 
 * Example usage:
 * ```tsx
 * // Frontend component
 * const transcribeMutation = trpc.voice.transcribe.useMutation({
 *   onSuccess: (data) => {
 *     console.log(data.text); // Full transcription
 *     console.log(data.language); // Detected language
 *     console.log(data.segments); // Timestamped segments
 *   }
 * });
 * 
 * // After uploading audio to storage
 * transcribeMutation.mutate({
 *   audioUrl: uploadedAudioUrl,
 *   language: 'en', // optional
 *   prompt: 'Transcribe the meeting' // optional
 * });
 * ```
 */
import { ENV } from "./env";
import { URL as NodeURL } from "url";
import * as dns from "dns/promises";
import * as ipaddr from "ipaddr.js";

function isPrivateIP(ip: string): boolean {
  try {
    // Parse the IP address using ipaddr.js for robust handling
    const addr = ipaddr.process(ip);
    
    // Get the address range/type
    const range = addr.range();
    
    // Block private, loopback, link-local, unique-local, and unspecified ranges
    const blockedRanges = [
      'private',           // IPv4 private (10.x, 172.16-31.x, 192.168.x)
      'loopback',          // 127.x.x.x, ::1
      'linkLocal',         // 169.254.x.x, fe80::/10
      'uniqueLocal',       // fc00::/7 (IPv6 ULA)
      'unspecified',       // 0.0.0.0, ::
      'broadcast',         // 255.255.255.255
      'carrierGradeNat',   // 100.64.0.0/10 (CGN)
      'reserved',          // Reserved ranges
    ];
    
    return blockedRanges.includes(range);
  } catch (error) {
    // If parsing fails, treat as suspicious and block it
    return true;
  }
}

async function isUrlAllowed(urlString: string): Promise<{ allowed: boolean; reason?: string; resolvedIp?: string }> {
  try {
    const url = new NodeURL(urlString);
    
    // Require HTTPS
    if (url.protocol !== 'https:') {
      return { allowed: false, reason: 'Only HTTPS URLs are allowed' };
    }
    
    // Check for obvious localhost/private hostnames
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { allowed: false, reason: 'Localhost URLs are not allowed' };
    }
    
    // Resolve hostname to IP and check if it's private
    // Remove .catch() to surface DNS errors
    let addresses: string[] = [];
    let addresses6: string[] = [];
    
    try {
      addresses = await dns.resolve4(hostname);
    } catch {
      // IPv4 resolution failed, try IPv6
    }
    
    try {
      addresses6 = await dns.resolve6(hostname);
    } catch {
      // IPv6 resolution failed
    }
    
    const allAddresses = [...addresses, ...addresses6];
    
    if (allAddresses.length === 0) {
      return { allowed: false, reason: 'Unable to resolve hostname' };
    }
    
    // Check all resolved IPs
    for (const ip of allAddresses) {
      if (isPrivateIP(ip)) {
        return { allowed: false, reason: 'URL resolves to a private IP address' };
      }
    }
    
    // Return first resolved IP for binding the request
    return { allowed: true, resolvedIp: allAddresses[0] };
  } catch (error) {
    return { allowed: false, reason: 'Invalid URL format' };
  }
}

export type TranscribeOptions = {
  audioUrl: string; // URL to the audio file (e.g., S3 URL)
  language?: string; // Optional: specify language code (e.g., "en", "es", "zh")
  prompt?: string; // Optional: custom prompt for the transcription
};

// Native Whisper API segment format
export type WhisperSegment = {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
};

// Native Whisper API response format
export type WhisperResponse = {
  task: "transcribe";
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
};

export type TranscriptionResponse = WhisperResponse; // Return native Whisper API response directly

export type TranscriptionError = {
  error: string;
  code: "FILE_TOO_LARGE" | "INVALID_FORMAT" | "TRANSCRIPTION_FAILED" | "UPLOAD_FAILED" | "SERVICE_ERROR";
  details?: string;
};

/**
 * Transcribe audio to text using the internal Speech-to-Text service
 * 
 * @param options - Audio data and metadata
 * @returns Transcription result or error
 */
export async function transcribeAudio(
  options: TranscribeOptions
): Promise<TranscriptionResponse | TranscriptionError> {
  try {
    // Step 1: Validate environment configuration
    if (!ENV.forgeApiUrl) {
      return {
        error: "Voice transcription service is not configured",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_URL is not set"
      };
    }
    if (!ENV.forgeApiKey) {
      return {
        error: "Voice transcription service authentication is missing",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_KEY is not set"
      };
    }

    // Step 1.5: Validate URL for SSRF protection
    const urlCheck = await isUrlAllowed(options.audioUrl);
    if (!urlCheck.allowed) {
      return {
        error: "Invalid or disallowed audio URL",
        code: "INVALID_FORMAT",
        details: urlCheck.reason
      };
    }

    // Step 2: Download audio from URL
    let audioBuffer: Buffer;
    let mimeType: string;
    try {
      const response = await fetch(options.audioUrl);
      if (!response.ok) {
        return {
          error: "Failed to download audio file",
          code: "INVALID_FORMAT",
          details: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      audioBuffer = Buffer.from(await response.arrayBuffer());
      mimeType = response.headers.get('content-type') || 'audio/mpeg';
      
      // Check file size (16MB limit)
      const sizeMB = audioBuffer.length / (1024 * 1024);
      if (sizeMB > 16) {
        return {
          error: "Audio file exceeds maximum size limit",
          code: "FILE_TOO_LARGE",
          details: `File size is ${sizeMB.toFixed(2)}MB, maximum allowed is 16MB`
        };
      }
    } catch (error) {
      return {
        error: "Failed to fetch audio file",
        code: "SERVICE_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }

    // Step 3: Create FormData for multipart upload to Whisper API
    const formData = new FormData();
    
    // Create a Blob from the buffer and append to form
    const filename = `audio.${getFileExtension(mimeType)}`;
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    formData.append("file", audioBlob, filename);
    
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    
    // Add prompt - use custom prompt if provided, otherwise generate based on language
    const prompt = options.prompt || (
      options.language 
        ? `Transcribe the user's voice to text, the user's working language is ${getLanguageName(options.language)}`
        : "Transcribe the user's voice to text"
    );
    formData.append("prompt", prompt);

    // Step 4: Call the transcription service
    const baseUrl = ENV.forgeApiUrl.endsWith("/")
      ? ENV.forgeApiUrl
      : `${ENV.forgeApiUrl}/`;
    
    const fullUrl = new URL(
      "v1/audio/transcriptions",
      baseUrl
    ).toString();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          authorization: `Bearer ${ENV.forgeApiKey}`,
          "Accept-Encoding": "identity",
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        return {
          error: "Transcription service request failed",
          code: "TRANSCRIPTION_FAILED",
          details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`
        };
      }

      // Step 5: Parse and return the transcription result
      const whisperResponse = await response.json() as WhisperResponse;
      
      // Validate response structure
      if (!whisperResponse.text || typeof whisperResponse.text !== 'string') {
        return {
          error: "Invalid transcription response",
          code: "SERVICE_ERROR",
        details: "Transcription service returned an invalid response format"
      };
    }

    return whisperResponse; // Return native Whisper API response directly

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return {
          error: "Transcription request timed out",
          code: "SERVICE_ERROR",
          details: "The transcription service did not respond within 30 seconds"
        };
      }
      throw fetchError;
    }

  } catch (error) {
    // Handle unexpected errors
    return {
      error: "Voice transcription failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

/**
 * Helper function to get file extension from MIME type
 */
function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/ogg': 'ogg',
    'audio/m4a': 'm4a',
    'audio/mp4': 'm4a',
  };
  
  return mimeToExt[mimeType] || 'audio';
}

/**
 * Helper function to get full language name from ISO code
 */
function getLanguageName(langCode: string): string {
  const langMap: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'nl': 'Dutch',
    'pl': 'Polish',
    'tr': 'Turkish',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
    'fi': 'Finnish',
  };
  
  return langMap[langCode] || langCode;
}

/**
 * Example tRPC procedure implementation:
 * 
 * ```ts
 * // In server/routers.ts
 * import { transcribeAudio } from "./_core/voiceTranscription";
 * 
 * export const voiceRouter = router({
 *   transcribe: protectedProcedure
 *     .input(z.object({
 *       audioUrl: z.string(),
 *       language: z.string().optional(),
 *       prompt: z.string().optional(),
 *     }))
 *     .mutation(async ({ input, ctx }) => {
 *       const result = await transcribeAudio(input);
 *       
 *       // Check if it's an error
 *       if ('error' in result) {
 *         throw new TRPCError({
 *           code: 'BAD_REQUEST',
 *           message: result.error,
 *           cause: result,
 *         });
 *       }
 *       
 *       // Optionally save transcription to database
 *       await db.insert(transcriptions).values({
 *         userId: ctx.user.id,
 *         text: result.text,
 *         duration: result.duration,
 *         language: result.language,
 *         audioUrl: input.audioUrl,
 *         createdAt: new Date(),
 *       });
 *       
 *       return result;
 *     }),
 * });
 * ```
 */
