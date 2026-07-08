import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'

type UnlockTier = 'pattern' | 'full'

type OrderRequestBody = {
  slug?: unknown
  unlockTier?: unknown
}

const unlockAmounts: Record<UnlockTier, number> = {
  pattern: 1900,
  full: 9900,
}

function isValidUnlockTier(value: unknown): value is UnlockTier {
  return value === 'pattern' || value === 'full'
}

export async function POST(req: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: 'Razorpay is not configured' },
      { status: 500 }
    )
  }

  const body = (await req.json().catch(() => null)) as OrderRequestBody | null

  if (!body || typeof body.slug !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!isValidUnlockTier(body.unlockTier)) {
    return NextResponse.json({ error: 'Invalid unlock tier' }, { status: 400 })
  }

  const slug = body.slug
  const unlockTier = body.unlockTier

  const supabase = await createClient()

  const { data: mirror } = await supabase
    .from('mirrors')
    .select('id, slug, is_removed')
    .eq('slug', slug)
    .single()

  if (!mirror || mirror.is_removed) {
    return NextResponse.json({ error: 'Mirror not found' }, { status: 404 })
  }

  const { data: existingUnlock } = await supabase
    .from('mirror_unlocks')
    .select('id')
    .eq('mirror_id', mirror.id)
    .eq('unlock_tier', unlockTier)
    .maybeSingle()

  if (existingUnlock) {
    return NextResponse.json({ alreadyUnlocked: true })
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })

  const order = await razorpay.orders.create({
    amount: unlockAmounts[unlockTier],
    currency: 'INR',
    receipt: `${mirror.id}_${unlockTier}`.slice(0, 40),
    notes: {
      mirror_id: mirror.id,
      slug: mirror.slug,
      unlock_tier: unlockTier,
    },
  })

  return NextResponse.json({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    unlockTier,
  })
}