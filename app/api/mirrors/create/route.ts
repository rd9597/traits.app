import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type MirrorTone = 'plus' | 'minus'

const traitBank: Record<string, Record<MirrorTone, string[]>> = {
  friendship: {
    plus: [
      'Group glue',
      'Therapist friend',
      'Loyal backup',
      'Silent supporter',
      'Energy lifter',
      'Safe place',
    ],
    minus: [
      'Disappears suddenly',
      'Too hard to read',
      'Secretly sensitive',
      'Avoids confrontation',
      'Overthinks everything',
      'Needs chasing',
    ],
  },
  dating_relationships: {
    plus: [
      'Loves deeply',
      'Emotionally safe',
      'Protective partner',
      'Slow-burn charm',
      'Green flag energy',
      'Quietly loyal',
    ],
    minus: [
      'Mixed signals',
      'Emotionally guarded',
      'Gets attached silently',
      'Tests people',
      'Cold when hurt',
      'Hard to reassure',
    ],
  },
  hidden_self: {
    plus: [
      'Stronger than shown',
      'Deep feeler',
      'Quietly observant',
      'Emotionally mature',
      'Hidden confidence',
      'Soft inside',
    ],
    minus: [
      'Hides pain',
      'Pretends not to care',
      'Overthinks silently',
      'Trust issues',
      'Fear of rejection',
      'Smiles through stress',
    ],
  },
  first_impression: {
    plus: [
      'Magnetic presence',
      'Calm confidence',
      'Interesting silence',
      'Cool aura',
      'Easy to notice',
      'Naturally charming',
    ],
    minus: [
      'Unapproachable',
      'Too serious',
      'Hard to read',
      'Looks arrogant',
      'Quietly intimidating',
      'Emotionless face',
    ],
  },
  career_study: {
    plus: [
      'Reliable under pressure',
      'Quiet achiever',
      'Team anchor',
      'Fast learner',
      'Problem solver',
      'Focused worker',
    ],
    minus: [
      'Last-minute panic',
      'Gets distracted',
      'Avoids asking help',
      'Pressure sensitive',
      'Inconsistent energy',
      'Overthinks tasks',
    ],
  },
  chaos_mode: {
    plus: [
      'Accidentally iconic',
      'Chaos entertainer',
      'Plot twist person',
      'Drama survivor',
      'Meme material',
      'Funny without trying',
    ],
    minus: [
      'Drama magnet',
      'Trouble starter',
      'Walking red flag',
      'Unpredictable energy',
      'Messy decision maker',
      'Too unserious',
    ],
  },
}

function createSlug() {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 16)
}

function isMirrorTone(value: unknown): value is MirrorTone {
  return value === 'plus' || value === 'minus'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const category = String(body.category || '').trim()
    const question = String(body.question || '').trim()
    const tone = body.tone
    const language = String(body.language || 'english').trim()
    const creatorKey =
      String(body.creatorKey || '').trim() || crypto.randomUUID()

    if (!category || !traitBank[category]) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    }

    if (!isMirrorTone(tone)) {
      return NextResponse.json({ error: 'Invalid mirror type.' }, { status: 400 })
    }

    if (!question || question.length > 120) {
      return NextResponse.json({ error: 'Invalid question.' }, { status: 400 })
    }

    const supabase = await createClient()
    const slug = createSlug()

    const { data: mirror, error: mirrorError } = await supabase
      .from('mirrors')
      .insert({
        slug,
        question,
        language,
        creator_key: creatorKey,
        category,
        tone,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })

      .select('id, slug')
      .single()

    if (mirrorError || !mirror) {
      return NextResponse.json(
        { error: mirrorError?.message || 'Failed to create mirror.' },
        { status: 500 }
      )
    }

    const traits = traitBank[category][tone].map((label, index) => ({
      mirror_id: mirror.id,
      label,
      sort_order: index + 1,
    }))

    const { error: traitsError } = await supabase
      .from('mirror_traits')
      .insert(traits)

    if (traitsError) {
      await supabase.from('mirrors').delete().eq('id', mirror.id)

      return NextResponse.json(
        { error: traitsError.message },
        { status: 500 }
      )
    }

    await supabase.from('analytics_events').insert({
      event_type: 'mirror_created',
      mirror_slug: mirror.slug,
      metadata: {
        category,
        tone,
        language,
      }, 
    })

    return NextResponse.json({
      slug: mirror.slug,
    })
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    )
  }
}