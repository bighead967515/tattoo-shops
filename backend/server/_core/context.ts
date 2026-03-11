import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { supabaseAdmin } from "./supabase";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Get session token from cookie
    const authHeader = opts.req.headers.authorization;
    const token =
      authHeader?.replace("Bearer ", "") ||
      opts.req.cookies?.["sb-access-token"];

    if (token) {
      // Verify token with Supabase
      const {
        data: { user: supabaseUser },
        error,
      } = await supabaseAdmin.auth.getUser(token);

      if (!error && supabaseUser) {
        // Fetch user from database
        const db = await getDb();
        if (db) {
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.openId, supabaseUser.id))
            .limit(1);
          user = dbUser || null;
        }
      }
    }
  } catch (error) {
    console.error("[Context] Authentication error:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
