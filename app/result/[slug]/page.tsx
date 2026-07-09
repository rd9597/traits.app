import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResultCtaButton from './result-cta-button'

export const dynamic = 'force-dynamic'

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
      body: 'Friends sense that you care deeply, but you do not reveal that side easily. That makes people feel there is a softer version of you they only see when they get close.',
    }
  }

  if (normalizedLabel.includes('guarded')) {
    return {
      title: 'People feel they have to earn your trust.',
      body: 'You do not open up instantly, so friends may experience you as emotionally reserved at first — not cold, just careful with who gets access.',
    }
  }

  if (normalizedLabel.includes('loyal')) {
    return {
      title: 'People feel safer when you choose them.',
      body: 'Friends may feel that once you care, you stay steady. Your presence makes people feel protected, even when you are not saying much.',
    }
  }

  if (normalizedLabel.includes('leader')) {
    return {
      title: 'People quietly watch your reaction before deciding.',
      body: 'Even when you are not trying to lead, your opinion affects the room. Friends may treat your approval as a signal that something is worth trusting.',
    }
  }

  return {
    title: 'People noticed a side of you that is not obvious.',
    body: 'The strongest pattern was not just a trait. It was the way friends repeatedly experienced your presence when they were around you.',
  }
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

  const { data: unlocks } = await supabase
    .from('mirror_unlocks')
    .select('unlock_tier')
    .eq('mirror_id', mirror.id)

  const unlockedTiers = new Set(
    (unlocks || []).map((unlock) => unlock.unlock_tier),
  )

  const hasPatternUnlock = unlockedTiers.has('pattern')
  const hasFullUnlock = unlockedTiers.has('full')

  if (hasFullUnlock) {
    redirect(`/result/${slug}/analytics`)
  }

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
  const secondTrait = rankedTraits[1]
  const totalPicks = votes?.length || 0

  const hasTie =
    !!topTrait &&
    !!secondTrait &&
    topTrait.count === secondTrait.count

  const socialPattern = getSocialPattern(topTrait?.label)

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

          <div className="mt-24">
            {hasPatternUnlock ? (
              <>
                <p className="font-mono text-sm uppercase tracking-[0.24em] text-lime-400">
                  Social pattern
                </p>

                <div className="mt-5 rounded-4xl border border-lime-400/30 bg-lime-400 px-6 py-6 text-black">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-black/45">
                    What your friends consistently felt
                  </p>

                  {hasTie ? (
                    <>
                      <h1 className="mt-4 text-3xl font-black leading-tight tracking-tighter">
                        Your social identity is still forming.
                      </h1>

                      <p className="mt-5 text-sm font-bold leading-6 text-black/70">
                        Two different perceptions appeared almost equally often.
                        Right now, people don&apos;t see you in one consistent
                        way.
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="mt-4 text-3xl font-black leading-tight tracking-tighter">
                        {socialPattern.title}
                      </h1>

                      <p className="mt-5 text-sm font-bold leading-6 text-black/70">
                        {socialPattern.body}
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/35">
                    Confidence
                  </p>

                  <p className="mt-2 font-mono text-sm leading-6 text-white/60">
                    {topTrait?.count || 0} of {totalPicks} friends formed this
                    pattern.
                  </p>
                </div>

                <div className="mt-8 rounded-3xl border border-white/15 bg-white/3 px-6 py-5">
                  <p className="font-mono text-sm uppercase tracking-[0.22em] text-lime-400">
                    Complete identity report locked
                  </p>

                  <p className="mt-4 text-2xl font-black leading-tight tracking-tight text-white">
                    There is more your friends revealed.
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl bg-white/7 px-4 py-3">
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/35">
                        Unlocked
                      </p>
                      <p className="mt-1 text-sm font-black text-white">
                        Your strongest social signal: {topTrait?.label || 'Hidden'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/5 px-4 py-3">
                      <p className="text-sm font-bold text-white/45">
                       🔒 Why people keep seeing this side of you
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/5 px-4 py-3">
                      <p className="text-sm font-bold text-white/45">
                       🔒 The contradiction in how friends read you
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 px-4 py-3">
                    <p className="text-sm font-bold text-white/45">
                     🔒 Your first-impression vs real-impression gap
                    </p>
                  </div>
                 </div>

                    <p className="mt-5 font-mono text-xs leading-5 text-white/35">
                      Unlock the complete report to see the deeper identity read behind this
                      pattern.
                    </p>
                </div>
              </>
            ) : (
              <>
                <p className="font-mono text-sm uppercase tracking-[0.24em] text-white/50">
                  3 friends responded
                </p>

                <p className="mt-4 text-5xl font-light leading-[0.95] tracking-[-0.08em] text-lime-400">
                  They formed one clear pattern about you.
                </p>

                <p className="mt-6 font-mono text-base leading-7 text-white/55">
                  Your result is ready, but the main signal is hidden.
                </p>

                <div className="mt-8 rounded-3xl border border-white/15 px-6 py-5">
                  <p className="font-mono text-sm uppercase tracking-[0.22em] text-white/45">
                    Main signal locked
                  </p>

                  <div className="mt-5 h-5 rounded-full bg-white/10 blur-sm" />
                  <div className="mt-3 h-5 w-3/4 rounded-full bg-white/10 blur-sm" />

                  <p className="mt-4 font-mono text-xs leading-5 text-white/35">
                    Unlock to see the social pattern your friends created.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mt-auto">
            <ResultCtaButton
              slug={slug}
              hasPatternUnlock={hasPatternUnlock}
              hasFullUnlock={false}
            />

            <p className="mt-5 text-center font-mono text-sm tracking-wider text-white/35">
              traits-app-gold.vercel.app
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}