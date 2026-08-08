import type { AppData } from '@/types'
import { DOC_ID, DOC_TABLE, supabase } from '@/lib/supabase'

/** currentProfileId is device-local and must not be shared across devices. */
export function shared(data: AppData): Omit<AppData, 'currentProfileId'> {
  const { currentProfileId, ...rest } = data
  return rest
}

export async function loadRemote(): Promise<AppData | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase.from(DOC_TABLE).select('data').eq('id', DOC_ID).maybeSingle()
    if (error) {
      console.warn('[gullak] loadRemote:', error.message)
      return null
    }
    return (data?.data as AppData) ?? null
  } catch (e) {
    console.warn('[gullak] loadRemote failed', e)
    return null
  }
}

export async function saveRemote(data: AppData): Promise<void> {
  if (!supabase) return
  try {
    const { error } = await supabase
      .from(DOC_TABLE)
      .upsert({ id: DOC_ID, data: shared(data), updated_at: new Date().toISOString() })
    if (error) console.warn('[gullak] saveRemote:', error.message)
  } catch (e) {
    console.warn('[gullak] saveRemote failed', e)
  }
}

export function subscribeRemote(onChange: (data: AppData) => void): () => void {
  const client = supabase
  if (!client) return () => {}
  const channel = client
    .channel('gullak-doc')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: DOC_TABLE, filter: `id=eq.${DOC_ID}` },
      (payload: { new?: { data?: AppData } }) => {
        const next = payload.new?.data
        if (next) onChange(next)
      },
    )
    .subscribe()
  return () => {
    client.removeChannel(channel)
  }
}
