import express from "express";
import cookieParser from "cookie-parser";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "../../backend/shared/const";
import { startHttpServer, type StartedHttpServer } from "./_helpers/httpHarness";
import {
  createGetUserFailure,
  createGetUserSuccess,
  createMockSupabaseUser,
} from "./_fixtures/auth";

const mockGetUser = vi.fn();
const mockUpsertUser = vi.fn();

vi.mock("../../backend/server/_core/supabase", () => ({
  supabaseAdmin: {
    auth: {
      getUser: mockGetUser,
    },
  },
}));

vi.mock("../../backend/server/db", () => ({
  upsertUser: mockUpsertUser,
}));

type JsonResponse<T = unknown> = {
  response: Response;
  body: T;
};

function readSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const singleHeader = response.headers.get("set-cookie");
  return singleHeader ? [singleHeader] : [];
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<JsonResponse<T>> {
  const headers = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  const body = (await response.json()) as T;
  return { response, body };
}

describe("Auth routes integration", () => {
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

  it("rejects session creation without access token", async () => {
    const { response, body } = await requestJson<{ error: string }>(
      server.baseUrl,
      "/api/auth/session",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );

    expect(response.status).toBe(400);
    expect(body.error).toBe("access_token is required");
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockUpsertUser).not.toHaveBeenCalled();
  });

  it("rejects session creation with invalid token", async () => {
    mockGetUser.mockResolvedValue(createGetUserFailure());

    const { response, body } = await requestJson<{ error: string }>(
      server.baseUrl,
      "/api/auth/session",
      {
        method: "POST",
        body: JSON.stringify({ accessToken: "bad-token" }),
      },
    );

    expect(response.status).toBe(401);
    expect(body.error).toBe("Invalid token");
    expect(mockUpsertUser).not.toHaveBeenCalled();
  });

  it("creates session, upserts user, and sets cookie for valid token", async () => {
    const mockUser = createMockSupabaseUser();
    mockGetUser.mockResolvedValue(createGetUserSuccess(mockUser));
    mockUpsertUser.mockResolvedValue(undefined);

    const { response, body } = await requestJson<{
      user: { id: string; email: string; name: string };
    }>(server.baseUrl, "/api/auth/session", {
      method: "POST",
      body: JSON.stringify({ accessToken: "good-token" }),
    });

    const setCookies = readSetCookieHeaders(response);

    expect(response.status).toBe(200);
    expect(body.user.id).toBe(mockUser.id);
    expect(body.user.email).toBe(mockUser.email);
    expect(body.user.name).toBe("Test User");

    expect(mockUpsertUser).toHaveBeenCalledTimes(1);
    expect(mockUpsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: mockUser.id,
        email: mockUser.email,
        name: "Test User",
      }),
    );

    expect(setCookies.some((cookie) => cookie.includes(`${COOKIE_NAME}=`))).toBe(
      true,
    );
  });

  it("returns unauthorized on /api/auth/me without cookie", async () => {
    const { response, body } = await requestJson<{ error: string }>(
      server.baseUrl,
      "/api/auth/me",
      {
        method: "GET",
      },
    );

    expect(response.status).toBe(401);
    expect(body.error).toBe("Not authenticated");
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("returns authenticated user from /api/auth/me with valid session cookie", async () => {
    const mockUser = createMockSupabaseUser({ id: "open-id-99" });
    mockGetUser.mockResolvedValue(createGetUserSuccess(mockUser));

    const { response, body } = await requestJson<{
      user: { id: string; email: string; name: string };
    }>(server.baseUrl, "/api/auth/me", {
      method: "GET",
      headers: {
        Cookie: `${COOKIE_NAME}=session-token`,
      },
    });

    expect(response.status).toBe(200);
    expect(body.user.id).toBe("open-id-99");
    expect(body.user.email).toBe("tester@example.com");
    expect(mockGetUser).toHaveBeenCalledWith("session-token");
  });

  it("rejects invalid /api/auth/me session cookie", async () => {
    mockGetUser.mockResolvedValue(createGetUserFailure("Expired token"));

    const { response, body } = await requestJson<{ error: string }>(
      server.baseUrl,
      "/api/auth/me",
      {
        method: "GET",
        headers: {
          Cookie: `${COOKIE_NAME}=expired-token`,
        },
      },
    );

    expect(response.status).toBe(401);
    expect(body.error).toBe("Invalid session");
  });

  it("clears session cookie on /api/auth/signout", async () => {
    const { response, body } = await requestJson<{ success: boolean }>(
      server.baseUrl,
      "/api/auth/signout",
      {
        method: "POST",
        headers: {
          Cookie: `${COOKIE_NAME}=active-token`,
        },
      },
    );

    const setCookies = readSetCookieHeaders(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(
      setCookies.some(
        (cookie) =>
          cookie.includes(`${COOKIE_NAME}=`) &&
          (cookie.includes("Max-Age=0") || cookie.includes("Expires=")),
      ),
    ).toBe(true);
  });
});
