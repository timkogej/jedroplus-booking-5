// src/lib/supabaseEnv.ts
//
// The Supabase project URL is public information: it ships in the browser
// bundle with the anon key and sits in .env.example. Keeping a fallback here
// means a missing NEXT_PUBLIC_SUPABASE_URL on the hosting project cannot
// silently switch off promotions, the logo or the plan check again.

const FALLBACK_URL = 'https://xdudtawctybnphdpvlwu.supabase.co';

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || FALLBACK_URL;

/** Anon key stays env-only: it is public, but it does rotate. */
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
