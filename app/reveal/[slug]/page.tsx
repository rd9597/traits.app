import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShareResultButton from './share-result-button'

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

export default async function RevealPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://traits-app-gold.vercel.app'

  const { data: mirror } = await supabase
    .from('mirrors')
    .select('id, question, is_removed')
    .eq('slug', slug)
    .single()

  if (!mirror || mirror.is_removed) {
    notFound()
  }

  const { error: revealAnalyticsError } = await supabase
  .from('analytics_events')
  .insert({
    event_type: 'reveal_opened',
    mirror_slug: slug,
    metadata: {},
  })

console.log('reveal_opened error:', revealAnalyticsError)

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
    .slice(0, 3)

  const totalTraits = votes?.length || 0
  const topTrait = rankedTraits[0]
  const secondaryTraits = rankedTraits.slice(1)

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[85vh] w-full max-w-md flex-col justify-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-400">
          Reveal unlocked
        </p>

        <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight">
          Your Mirror says...
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/50">
          Based on {totalTraits} anonymous traits from friends.
        </p>

        {topTrait ? (
          <div className="mt-8 rounded-3xl border border-lime-400/40 bg-lime-400 px-5 py-6 text-black">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-black/55">
              Main energy
            </p>

            <h2 className="mt-4 text-4xl font-black leading-none tracking-tight">
              {topTrait.label}
            </h2>

            <p className="mt-5 text-sm font-bold leading-6 text-black/70">
              This is the trait your friends noticed the most.
            </p>

            <p className="mt-4 text-sm font-black text-black">
              {topTrait.count} friend
              {topTrait.count !== 1 ? 's' : ''} picked this.
            </p>
          </div>
        ) : null}

        {secondaryTraits.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/4 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
              Also showed up
            </p>

            <div className="mt-4 space-y-3">
              {secondaryTraits.map((trait) => (
                <div
                  key={trait.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-4 py-3"
                >
                  <p className="text-sm font-black text-white">
                    {trait.label}
                  </p>

                  <p className="shrink-0 text-xs font-bold text-lime-400">
                    {trait.count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/4 p-5">
          <p className="text-sm font-bold leading-6 text-white/60">
            Your friends did not answer a personality test. They picked the
            traits they actually felt from you.
          </p>
        </div>

        <ShareResultButton
          slug={slug}
          appUrl={appUrl}
          topTraitLabel={topTrait?.label}
        />
      </section>
    </main>
  )
}