/**
 * Server-side Supabase Realtime Service
 * Sunucudan kullanıcılara, konuşmalara veya herkese anlık Realtime broadcast gönderir.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dyiqfounesugdljzzebh.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_irls6ujUsDGr3ImADjaKMA_pgxe-_hy'

let serverSupabase: any = null

function getServerSupabase() {
  if (!serverSupabase) {
    serverSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    })
  }
  return serverSupabase
}

/**
 * Belirli bir kullanıcıya anlık bildirim/olay gönderir (user:userId kanalı)
 */
export async function broadcastToUser(userId: string, event: string, payload: any): Promise<boolean> {
  try {
    const supabase = getServerSupabase()
    const channel = supabase.channel(`user:${userId}`)

    await new Promise<void>((resolve) => {
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') resolve()
      })
      setTimeout(resolve, 1500)
    })

    await channel.send({
      type: 'broadcast',
      event,
      payload,
    })

    await supabase.removeChannel(channel)
    console.log(`[Supabase Realtime Server] Broadcast gönderildi → user:${userId} (${event})`)
    return true
  } catch (err: any) {
    console.warn(`[Supabase Realtime Server] Gönderim hatası (user:${userId}):`, err?.message || err)
    return false
  }
}

/**
 * Belirli bir sohbete anlık mesaj veya durum gönderir (conversation:convId kanalı)
 */
export async function broadcastToConversation(conversationId: string, event: string, payload: any): Promise<boolean> {
  try {
    const supabase = getServerSupabase()
    const channel = supabase.channel(`conversation:${conversationId}`)

    await new Promise<void>((resolve) => {
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') resolve()
      })
      setTimeout(resolve, 1500)
    })

    await channel.send({
      type: 'broadcast',
      event,
      payload,
    })

    await supabase.removeChannel(channel)
    console.log(`[Supabase Realtime Server] Broadcast gönderildi → conversation:${conversationId} (${event})`)
    return true
  } catch (err: any) {
    console.warn(`[Supabase Realtime Server] Gönderim hatası (conversation:${conversationId}):`, err?.message || err)
    return false
  }
}

/**
 * Tüm online kullanıcılara genel sistem yayını gönderir (gunubirlik:global kanalı)
 */
export async function broadcastToAll(event: string, payload: any): Promise<boolean> {
  try {
    const supabase = getServerSupabase()
    const channel = supabase.channel('gunubirlik:global')

    await new Promise<void>((resolve) => {
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') resolve()
      })
      setTimeout(resolve, 1500)
    })

    await channel.send({
      type: 'broadcast',
      event,
      payload,
    })

    await supabase.removeChannel(channel)
    console.log(`[Supabase Realtime Server] Global broadcast gönderildi (${event})`)
    return true
  } catch (err: any) {
    console.warn(`[Supabase Realtime Server] Global broadcast hatası:`, err?.message || err)
    return false
  }
}
