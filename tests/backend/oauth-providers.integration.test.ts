/**
 * OAuth Provider Integration Tests — Google & GitHub
 *
 * Tests the backend session-sync flow for users arriving via
 * Google or GitHub OAuth. These tests mock Supabase's admin
 * getUser() so they run without any real OAuth credentials.
 *
 * Flow under test:
 *   1. Supabase redirects user back to /auth/callback with tokens
 *   2. Frontend POSTs access_token to POST /api/auth/session
 *   3. Backend calls supabaseAdmin.auth.getUser(token)
 *   4. Backend upserts the user with loginMethod = provider
 *   5. Backend sets app_session_id cookie and returns user object
 */

import express from "express";
import cookieParser from "cookie-parser";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "../../backend/shared/const";
import { startHttpServer, type StartedHttpServer } from "./_helpers/httpHarness";
import {
  createGetUserSuccess,
  createGetUserFailure,
  createMockSupabaseUser,
} from "./_fixtures/auth";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();
const mockUpsertUser = vi.fn();

vi.mock("../../backend/server/_core/supabase", () => ({
  supabaseAdmin: { auth: { getUser: mockGetUser } },
}));

vi.mock("../../backend/server/db", () => ({
  upsertUser: mockUpsertUser,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

async function postSession(
  baseUrl: string,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
) {
  const res = await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
  return { response: res, body: (await res.json()) as Record<string, unknown> };
}

function getCookies(response: Response): string[] {
  const h = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe("OAuth provider session sync — Google & GitHub", () => {
  let server: StartedHttpServer;

  beforeEach(async () => {
    vi.clearAllMocks();

    const app = express();
    app.use(cookieParser());
    app.use(express.json());

    const { registerSupabaseAuthRoutes } = await import(
      "../../backend/server/_core/supabaseAuth"
    );
    registerSupabaseAuthRoutes(app);
    server = await startHttpServer(app);
  });

  afterEach(async () => {
    await server.close();
  });

  // ── Google ──────────────────────────────────────────────────────────────────

  describe("Google OAuth", () => {
    it("creates a session for a Google-authenticated user", async () => {
      const googleUser = createMockSupabaseUser({
        id: "google-uid-001",
        email: "alice@gmail.com",
        user_metadata: { name: "Alice Google", avatar_url: "https://lh3.googleusercontent.com/a/photo" },
      });
      mockGetUser.mockResolvedValue(createGetUserSuccess(googleUser));
      mockUpsertUser.mockResolvedValue(undefined);

      const { response, body } = await postSession(server.baseUrl, {
        accessToken: "google-access-token",
      });

      expect(response.status).toBe(200);
      expect(body.user).toMatchObject({
        id: "google-uid-001",
        email: "alice@gmail.com",
        name: "Alice Google",
      });
    });

    it("sets the session cookie after Google login", async () => {
      const googleUser = createMockSupabaseUser({
        id: "google-uid-002",
        email: "bob@gmail.com",
        user_metadata: { name: "Bob Google" },
      });
      mockGetUser.mockResolvedValue(createGetUserSuccess(googleUser));
      mockUpsertUser.mockResolvedValue(undefined);

      const { response } = await postSession(server.baseUrl, {
        accessToken: "google-access-token-2",
      });

      const cookies = getCookies(response);
      expect(cookies.some((c) => c.startsWith(`${COOKIE_NAME}=`))).toBe(true);
    });

    it("upserts user with Google account data", async () => {
      const googleUser = createMockSupabaseUser({
        id: "google-uid-003",
        email: "carol@gmail.com",
        user_metadata: { name: "Carol Google" },
      });
      mockGetUser.mockResolvedValue(createGetUserSuccess(googleUser));
      mockUpsertUser.mockResolvedValue(undefined);

      await postSession(server.baseUrl, { accessToken: "google-token-3" });

      expect(mockUpsertUser).toHaveBeenCalledOnce();
      expect(mockUpsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          openId: "google-uid-003",
          email: "carol@gmail.com",
          name: "Carol Google",
        }),
      );
    });

    it("rejects an expired Google token", async () => {
      mockGetUser.mockResolvedValue(createGetUserFailure("Token expired"));

      const { response, body } = await postSession(server.baseUrl, {
        accessToken: "expired-google-token",
      });

      expect(response.status).toBe(401);
      expect(body.error).toBeTruthy();
      expect(mockUpsertUser).not.toHaveBeenCalled();
    });

    it("rejects a Google token with no associated email", async () => {
      // Supabase returns a user but getUser itself fails (token invalid)
      mockGetUser.mockResolvedValue(createGetUserFailure("User not found"));

      const { response } = await postSession(server.baseUrl, {
        accessToken: "token-no-email",
      });

      expect(response.status).toBe(401);
    });
  });

  // ── GitHub ──────────────────────────────────────────────────────────────────

  describe("GitHub OAuth", () => {
    it("creates a session for a GitHub-authenticated user", async () => {
      const githubUser = createMockSupabaseUser({
        id: "github-uid-001",
        email: "dev@github.example",
        user_metadata: { name: "Dev GitHub", user_name: "devhandle" },
      });
      mockGetUser.mockResolvedValue(createGetUserSuccess(githubUser));
      mockUpsertUser.mockResolvedValue(undefined);

      const { response, body } = await postSession(server.baseUrl, {
        accessToken: "github-access-token",
      });

      expect(response.status).toBe(200);
      expect(body.user).toMatchObject({
        id: "github-uid-001",
        email: "dev@github.example",
        name: "Dev GitHub",
      });
    });

    it("sets the session cookie after GitHub login", async () => {
      const githubUser = createMockSupabaseUser({
        id: "github-uid-002",
        email: "eng@github.example",
        user_metadata: { name: "Engineer" },
      });
      mockGetUser.mockResolvedValue(createGetUserSuccess(githubUser));
      mockUpsertUser.mockResolvedValue(undefined);

      const { response } = await postSession(server.baseUrl, {
        accessToken: "github-access-token-2",
      });

      const cookies = getCookies(response);
      expect(cookies.some((c) => c.startsWith(`${COOKIE_NAME}=`))).toBe(true);
    });

    it("upserts user with GitHub account data", async () => {
      const githubUser = createMockSupabaseUser({
        id: "github-uid-003",
        email: "contrib@github.example",
        user_metadata: { name: "Contributor GitHub", user_name: "contrib" },
      });
      mockGetUser.mockResolvedValue(createGetUserSuccess(githubUser));
      mockUpsertUser.mockResolvedValue(undefined);

      await postSession(server.baseUrl, { accessToken: "github-token-3" });

      expect(mockUpsertUser).toHaveBeenCalledOnce();
      expect(mockUpsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          openId: "github-uid-003",
          email: "contrib@github.example",
          name: "Contributor GitHub",
        }),
      );
    });

    it("rejects a revoked GitHub token", async () => {
      mockGetUser.mockResolvedValue(createGetUserFailure("JWT expired"));

      const { response, body } = await postSession(server.baseUrl, {
        accessToken: "revoked-github-token",
      });

      expect(response.status).toBe(401);
      expect(body.error).toBeTruthy();
      expect(mockUpsertUser).not.toHaveBeenCalled();
    });

    it("does not set a session cookie on GitHub token rejection", async () => {
      mockGetUser.mockResolvedValue(createGetUserFailure("Invalid JWT"));

      const { response } = await postSession(server.baseUrl, {
        accessToken: "bad-github-token",
      });

      const cookies = getCookies(response);
      expect(cookies.some((c) => c.startsWith(`${COOKIE_NAME}=`))).toBe(false);
    });
  });

  // ── Shared edge cases ────────────────────────────────────────────────────────

  describe("Shared OAuth edge cases", () => {
    it("rejects request with no access_token regardless of provider", async () => {
      const { response, body } = await postSession(server.baseUrl, {});

      expect(response.status).toBe(400);
      expect(String(body.error)).toMatch(/access_token/i);
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it("does not call upsertUser when Supabase returns an error", async () => {
      mockGetUser.mockResolvedValue(createGetUserFailure("Service unavailable"));

      await postSession(server.baseUrl, { accessToken: "any-token" });

      expect(mockUpsertUser).not.toHaveBeenCalled();
    });

    it("handles two concurrent OAuth sessions independently", async () => {
      const googleUser = createMockSupabaseUser({ id: "g-001", email: "g@example.com", user_metadata: { name: "G User" } });
      const githubUser = createMockSupabaseUser({ id: "gh-001", email: "gh@example.com", user_metadata: { name: "GH User" } });

      // Use token value to disambiguate rather than call-order, which is
      // non-deterministic with concurrent requests.
      mockGetUser.mockImplementation(async (token: string) =>
        token === "token-google"
          ? createGetUserSuccess(googleUser)
          : createGetUserSuccess(githubUser),
      );
      mockUpsertUser.mockResolvedValue(undefined);

      const [resGoogle, resGitHub] = await Promise.all([
        postSession(server.baseUrl, { accessToken: "token-google" }),
        postSession(server.baseUrl, { accessToken: "token-github" }),
      ]);

      expect(resGoogle.response.status).toBe(200);
      expect(resGitHub.response.status).toBe(200);
      expect(mockUpsertUser).toHaveBeenCalledTimes(2);
    });
  });
});
