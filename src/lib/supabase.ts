import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

/*
  Run this SQL in your Supabase project to create the sites table:

  CREATE TABLE sites (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    slug        TEXT        UNIQUE NOT NULL,
    business_name TEXT      NOT NULL,
    config      JSONB       NOT NULL,
    photos      TEXT[]      DEFAULT '{}',
    place_id    TEXT,
    status      TEXT        DEFAULT 'preview' CHECK (status IN ('preview', 'sold')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );

  -- Disable RLS for the dashboard (or set up policies for your auth setup):
  ALTER TABLE sites DISABLE ROW LEVEL SECURITY;
*/
