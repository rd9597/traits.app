import crypto from 'crypto'
import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'

type UnlockTier = 'pattern' | 'full'

type VerifyRequestBody = {
  slug?: unknown
  unlockTier?: unknown
  razorpayPaymentId?: unknown
  razorpayOrderId?: unknown
  razorpaySignature?: unknown
}

const unlockAmounts: Record<UnlockTier, number> = {
  pattern: 1900,
  full: 4900,
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

  const body = (await req.json().catch(() => null)) as VerifyRequestBody | null

  if (
    !body ||
    typeof body.slug !== 'string' ||
    !isValidUnlockTier(body.unlockTier) ||
    typeof body.razorpayPaymentId !== 'string' ||
    typeof body.razorpayOrderId !== 'string' ||
    typeof body.razorpaySignature !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const slug = body.slug
  const unlockTier = body.unlockTier

  const payload = `${body.razorpayOrderId}|${body.razorpayPaymentId}`

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex')

  if (expectedSignature !== body.razorpaySignature) {
    return NextResponse.json(
      { error: 'Invalid payment signature' },
      { status: 400 }
    )
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })

  const order = await razorpay.orders.fetch(body.razorpayOrderId)

  if (
    order.amount !== unlockAmounts[unlockTier] ||
    order.currency !== 'INR' ||
    order.notes?.slug !== slug ||
    order.notes?.unlock_tier !== unlockTier
  ) {
    return NextResponse.json({ error: 'Invalid payment order' }, { status: 400 })
  }

  const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

  const { data: mirror } = await supabase
    .from('mirrors')
    .select('id, is_removed')
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
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase.from('mirror_unlocks').insert({
    mirror_id: mirror.id,
    unlock_tier: unlockTier,
  })

  if (error) {
  console.error('Mirror unlock insert failed:', error)

  return NextResponse.json({ error: 'Unlock failed' }, { status: 500 })
}

  return NextResponse.json({ ok: true })
}