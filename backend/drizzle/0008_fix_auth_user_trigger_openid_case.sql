-- Fix Supabase auth.users signup trigger for public.users camelCase columns.
-- Unquoted openId was interpreted as openid, causing "Database error saving new user".

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public."users" ("openId", "email", "name", "role", "lastSignedIn")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1), 'User'),
    'user',
    NOW()
  )
  ON CONFLICT ("openId") DO UPDATE
  SET
    "email" = EXCLUDED."email",
    "name" = COALESCE(EXCLUDED."name", public."users"."name"),
    "updatedAt" = NOW(),
    "lastSignedIn" = NOW();

  RETURN NEW;
END;
$$;