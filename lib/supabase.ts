import { createClient } from '@supabase/supabase-js';

/**
 * Normalize the project URL: keep only scheme + host, dropping any path
 * (e.g. a pasted `/rest/v1`) or trailing slash. A path here makes the client
 * build `/rest/v1/rest/v1/…` and Supabase answers PGRST125
 * "Invalid path specified in request URL".
 */
function cleanSupabaseUrl(raw: string): string {
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/+$/, '');
  }
}

const supabaseUrl = cleanSupabaseUrl(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
);
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);

/** Turns a raw Postgres/Supabase error into a message safe to show a user. */
export function friendlyDbError(error: { code?: string; message: string }): string {
  if (error.code === '23505') {
    if (error.message.includes('email')) return 'Există deja o înregistrare cu acest email.';
    return 'Această înregistrare există deja.';
  }
  return error.message;
}
