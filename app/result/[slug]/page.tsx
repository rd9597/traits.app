import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
  const secondaryTraits = rankedTraits.slice(1, 3)

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[85vh] w-full max-w-md flex-col justify-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-400">
          Friends picked this trait
        </p>

        <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight">
          What's their trait?
        </h1>

        {topTrait ? (
          <div className="mt-8 rounded-3xl border border-lime-400/40 bg-lime-400 px-5 py-6 text-black">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-black/55">
              Main trait
            </p>

            <h2 className="mt-4 text-4xl font-black leading-none tracking-tight">
              {topTrait.label}
            </h2>

            <p className="mt-5 text-sm font-bold leading-6 text-black/70">
              This is the trait friends picked the most.
            </p>

            <p className="mt-4 text-sm font-black text-black">
              Picked {topTrait.count} time
              {topTrait.count !== 1 ? 's' : ''}
            </p>
          </div>
        ) : null}

        {secondaryTraits.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
              Also noticed
            </p>

            <div className="mt-4 space-y-3">
              {secondaryTraits.map((trait) => (
                <div
                  key={trait.id}
                  className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                >
                  <p className="text-sm font-black">
                    {trait.label}
                  </p>

                  <p className="text-xs font-bold text-lime-400">
                    {trait.count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Link
          href={`/mirror/${slug}`}
          className="mt-6 block w-full rounded-2xl bg-lime-400 px-5 py-4 text-center text-sm font-black text-black"
        >
          Pick Their Trait
        </Link>

        <Link
          href="/create"
          className="mt-3 block w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm font-black text-white"
        >
          Find Your Trait
        </Link>
      </section>
    </main>
  )
}