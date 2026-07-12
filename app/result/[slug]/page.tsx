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
    <main className="min-h-screen bg-[#191917] px-5 py-8 text-foreground">
      <section className="mx-auto flex min-h-[85vh] w-full max-w-md items-center justify-center">
        <div className="relative flex min-h-[680px] w-full max-w-[390px] flex-col overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#09090D] px-6 py-7 shadow-[0_0_70px_rgba(255,90,95,0.10)]">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/10 blur-[80px]" />

          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />

              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-accent">
                Identity Mirror
              </p>
            </div>

            <p className="mt-2 text-[10px] tracking-wide text-foreground-muted">
              Anonymous social feedback
            </p>
          </div>

          <div className="relative mt-14">
            {hasPatternUnlock ? (
              <>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-accent">
                  Social pattern
                </p>

                <section className="relative mt-4 overflow-hidden rounded-[22px] border border-accent/20 bg-accent px-5 py-5 text-accent-foreground">
                  <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-white/15 blur-[70px]" />

                  <div className="relative">
                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-black/50">
                      What people consistently felt
                    </p>

                    {hasTie ? (
                      <>
                        <h1 className="font-identity mt-3 text-[27px] leading-[1.08] tracking-[-0.035em]">
                          Your social identity is still forming.
                        </h1>

                        <p className="mt-4 text-[12px] leading-5 text-black/65">
                          Two different perceptions appeared almost equally
                          often. People do not see one dominant side of you yet.
                        </p>
                      </>
                    ) : (
                      <>
                        <h1 className="font-identity mt-3 text-[28px] leading-[1.07] tracking-[-0.04em]">
                          {socialPattern.title}
                        </h1>

                        <p className="mt-4 text-[12px] leading-5 text-black/65">
                          {socialPattern.body}
                        </p>
                      </>
                    )}
                  </div>
                </section>

                <section className="mt-3 rounded-[16px] border border-white/[0.09] bg-white/[0.04] px-4 py-3">
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground-muted">
                    Confidence
                  </p>

                  <p className="mt-1.5 text-[10px] text-foreground-secondary">
                    {topTrait?.count || 0} of {totalPicks} picks formed this
                    pattern.
                  </p>
                </section>

                <section className="mt-4 rounded-[20px] border border-white/[0.09] bg-white/[0.025] px-4 py-4">
                  <p className="text-[8px] font-bold uppercase tracking-[0.21em] text-accent">
                    Complete identity report locked
                  </p>

                  <h2 className="font-identity mt-3 text-[21px] leading-[1.1] tracking-[-0.03em]">
                    There is more your friends revealed.
                  </h2>

                  <div className="mt-4 space-y-2">
                    <div className="rounded-[12px] bg-white/[0.05] px-3 py-3">
                      <p className="text-[8px] font-bold uppercase tracking-[0.17em] text-foreground-muted">
                        Unlocked
                      </p>

                      <p className="mt-1 text-[10px] font-semibold text-foreground">
                        Strongest signal: {topTrait?.label || 'Hidden'}
                      </p>
                    </div>

                    {[
                      'Why people keep seeing this side',
                      'The contradiction in how people read you',
                      'Your first-impression gap',
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-[12px] bg-white/[0.035] px-3 py-3"
                      >
                        <span className="text-[9px] text-accent">🔒</span>

                        <p className="text-[10px] font-medium text-foreground-muted">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-foreground-muted">
                  {totalPicks} anonymous response
                  {totalPicks !== 1 ? 's' : ''}
                </p>

                <h1 className="font-identity mt-4 text-[33px] leading-[1.02] tracking-[-0.045em]">
                  They formed one clear pattern about you.
                </h1>

                <p className="mt-4 text-[11px] leading-5 text-foreground-secondary">
                  Your result is ready, but the strongest social signal is still
                  hidden.
                </p>

                <section className="relative mt-6 overflow-hidden rounded-[20px] border border-accent/20 bg-white/[0.025] px-4 py-4">
                  <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-[70px]" />

                  <div className="relative">
                    <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-accent">
                      Main signal locked
                    </p>

                    <div className="mt-5 h-3.5 rounded-full bg-white/[0.10] blur-[3px]" />
                    <div className="mt-3 h-3.5 w-3/4 rounded-full bg-white/[0.07] blur-[3px]" />

                    <p className="mt-4 text-[10px] leading-5 text-foreground-muted">
                      Unlock the social pattern your friends consistently
                      formed.
                    </p>
                  </div>
                </section>
              </>
            )}
          </div>

          <div className="relative mt-auto pt-5">
            <ResultCtaButton
              slug={slug}
              hasPatternUnlock={hasPatternUnlock}
              hasFullUnlock={false}
            />
          </div>
        </div>
      </section>
    </main>
  )
}