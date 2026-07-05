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

function getTraitMeaning(label: string) {
  const meanings: Record<string, string> = {
    'Group glue': 'The person holding the group together.',
    'Therapist friend': 'The person everyone trusts with their real feelings.',
    'Loyal backup': 'The one who quietly shows up when it matters.',
    'Silent supporter': 'The calm presence people feel safe around.',
    'Energy lifter': 'The one who changes the mood when they enter.',
    'Safe place': 'The person people feel comfortable being real with.',
  }

  return meanings[label] || 'The trait your friends strongly feel from you.'
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

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[85vh] w-full max-w-md flex-col justify-center">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-8 shadow-[0_0_80px_rgba(163,230,53,0.12)]">
          <p className="text-center text-xs font-black uppercase tracking-[0.28em] text-lime-400">
            Your friends see you as
          </p>

          <h1 className="mt-8 text-center text-6xl font-black uppercase leading-[0.9] tracking-tight text-lime-400">
            {topTrait?.label || 'Unknown Trait'}
          </h1>

          <p className="mt-6 text-center text-lg font-bold leading-7 text-white/85">
            {topTrait
              ? getTraitMeaning(topTrait.label)
              : 'Your trait will appear after friends pick it.'}
          </p>

          <div className="my-8 border-t border-dashed border-lime-400/40" />

          <p className="text-center text-xl font-black leading-8 text-white">
            {topTrait?.count || 0} friend
            {topTrait?.count !== 1 ? 's' : ''}{' '}
            <span className="text-lime-400">independently</span> picked this
            trait.
          </p>

          <div className="my-8 border-t border-dashed border-lime-400/40" />

          <p className="text-center text-2xl font-black leading-9 tracking-tight text-white">
            What trait would your friends pick for you?
          </p>

          <Link
            href="/create"
            className="mt-8 block w-full rounded-2xl bg-lime-400 px-5 py-4 text-center text-base font-black text-black"
          >
            Find Your Trait
          </Link>
        </div>
      </section>
    </main>
  )
}