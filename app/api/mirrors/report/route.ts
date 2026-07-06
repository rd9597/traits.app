import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedReasons = [
  'harassment',
  'underage',
  'spam',
  'other',
] as const

type ReportReason = (typeof allowedReasons)[number]

function isValidReason(value: unknown): value is ReportReason {
  return allowedReasons.includes(value as ReportReason)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = await createClient()

    const mirrorId = String(body.mirrorId || '').trim()
    const mirrorSlug = String(body.mirrorSlug || '').trim()
    const reporterKey = String(body.reporterKey || '').trim()
    const reason = body.reason

    if (!mirrorId || !mirrorSlug || !reporterKey) {
      return NextResponse.json(
        {
          error: 'Missing required fields.',
        },
        {
          status: 400,
        },
      )
    }

    if (!isValidReason(reason)) {
      return NextResponse.json(
        {
          error: 'Invalid reason.',
        },
        {
          status: 400,
        },
      )
    }

    const { error } = await supabase
      .from('mirror_reports')
      .insert({
        mirror_id: mirrorId,
        mirror_slug: mirrorSlug,
        reporter_key: reporterKey,
        reason,
      })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          {
            error: 'You already reported this mirror.',
          },
          {
            status: 409,
          },
        )
      }

      return NextResponse.json(
        {
          error: 'Failed to submit report.',
        },
        {
          status: 500,
        },
      )
    }

    const { data: reports, error: reportsError } = await supabase
      .from('mirror_reports')
      .select('id')
      .eq('mirror_id', mirrorId)

    if (reportsError) {
      console.error('Failed to count mirror reports:', reportsError.message)
    }

    if ((reports?.length ?? 0) >= 3) {
      const { error: removeError } = await supabase
         .from('mirrors')
         .update({
           is_removed: true,
        })
        .eq('id', mirrorId)

       if (removeError) {
          console.error('Failed to auto-remove mirror:', removeError.message)
      }
   }

    return NextResponse.json({
      success: true,
    })
  } catch {
    return NextResponse.json(
      {
        error: 'Invalid request.',
      },
      {
        status: 400,
      },
    )
  }
}   