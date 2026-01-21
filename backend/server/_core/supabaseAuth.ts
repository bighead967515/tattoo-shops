import { supabaseAdmin } from './supabase';
import type { Express, Request, Response } from 'express';
import { COOKIE_NAME } from '@shared/const';
import { getSessionCookieOptions } from './cookies';

/**
 * Supabase Authentication Routes
 * Replaces Manus OAuth with Supabase Auth
 */

export function registerSupabaseAuthRoutes(app: Express) {
  /**
   * Exchange Supabase auth token for session cookie
   * Frontend calls this after successful Supabase sign-in
   */
  app.post('/api/auth/session', async (req: Request, res: Response) => {
    try {
      const { access_token, refresh_token } = req.body;

      if (!access_token) {
        res.status(400).json({ error: 'access_token is required' });
        return;
      }

      // Verify the token with Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);

      if (error || !user) {
        console.error('[Auth] Invalid token:', error);
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      // Set session cookie with access token
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, access_token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0],
        },
      });
    } catch (error) {
      console.error('[Auth] Session creation failed:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });

  /**
   * Sign out - clear session cookie
   */
  app.post('/api/auth/signout', (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });

  /**
   * Get current user from session
   */
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const token = req.cookies[COOKIE_NAME];

      if (!token) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Verify token with Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        res.status(401).json({ error: 'Invalid session' });
        return;
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0],
        },
      });
    } catch (error) {
      console.error('[Auth] Failed to get user:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });
}

/**
 * Middleware to verify Supabase session
 * Use this to protect routes that require authentication
 */
export async function requireAuth(req: Request, res: Response, next: Function) {
  try {
    const token = req.cookies[COOKIE_NAME];

    if (!token) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    // Attach user to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0],
    };

    next();
  } catch (error) {
    console.error('[Auth] Middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
