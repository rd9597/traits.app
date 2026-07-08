import { notFound } from 'next/navigation'
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

function getIdentityMap(
  primaryLabel: string | undefined,
  secondaryLabel: string | undefined
) {
  const primary = String(primaryLabel || '').toLowerCase()
  const secondary = secondaryLabel || 'a side most people miss'

  if (primary.includes('soft')) {
    return [
      {
        title: 'How strangers usually see you',
        body: 'They may think you are calm or emotionally controlled at first.',
      },
      {
        title: 'How close friends experience you',
        body: 'People who get closer notice you feel things much deeper than you show.',
      },
      {
        title: 'What people misunderstand about you',
        body: 'Some may assume you are unaffected, when you are actually just private with your emotions.',
      },
      {
        title: 'Your hidden social advantage',
        body: 'You make people feel emotionally safe because your softness is quiet, not performative.',
      },
      {
        title: 'The effect you leave after you leave',
        body: 'People remember the gentle side of you more than you realize.',
      },
    ]
  }

  if (primary.includes('leader')) {
    return [
      {
        title: 'How strangers usually see you',
        body: 'They may notice that you carry yourself with quiet authority.',
      },
      {
        title: 'How close friends experience you',
        body: `People close to you also notice ${secondary}, which makes your leadership feel more personal.`,
      },
      {
        title: 'What people misunderstand about you',
        body: 'Some people may think you want control, when you actually just notice what needs to be done.',
      },
      {
        title: 'Your hidden social advantage',
        body: 'People naturally look at your reaction before deciding how serious something is.',
      },
      {
        title: 'The effect you leave after you leave',
        body: 'Your opinion often stays in the room even after you are gone.',
      },
    ]
  }

  if (primary.includes('loyal')) {
    return [
      {
        title: 'How strangers usually see you',
        body: 'They may not immediately realize how deeply you attach to people you care about.',
      },
      {
        title: 'How close friends experience you',
        body: 'Close friends experience you as someone who stays steady when others become inconsistent.',
      },
      {
        title: 'What people misunderstand about you',
        body: 'Some may mistake your patience for weakness, when it is actually emotional commitment.',
      },
      {
        title: 'Your hidden social advantage',
        body: 'You make people feel chosen, and that creates strong emotional loyalty back toward you.',
      },
      {
        title: 'The effect you leave after you leave',
        body: 'People remember that you were there when it mattered.',
      },
    ]
  }

  if (primary.includes('guarded')) {
    return [
      {
        title: 'How strangers usually see you',
        body: 'They may feel there is more to you than what you show upfront.',
      },
      {
        title: 'How close friends experience you',
        body: 'People close to you know your trust is slow, but once given, it feels real.',
      },
      {
        title: 'What people misunderstand about you',
        body: 'Some may read your distance as coldness, when it is actually caution.',
      },
      {
        title: 'Your hidden social advantage',
        body: 'You make access to your inner world feel rare, which makes people value it more.',
      },
      {
        title: 'The effect you leave after you leave',
        body: 'People often think about what you did not say as much as what you did say.',
      },
    ]
  }

  return [
    {
      title: 'How strangers usually see you',
      body: 'They first notice your strongest social signal, but may not immediately understand the full meaning behind it.',
    },
    {
      title: 'How close friends experience you',
      body: `People who get closer usually notice ${secondary}. This is the version casual people may miss.`,
    },
    {
      title: 'What people misunderstand about you',
      body: 'Some people may read your silence or reactions too quickly before they understand your actual intent.',
    },
    {
      title: 'Your hidden social advantage',
      body: 'You leave people with a stronger impression than you probably realize, even when you are not trying to stand out.',
    },
    {
      title: 'The effect you leave after you leave',
      body: 'People may replay small moments with you later because your presence creates a clearer emotional memory than expected.',
    },
  ]
}
function getMixedIdentityMap(
  firstLabel: string | undefined,
  secondLabel: string | undefined
) {
  const first = firstLabel || 'your first side'
  const second = secondLabel || 'your second side'

  return [
    {
      title: 'How strangers usually see you',
      body: `People are almost evenly split between seeing you as "${first}" and "${second}".`,
    },
    {
      title: 'How close friends experience you',
      body: 'The people who know you best usually notice both sides depending on the situation, which makes your personality feel more layered than predictable.',
    },
    {
      title: 'What people misunderstand about you',
      body: 'Some people confidently believe they understand you, while others experience a completely different version of you.',
    },
    {
      title: 'Your hidden social advantage',
      body: 'Your ability to naturally show different strengths in different situations makes you difficult to stereotype.',
    },
    {
      title: 'The effect you leave after you leave',
      body: 'People often compare notes about you because their experiences are surprisingly different.',
    },
  ]
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

const identityMap = hasTie
  ? getMixedIdentityMap(
      topTrait?.label,
      secondTrait?.label
    )
  : getIdentityMap(
      topTrait?.label,
      secondTrait?.label
    )

  const unlockedTiers = new Set(
    (unlocks || []).map((unlock) => unlock.unlock_tier)
  )

  const hasPatternUnlock = unlockedTiers.has('pattern')
  const hasFullUnlock = unlockedTiers.has('full')

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
          {hasFullUnlock ? (
            <div className="rounded-3xl border border-lime-400/25 bg-white/5 px-6 py-6">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-lime-400/70">
                Complete perception
              </p>

              <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.06em] text-white">
                Identity Map
              </h1>

              <p className="mt-4 text-sm leading-6 text-white/55">
                Everything your friends consistently reveal about how they
                experience you.
              </p>

              <div className="mt-8 space-y-4">
                {identityMap.map((item, index) => (
                  <div
                    key={item.title}
                    className="rounded-3xl bg-white/5 px-5 py-5"
                  >
                    <p className="font-mono text-xs text-lime-400">
                      0{index + 1}
                    </p>

                    <h2 className="mt-3 text-base font-semibold leading-6 text-white">
                      {item.title}
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-white/55">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className={hasFullUnlock ? 'mt-8' : ''}>
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
                        way. A few more responses will reveal which perception
                        becomes your dominant social identity.
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

                  {hasTie ? (
                    <p className="mt-2 font-mono text-sm leading-6 text-white/60">
                      {topTrait?.count || 0} friends matched one perception and{' '}
                      {secondTrait?.count || 0} matched another. The result is
                      currently too close to identify a dominant social pattern.
                    </p>
                  ) : (
                    <p className="mt-2 font-mono text-sm leading-6 text-white/60">
                      {topTrait?.count || 0} of {totalPicks} friends formed this
                      pattern.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="font-mono text-sm uppercase tracking-[0.24em] text-white/50">
                  3 friends responded
                </p>

                {hasTie ? (
                  <>
                    <p className="mt-4 text-5xl font-light leading-[0.95] tracking-[-0.08em] text-lime-400">
                      People see two different sides of you.
                    </p>

                    <p className="mt-6 font-mono text-base leading-7 text-white/55">
                      Your friends are almost evenly split between two different
                      perceptions. A few more responses will reveal which one
                      becomes your dominant social identity.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-5xl font-light leading-[0.95] tracking-[-0.08em] text-lime-400">
                      They formed one clear pattern about you.
                    </p>

                    <p className="mt-6 font-mono text-base leading-7 text-white/55">
                      Your result is ready, but the main signal is hidden.
                    </p>
                  </>
                )}
              </>
            )}
          </div>

          {!hasFullUnlock ? (
            <div className="mt-8 rounded-3xl border border-white/15 px-6 py-5">
              {hasPatternUnlock ? (
                <div>
                  <p className="font-mono text-sm uppercase tracking-[0.22em] text-white/45">
                    Different version detected
                  </p>

                  <div className="mt-5 h-5 rounded-full bg-white/10 blur-sm" />

                  <p className="mt-4 font-mono text-xs leading-5 text-white/35">
                    Some friends saw a completely different version of you.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-mono text-sm uppercase tracking-[0.22em] text-white/45">
                    Main signal locked
                  </p>

                  <div className="mt-5 h-5 rounded-full bg-white/10 blur-sm" />
                  <div className="mt-3 h-5 w-3/4 rounded-full bg-white/10 blur-sm" />

                  <p className="mt-4 font-mono text-xs leading-5 text-white/35">
                    Unlock to see the social pattern your friends created.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-auto">
          <ResultCtaButton
            slug={slug}
            hasPatternUnlock={hasPatternUnlock}
            hasFullUnlock={hasFullUnlock}
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