import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

function isAuthenticationError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes("unauthorized") || 
           message.includes("invalid token") || 
           message.includes("expired") ||
           message.includes("authentication failed");
  }
  return false;
}

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    if (isAuthenticationError(error)) {
      // Expected auth failure - user not logged in or invalid token
      user = null;
    } else {
      // Unexpected system error
      console.error("[Context] Unexpected error during authentication:", error);
      throw error;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
