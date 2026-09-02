import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
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
