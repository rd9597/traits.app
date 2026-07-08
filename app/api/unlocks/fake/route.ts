import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type UnlockTier = 'pattern' | 'full'

function isValidUnlockTier(value: unknown): value is UnlockTier {
  return value === 'pattern' || value === 'full'
}

export async function POST(req: Request) {
  const supabase = await createClient()

  const body = await req.json().catch(() => null)

  if (!body || typeof body.slug !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!isValidUnlockTier(body.unlockTier)) {
    return NextResponse.json({ error: 'Invalid unlock tier' }, { status: 400 })
  }

  const { data: mirror } = await supabase
    .from('mirrors')
    .select('id, is_removed')
    .eq('slug', body.slug)
    .single()

  if (!mirror || mirror.is_removed) {
    return NextResponse.json({ error: 'Mirror not found' }, { status: 404 })
  }

 const { data: existingUnlock } = await supabase
  .from('mirror_unlocks')
  .select('id')
  .eq('mirror_id', mirror.id)
  .eq('unlock_tier', body.unlockTier)
  .maybeSingle()

if (existingUnlock) {
  return NextResponse.json({ ok: true })
}

const { error } = await supabase.from('mirror_unlocks').insert({
  mirror_id: mirror.id,
  unlock_tier: body.unlockTier,
})

if (error) {
  return NextResponse.json({ error: 'Unlock failed' }, { status: 500 })
}

  return NextResponse.json({ ok: true })
}