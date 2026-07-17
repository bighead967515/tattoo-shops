/**
 * CSRF Protection Middleware
 * P1-1: Prevent cross-site request forgery attacks on cookie-authenticated mutations
 * 
 * Strategy:
 * - Generate random CSRF token and store in httpOnly cookie
 * - Require custom X-CSRF-Token header for all mutations (prevents automatic submission)
 * - Token must match between cookie and header
 * 
 * This is a "double-submit cookie" pattern with custom header requirement
 * Reference: https://owasp.org/www-community/attacks/csrf
 */

import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger";
import { isSecureRequest } from "./cookies";

const CSRF_COOKIE_NAME = "__csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32; // 256 bits

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Extract CSRF token from request (from custom header)
 */
function getCsrfTokenFromRequest(req: Request): string | null {
  // Check custom header first (primary for API/SPA)
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
  if (headerToken) return headerToken;

  // Fallback: check request body (for form submissions)
  const bodyToken = (req.body as any)?._csrf;
  if (bodyToken) return bodyToken;

  return null;
}

/**
 * Middleware to verify CSRF token on mutations
 * 
 * How it works:
 * 1. Generate and set CSRF token in httpOnly cookie on first request
 * 2. Client reads token from cookie (via JavaScript)
 * 3. Client sends token in X-CSRF-Token header with mutations
 * 4. Verify header token matches cookie token
 * 
 * This prevents CSRF because:
 * - Cross-site attacker cannot read httpOnly cookie (SOP)
 * - Cross-site attacker cannot send custom headers (CORS blocks it)
 * - Must have token in both places to proceed
 */
export function csrfProtectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Only require CSRF token for state-changing methods
  const isStateChanging =
    req.method === "POST" ||
    req.method === "PUT" ||
    req.method === "PATCH" ||
    req.method === "DELETE";

  // Get or create CSRF token in cookie
  let tokenInCookie = req.cookies?.[CSRF_COOKIE_NAME];

  if (!tokenInCookie) {
    // Generate new token if not present
    tokenInCookie = generateCsrfToken();
    // Set as httpOnly cookie (cannot be read by JavaScript, blocks XSS exfiltration)
    res.cookie(CSRF_COOKIE_NAME, tokenInCookie, {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: "strict", // P1-1 fix: use strict instead of none
      path: "/",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    // Store in res.locals so csrfTokenMiddleware can reuse the same token
    res.locals.csrfToken = tokenInCookie;
  } else {
    res.locals.csrfToken = tokenInCookie;
  }

  // For mutations, verify CSRF token from header matches cookie
  if (isStateChanging) {
    const tokenInHeader = getCsrfTokenFromRequest(req);

    if (!tokenInHeader) {
      logger.warn("CSRF token missing from request", {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      return res.status(403).json({
        error: "CSRF_MISSING",
        message: "CSRF token required for this operation",
      });
    }

    if (tokenInHeader !== tokenInCookie) {
      logger.warn("CSRF token mismatch - possible attack", {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      return res.status(403).json({
        error: "CSRF_INVALID",
        message: "CSRF token invalid",
      });
    }
  }

  next();
}

/**
 * Express middleware factory to add CSRF token to response headers
 * Allows frontend to read token value without exposing it
 */
export function csrfTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Reuse the token already set by csrfProtectionMiddleware (via res.locals)
  // to avoid generating two different tokens for the same request.
  const token =
    (res.locals.csrfToken as string | undefined) ||
    req.cookies?.[CSRF_COOKIE_NAME] ||
    generateCsrfToken();

  if (!req.cookies?.[CSRF_COOKIE_NAME] && !res.locals.csrfToken) {
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: "strict",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  res.setHeader("X-CSRF-Token", token);
  next();
}
