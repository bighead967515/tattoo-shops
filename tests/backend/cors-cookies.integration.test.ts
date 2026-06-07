import express from "express";
import cors from "cors";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { startHttpServer, type StartedHttpServer } from "./_helpers/httpHarness";
import { getSessionCookieOptions, isSecureRequest } from "../../backend/server/_core/cookies";
import { ENV } from "../../backend/server/_core/env";

// Helper to construct CORS configuration matching the main server setup
function getTestCorsMiddleware(allowedOrigins: string[]) {
  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
    exposedHeaders: ["X-CSRF-Token"],
  });
}

describe("CORS and Cookies Integration Tests", () => {
  describe("Cookie Security Options", () => {
    it("should recognize https protocol as secure", () => {
      const req = {
        protocol: "https",
        headers: {},
      } as any;
      expect(isSecureRequest(req)).toBe(true);
    });

    it("should recognize x-forwarded-proto https as secure", () => {
      const req = {
        protocol: "http",
        headers: {
          "x-forwarded-proto": "https",
        },
      } as any;
      expect(isSecureRequest(req)).toBe(true);
    });

    it("should recognize comma-separated x-forwarded-proto containing https as secure", () => {
      const req = {
        protocol: "http",
        headers: {
          "x-forwarded-proto": "http, https",
        },
      } as any;
      expect(isSecureRequest(req)).toBe(true);
    });

    it("should recognize http protocol without x-forwarded-proto as insecure", () => {
      const req = {
        protocol: "http",
        headers: {},
      } as any;
      expect(isSecureRequest(req)).toBe(false);
    });

    it("should build session cookie options with correct properties", () => {
      const req = {
        protocol: "https",
        headers: {},
      } as any;

      const options = getSessionCookieOptions(req);
      expect(options).toEqual({
        httpOnly: true,
        path: "/",
        sameSite: "strict",
        secure: true,
      });
    });
  });

  describe("CORS Header Behavior", () => {
    let server: StartedHttpServer;
    const allowedOrigins = [
      "https://theinkednetwork.website",
      "https://www.theinkednetwork.website",
      "http://localhost:3000",
    ];

    beforeEach(async () => {
      const app = express();
      
      // Register test CORS middleware
      app.use(getTestCorsMiddleware(allowedOrigins));
      
      app.get("/api/test-cors", (req, res) => {
        res.json({ success: true });
      });

      server = await startHttpServer(app);
    });

    afterEach(async () => {
      await server.close();
    });

    it("allows requests from allowed origins", async () => {
      const origin = "https://theinkednetwork.website";
      const response = await fetch(`${server.baseUrl}/api/test-cors`, {
        headers: {
          Origin: origin,
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe(origin);
      expect(response.headers.get("access-control-allow-credentials")).toBe("true");
    });

    it("rejects requests from disallowed origins", async () => {
      const origin = "https://disallowedorigin.com";
      const response = await fetch(`${server.baseUrl}/api/test-cors`, {
        headers: {
          Origin: origin,
        },
      });

      // Express CORS middleware does not append access-control-allow-origin when origin is not allowed
      expect(response.headers.get("access-control-allow-origin")).toBeNull();
    });

    it("allows same-origin / server-to-server requests with no Origin header", async () => {
      const response = await fetch(`${server.baseUrl}/api/test-cors`);
      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBeNull();
    });

    it("handles OPTIONS preflight requests correctly for allowed origins", async () => {
      const origin = "https://www.theinkednetwork.website";
      const response = await fetch(`${server.baseUrl}/api/test-cors`, {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "Content-Type",
        },
      });

      expect(response.status).toBe(204); // CORS preflight typically returns 204 No Content
      expect(response.headers.get("access-control-allow-origin")).toBe(origin);
      expect(response.headers.get("access-control-allow-methods")).toContain("GET");
      expect(response.headers.get("access-control-allow-credentials")).toBe("true");
    });
  });
});
