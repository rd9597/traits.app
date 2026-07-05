import { createClient } from '@/lib/supabase/server'
import AdminAnalyticsClient from './admin-analytics-client'

export const dynamic = 'force-dynamic'

const trackedEvents = [
  'mirror_created',
  'trait_submitted',
  'reveal_opened',
  'result_shared',
  'result_opened',
  'result_to_create',
] as const

type TrackedEvent = (typeof trackedEvents)[number]

type AnalyticsRow = {
  event_type: string
  mirror_slug: string | null
}

function getPercentage(from: number, to: number) {
  if (from <= 0) return '0%'
  return `${Math.round((to / from) * 100)}%`
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('analytics_events')
    .select('event_type, mirror_slug')

  const counts = trackedEvents.reduce<Record<TrackedEvent, number>>(
    (acc, event) => {
      acc[event] = 0
      return acc
    },
    {} as Record<TrackedEvent, number>,
  )

  const mirrorCreatedSlugs = new Set<string>()
  const traitSubmittedSlugs = new Set<string>()
  const revealOpenedSlugs = new Set<string>()
  const resultSharedSlugs = new Set<string>()
  const resultOpenedSlugs = new Set<string>()
  const resultToCreateSlugs = new Set<string>()

  ;(events as AnalyticsRow[] | null)?.forEach((event) => {
    if (trackedEvents.includes(event.event_type as TrackedEvent)) {
      counts[event.event_type as TrackedEvent] += 1
    }

    if (!event.mirror_slug) return

    if (event.event_type === 'mirror_created') {
      mirrorCreatedSlugs.add(event.mirror_slug)
    }

    if (event.event_type === 'trait_submitted') {
      traitSubmittedSlugs.add(event.mirror_slug)
    }

    if (event.event_type === 'reveal_opened') {
      revealOpenedSlugs.add(event.mirror_slug)
    }

    if (event.event_type === 'result_shared') {
      resultSharedSlugs.add(event.mirror_slug)
    }

    if (event.event_type === 'result_opened') {
      resultOpenedSlugs.add(event.mirror_slug)
    }

    if (event.event_type === 'result_to_create') {
      resultToCreateSlugs.add(event.mirror_slug)
    }
  })

  const funnelMetrics = [
    {
      label: 'Mirror Created → Trait Submitted',
      value: getPercentage(mirrorCreatedSlugs.size, traitSubmittedSlugs.size),
    },
    {
      label: 'Reveal Opened → Result Shared',
      value: getPercentage(revealOpenedSlugs.size, resultSharedSlugs.size),
    },
    {
      label: 'Result Opened → Result To Create',
      value: getPercentage(resultOpenedSlugs.size, resultToCreateSlugs.size),
    },
  ]

  return (
  <AdminAnalyticsClient>
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">
          Admin
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight">
          Analytics Dashboard
        </h1>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {trackedEvents.map((event) => (
            <div
              key={event}
              className="rounded-3xl border border-white/10 bg-white/4 p-4"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/35">
                {event.replaceAll('_', ' ')}
              </p>
              <p className="mt-3 text-3xl font-black">{counts[event]}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-black">Funnel Conversion</h2>

          {funnelMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-3xl border border-white/10 bg-white/4 p-4"
            >
              <p className="text-sm text-white/55">{metric.label}</p>
              <p className="mt-2 text-3xl font-black">{metric.value}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  </AdminAnalyticsClient>
  )
}