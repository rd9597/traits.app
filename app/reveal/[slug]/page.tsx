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

function getSocialPattern(label: string | undefined) {
  const normalizedLabel = String(label || '').toLowerCase()

  if (normalizedLabel.includes('soft')) {
    return {
      title: 'People think you feel more than you show.',
      body: 'Friends may sense that you care deeply, but you do not reveal that side easily. That makes people feel there is a softer version of you they only see when they get close.',
    }
  }

  if (normalizedLabel.includes('guarded')) {
    return {
      title: 'People feel they have to earn your trust.',
      body: 'You do not open up instantly, so friends may see you as emotionally reserved — not cold, just hard to fully read at first.',
    }
  }

  if (normalizedLabel.includes('leader')) {
    return {
      title: 'People quietly look to you for direction.',
      body: 'Even when you are not trying to lead, your reaction affects the room more than you may realize.',
    }
  }

  if (normalizedLabel.includes('loyal')) {
    return {
      title: 'People see you as someone who stays.',
      body: 'Friends may feel that once you care, you become a steady presence they can rely on.',
    }
  }

  return {
    title: 'People noticed a side of you that is not obvious.',
    body: 'The strongest pattern was not just a trait. It was the way friends experience your presence when they are around you.',
  }
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

  await supabase.from('analytics_events').insert({
    event_type: 'reveal_opened',
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
    .slice(0, 3)

  const totalTraits = votes?.length || 0
  const topTrait = rankedTraits[0]
  const secondaryTraits = rankedTraits.slice(1)
  const socialPattern = getSocialPattern(topTrait?.label)

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

            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight">
              {socialPattern.title}
            </h2>

            <p className="mt-5 text-sm font-bold leading-6 text-black/70">
              {socialPattern.body}
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

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">
            Complete Identity Report
          </p>

          <h3 className="mt-3 text-2xl font-black leading-tight tracking-tight text-white">
            See the full version your friends unlocked about you.
          </h3>

          <p className="mt-3 text-sm font-bold leading-6 text-white/55">
            Get the deeper read: why people see you this way, what it says about your
            social image, and the part they may not say directly.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <p className="text-lg font-black text-white">3</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                Signals
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <p className="text-lg font-black text-white">₹49</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                Unlock
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <p className="text-lg font-black text-white">1</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                Report
              </p>
            </div>
          </div>

          <a
            href={`/result/${slug}`}
            className="mt-5 block w-full rounded-2xl bg-lime-400 px-5 py-4 text-center text-sm font-black text-black"
         >
            Unlock Complete Report →
        </a>
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