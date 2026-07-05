import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResultCtaButton from './result-cta-button'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

type TraitCount = {
  id: string
  label: string
  count: number
}

export default async function ResultPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: mirror } = await supabase
    .from('mirrors')
    .select('id, question, is_removed')
    .eq('slug', slug)
    .single()

  if (!mirror || mirror.is_removed) {
    notFound()
  }

  await supabase.from('analytics_events').insert({
    event_type: 'result_opened',
    mirror_slug: slug,
    metadata: {},
  })

  const { data: traits } = await supabase
    .from('mirror_traits')
    .select('id, label')
    .eq('mirror_id', mirror.id)

  const { data: votes } = await supabase
    .from('votes')
    .select('trait_id')
    .eq('mirror_id', mirror.id)

  const rankedTraits: TraitCount[] = (traits || [])
    .map((trait) => ({
      id: trait.id,
      label: trait.label,
      count:
        votes?.filter((vote) => vote.trait_id === trait.id).length || 0,
    }))
    .filter((trait) => trait.count > 0)
    .sort((a, b) => b.count - a.count)

  const topTrait = rankedTraits[0]
  const hiddenTraitCount = Math.max(rankedTraits.length - 1, 0)
  const totalPicks = votes?.length || 0

  return (
    <main className="min-h-screen bg-[#1c1c1a] px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[85vh] w-full max-w-md items-center justify-center">
        <div className="relative flex min-h-170 w-full flex-col rounded-[2.5rem] bg-[#07070d] px-7 py-8 shadow-[0_0_70px_rgba(163,230,53,0.14)]">
          <div>
            <p className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.22em] text-lime-400">
              <span className="h-3 w-3 rounded-full bg-lime-400" />
              Mirror
            </p>

            <p className="mt-3 font-mono text-base lowercase tracking-wide text-white/50">
              someone&apos;s mirror
            </p>
          </div>

          <div className="mt-40">
            <p className="font-mono text-sm uppercase tracking-[0.24em] text-white/50">
              Friends picked
            </p>

            <h1 className="mt-4 text-6xl font-light leading-none tracking-[-0.08em] text-lime-400">
              {topTrait?.label || 'Hidden trait'}
            </h1>

            <p className="mt-6 font-mono text-base leading-7 text-white/55">
              picked by {totalPicks} anonymous friend
              {totalPicks !== 1 ? 's' : ''}
            </p>

            <div className="mt-8 rounded-3xl border border-white/15 px-6 py-5">
              <p className="font-mono text-sm uppercase tracking-[0.22em] text-white/45">
                +{hiddenTraitCount} more trait
                {hiddenTraitCount !== 1 ? 's' : ''}
              </p>

              <div className="mt-5 h-5 rounded-full bg-white/10 blur-sm" />
            </div>
          </div>

          <div className="mt-auto">
            <ResultCtaButton slug={slug} />

            <p className="mt-5 text-center font-mono text-sm tracking-wider text-white/35">
              traits-app-gold.vercel.app
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}