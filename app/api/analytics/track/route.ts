import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedEvents = [
  'mirror_created',
  'mirror_opened',
  'trait_submitted',
  'reveal_unlocked',
  'reveal_opened',
  'result_shared',
  'result_opened',
  'result_to_create',
] as const

type AnalyticsEvent = (typeof allowedEvents)[number]

function isValidEvent(value: unknown): value is AnalyticsEvent {
  return allowedEvents.includes(value as AnalyticsEvent)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const eventType = body.eventType
    const mirrorSlug =
      typeof body.mirrorSlug === 'string'
        ? body.mirrorSlug.trim()
        : null

    const metadata =
      body.metadata && typeof body.metadata === 'object'
        ? body.metadata
        : {}

    if (!isValidEvent(eventType)) {
      return NextResponse.json(
        {
          error: 'Invalid event type',
        },
        {
          status: 400,
        },
      )
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        mirror_slug: mirrorSlug,
        metadata,
      })

    if (error) {
      return NextResponse.json(
        {
          error: 'Failed to track event',
        },
        {
          status: 500,
        },
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch {
    return NextResponse.json(
      {
        error: 'Invalid request',
      },
      {
        status: 400,
      },
    )
  }
}