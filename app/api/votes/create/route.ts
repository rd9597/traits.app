import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type TraitWithMirror = {
  id: string
  mirrors:
    | {
        expires_at: string | null
      }
    | {
        expires_at: string | null
      }[]
    | null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = await createClient()

    const mirrorId = String(body.mirrorId || '').trim()
    const traitId = String(body.traitId || '').trim()
    const voterKey = String(body.voterKey || '').trim()

    if (!mirrorId || !traitId || !voterKey) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 },
      )
    }

    const { data: trait } = await supabase
      .from('mirror_traits')
      .select('id, mirrors!inner(expires_at)')
      .eq('id', traitId)
      .eq('mirror_id', mirrorId)
      .single<TraitWithMirror>()

    if (!trait) {
      return NextResponse.json(
        { error: 'Invalid trait.' },
        { status: 400 },
      )
    }

    const mirror = Array.isArray(trait.mirrors)
      ? trait.mirrors[0]
      : trait.mirrors

    if (
      mirror?.expires_at &&
      new Date(mirror.expires_at).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: 'This mirror has expired.' },
        { status: 410 },
      )
    }

    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('mirror_id', mirrorId)
      .eq('voter_key', voterKey)
      .maybeSingle()

    if (existingVote) {
      return NextResponse.json(
        { error: 'You already submitted a trait.' },
        { status: 409 },
      )
    }

    const { error } = await supabase.from('votes').insert({
      mirror_id: mirrorId,
      trait_id: traitId,
      voter_key: voterKey,
    })

    if (error) {
      return NextResponse.json(
        { error: 'Trait submit failed. Try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Trait submit failed. Try again.' },
      { status: 500 },
    )
  }
}