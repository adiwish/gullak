import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when Supabase env vars are configured — enables shared online sync. */
export const isRemote = Boolean(url && key)

export const supabase: SupabaseClient | null = isRemote ? createClient(url!, key!) : null

/** All profiles live in one shared document so any device sees the same data. */
export const DOC_ID = 'shared'
export const DOC_TABLE = 'gullak_documents'
