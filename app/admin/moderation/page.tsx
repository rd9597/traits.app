import { createClient } from '@supabase/supabase-js'
import { hideMirror, restoreMirror } from './actions'

type ReportRow = {
  mirror_id: string
  mirror_slug: string
  reason: string
}

type MirrorRow = {
  id: string
  is_removed: boolean
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const dynamic = 'force-dynamic'

export default async function AdminModerationPage() {
  const { data: reportRows } = await supabase
    .from('mirror_reports')
    .select('mirror_id, mirror_slug, reason')

  const mirrorIds = Array.from(
    new Set((reportRows || []).map((report) => report.mirror_id)),
  )

  const { data: mirrorRows } =
    mirrorIds.length > 0
      ? await supabase
          .from('mirrors')
          .select('id, is_removed')
          .in('id', mirrorIds)
      : { data: [] }

  const mirrorStatusById = new Map(
    ((mirrorRows || []) as MirrorRow[]).map((mirror) => [
      mirror.id,
      mirror.is_removed,
    ]),
  )

  const grouped = new Map<
    string,
    {
      mirrorId: string
      slug: string
      question: string
      isRemoved: boolean
      reasons: string[]
    }
  >()

  ;((reportRows || []) as ReportRow[]).forEach((report) => {
    const existing = grouped.get(report.mirror_id)

    if (existing) {
      existing.reasons.push(report.reason)
      return
    }

    grouped.set(report.mirror_id, {
      mirrorId: report.mirror_id,
      slug: report.mirror_slug,
      question: 'Reported mirror',
      isRemoved: mirrorStatusById.get(report.mirror_id) ?? false,
      reasons: [report.reason],
    })
  })

  const reports = Array.from(grouped.values())

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">
          Admin
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight">
          Moderation Queue
        </h1>

        <div className="mt-8 space-y-4">
          {reports.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/4 p-6">
              <p className="text-white/50">No reported mirrors.</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={`${report.mirrorId}-${report.isRemoved}`}
                className="rounded-3xl border border-white/10 bg-white/4 p-5"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">
                  {report.slug}
                </p>

                <h2 className="mt-3 text-xl font-black">{report.question}</h2>

                <p className="mt-3 text-sm text-white/50">
                  Reports: {report.reasons.length}
                </p>

                <p className="mt-2 text-sm text-white/50">
                  Reasons: {report.reasons.join(', ')}
                </p>

                <div className="mt-5 flex gap-3">
                  <form
                    action={
                      report.isRemoved
                        ? restoreMirror.bind(null, report.mirrorId)
                        : hideMirror.bind(null, report.mirrorId)
                    }
                  >
                    <button
                      className={`rounded-2xl px-5 py-3 text-sm font-black ${
                        report.isRemoved
                          ? 'bg-lime-400 text-black'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {report.isRemoved ? 'Restore Mirror' : 'Hide Mirror'}
                    </button>
                  </form>

                  <a
                    href={`/mirror/${report.slug}`}
                    target="_blank"
                    className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black"
                  >
                    Open Mirror
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}