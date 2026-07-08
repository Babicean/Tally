/**
 * Supabase project coordinates. Both values are PUBLIC BY DESIGN —
 * they only name the project. All real authority comes from the
 * signed-in user's token plus Row Level Security on the server; the
 * service_role key (the actual secret) lives only in the Supabase
 * dashboard and is never used by the app. See docs/SYNC.md.
 */
export const SYNC_URL = "https://lbutquxdipzgguyxhwmw.supabase.co";
export const SYNC_KEY = "sb_publishable_zQGci4ufSrtHe3DUxqDjZQ_P-5AULWV";
