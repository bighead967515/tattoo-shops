/**
 * Input sanitization utilities
 * Prevents XSS and injection attacks in user-submitted content
 */

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize user input for safe storage
 * - Trims whitespace
 * - Removes null bytes
 * - Optionally limits length
 */
export function sanitizeInput(input: string, maxLength?: number): string {
  let sanitized = input.trim().replace(/\0/g, ""); // Remove null bytes

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized) || sanitized.length > 320) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize phone number - allow only digits, spaces, dashes, parentheses, and plus
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\s\-()+ ]/g, "").trim();
}
