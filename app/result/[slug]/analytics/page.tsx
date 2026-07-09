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
  percentage: number
}

function getScore(value: number) {
  return Math.max(48, Math.min(97, value))
}

function getArchetype(label: string | undefined) {
  const normalized = String(label || '').toLowerCase()

  if (normalized.includes('soft')) return 'Gentle Gravity'
  if (normalized.includes('guarded')) return 'Quiet Mystery'
  if (normalized.includes('loyal')) return 'The Anchor'
  if (normalized.includes('leader')) return 'Silent Command'
  if (normalized.includes('funny')) return 'Social Spark'
  if (normalized.includes('calm')) return 'Calm Signal'
  if (normalized.includes('chaotic')) return 'Beautiful Chaos'

  return 'Rare Signal'
}

function getTier(confidence: number) {
  if (confidence >= 85) return 'diamond tier'
  if (confidence >= 70) return 'gold tier'
  return 'rising tier'
}

function getConsistency(topPercentage: number) {
  if (topPercentage >= 70) return 'High'
  if (topPercentage >= 45) return 'Medium'
  return 'Mixed'
}

function getFirstImpression(label: string | undefined) {
  const normalized = String(label || '').toLowerCase()

  if (normalized.includes('soft')) {
    return 'People may first read you as gentle, careful, and emotionally aware.'
  }

  if (normalized.includes('guarded')) {
    return 'People may first feel that you do not give full access immediately.'
  }

  if (normalized.includes('loyal')) {
    return 'People may first sense that you are steady, protective, and hard to replace.'
  }

  if (normalized.includes('leader')) {
    return 'People may first notice that your presence affects the room without you forcing it.'
  }

  if (normalized.includes('funny')) {
    return 'People may first remember your timing, reactions, and social energy.'
  }

  if (normalized.includes('calm')) {
    return 'People may first experience you as controlled, composed, and hard to shake.'
  }

  return 'People may first notice a specific energy around you before they can explain it.'
}

function getHiddenStrength(label: string | undefined) {
  const normalized = String(label || '').toLowerCase()

  if (normalized.includes('soft')) {
    return 'You make people feel emotionally safe without needing to perform for attention.'
  }

  if (normalized.includes('guarded')) {
    return 'Your selectiveness makes people feel that getting close to you actually means something.'
  }

  if (normalized.includes('loyal')) {
    return 'People trust your consistency because you do not switch energy easily.'
  }

  if (normalized.includes('leader')) {
    return 'You influence people even when you are not officially in charge.'
  }

  if (normalized.includes('funny')) {
    return 'You can change the mood of a group faster than you may realize.'
  }

  if (normalized.includes('calm')) {
    return 'Your calmness makes others feel more stable around you.'
  }

  return 'People see a rare quality in you that becomes clearer the longer they know you.'
}

function getBlindSpot(label: string | undefined) {
  const normalized = String(label || '').toLowerCase()

  if (normalized.includes('soft')) {
    return 'You may not realize how much people notice your emotional reactions.'
  }

  if (normalized.includes('guarded')) {
    return 'Some people may confuse your self-protection for distance.'
  }

  if (normalized.includes('loyal')) {
    return 'You may underestimate how strongly people attach to your consistency.'
  }

  if (normalized.includes('leader')) {
    return 'You may not notice how often people check your reaction before deciding.'
  }

  if (normalized.includes('funny')) {
    return 'People may expect you to lighten the room even when you are not in that mood.'
  }

  if (normalized.includes('calm')) {
    return 'People may assume you are fine because you do not show pressure loudly.'
  }

  return 'People may read more meaning into your behaviour than you expect.'
}

export default async function ResultAnalyticsPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: mirror } = await supabase
    .from('mirrors')
    .select('id, is_removed')
    .eq('slug', slug)
    .single()

  if (!mirror || mirror.is_removed) {
    notFound()
  }

  const { data: unlocks } = await supabase
    .from('mirror_unlocks')
    .select('unlock_tier')
    .eq('mirror_id', mirror.id)

  const hasFullUnlock = (unlocks || []).some(
    (unlock) => unlock.unlock_tier === 'full'
  )

  if (!hasFullUnlock) {
    notFound()
  }

  await supabase.from('analytics_events').insert({
    event_type: 'identity_report_opened',
    mirror_slug: slug,
    metadata: {},
  })

  const { data: traits } = await supabase
    .from('mirror_traits')
    .select('id, label')
    .eq('mirror_id', mirror.id)

  const { data: votes } = await supabase
    .from('votes')
    .select('trait_id, mirror_id')

  const currentVotes = (votes || []).filter(
    (vote) => vote.mirror_id === mirror.id
  )

  const totalVotes = currentVotes.length

  const rankedTraits: TraitCount[] = (traits || [])
    .map((trait) => {
      const count = currentVotes.filter(
        (vote) => vote.trait_id === trait.id
      ).length

      return {
        id: trait.id,
        label: trait.label,
        count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      }
    })
    .filter((trait) => trait.count > 0)
    .sort((a, b) => b.count - a.count)

  const topTrait = rankedTraits[0]
  const secondTrait = rankedTraits[1]
  const thirdTrait = rankedTraits[2]

  const mirrorVoteCounts = new Map<string, number>()

  for (const vote of votes || []) {
    mirrorVoteCounts.set(
      vote.mirror_id,
      (mirrorVoteCounts.get(vote.mirror_id) || 0) + 1
    )
  }

  const rankedMirrorIds = [...mirrorVoteCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([mirrorId]) => mirrorId)

  const rankIndex = rankedMirrorIds.indexOf(mirror.id)
  const indiaRank = rankIndex >= 0 ? rankIndex + 1 : rankedMirrorIds.length + 1
  const totalRanked = Math.max(rankedMirrorIds.length, 1)
  const topPercent = Math.max(1, Math.ceil((indiaRank / totalRanked) * 100))

  const confidence = getScore((topTrait?.percentage || 50) + 25)
  const archetype = getArchetype(topTrait?.label)
  const tier = getTier(confidence)
  const consistency = getConsistency(topTrait?.percentage || 0)
  const firstImpression = getFirstImpression(topTrait?.label)
  const hiddenStrength = getHiddenStrength(topTrait?.label)
  const blindSpot = getBlindSpot(topTrait?.label)

  return (
    <main className="min-h-screen bg-[#191918] px-5 py-6 text-white">
      <section className="mx-auto w-full max-w-md">
        <Link
          href={`/result/${slug}`}
          className="font-mono text-xs uppercase tracking-[0.24em] text-white/35"
        >
          ← Result
        </Link>

        <section className="mt-8 rounded-[2.5rem] border border-white/10 bg-[#0d0d0c] px-7 py-8 shadow-[0_0_80px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-medium tracking-tighter text-white/55">
              identity mirror
            </p>

            <p className="rounded-full bg-[#f7c96f] px-5 py-2 text-sm font-semibold text-black">
              {tier}
            </p>
          </div>

          <div className="mt-10 flex items-center gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-lime-400/45 bg-lime-400/15 text-4xl font-black text-lime-400">
              {archetype
                .split(' ')
                .map((word) => word[0])
                .join('')
                .slice(0, 2)}
            </div>

            <div>
              <h1 className="text-4xl font-black leading-none tracking-[-0.07em]">
                {archetype}
              </h1>
              <p className="mt-2 text-lg leading-6 text-white/45">
                judged {totalVotes} real responses
              </p>
            </div>
          </div>

          <div className="mt-10">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/35">
              Social Status
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-white/6 px-4 py-5">
                <p className="text-3xl font-black">#{indiaRank}</p>
                <p className="mt-1 text-sm leading-5 text-white/45">
                  Identity Rank
                </p>
              </div>

              <div className="rounded-3xl bg-white/6 px-4 py-5">
                <p className="text-3xl font-black">Top {topPercent}%</p>
                <p className="mt-1 text-sm leading-5 text-white/45">
                  Social Status
                </p>
              </div>

              <div className="rounded-3xl bg-white/6 px-4 py-5">
                <p className="text-3xl font-black">{confidence}%</p>
                <p className="mt-1 text-sm leading-5 text-white/45">
                  Signal Strength
                </p>
              </div>

              <div className="rounded-3xl bg-white/6 px-4 py-5">
                <p className="text-3xl font-black">{totalVotes}</p>
                <p className="mt-1 text-sm leading-5 text-white/45">
                  Real Responses
                </p>
              </div>
            </div>
          </div>

          <div className="mt-9 border-t border-white/10 pt-7">
            <p className="text-sm uppercase tracking-[0.24em] text-lime-400">
              Core Social Identity
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.06em]">
               people see you as {topTrait?.label || archetype}
            </h2>

            <p className="mt-4 text-base leading-7 text-white/50">
              Your strongest public signal is{' '}
              <span className="text-white">{topTrait?.label || 'rare'}</span>
              {secondTrait ? (
                <>
                  , supported by{' '}
                  <span className="text-white">{secondTrait.label}</span>
                </>
           ) : null}
           . This is the identity your friends repeatedly attached to you.
         </p>
       </div>

       <div className="mt-7 grid grid-cols-3 gap-3">
         {[topTrait, secondTrait, thirdTrait].map((trait, index) => (
         <div
            key={trait?.id || index}
            className="rounded-3xl border border-white/10 bg-black/25 px-4 py-4"
         >
           <p className="font-mono text-xs text-lime-400">
              0{index + 1}
           </p>

           <p className="mt-3 min-h-12 text-sm font-bold leading-4">
             {trait?.label || 'Unknown'}
           </p>

           <p className="mt-3 font-mono text-xs text-white/40">
             {trait?.percentage || 0}%
           </p>
         </div>
        ))}
      </div>

      <div className="mt-8 grid gap-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-5">
           <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/35">
             First Impression
           </p>
           <p className="mt-3 text-base font-bold leading-7 text-white/75">
             {firstImpression}
           </p>
         </div>

         <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-5">
           <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/35">
             Hidden Strength
           </p>
           <p className="mt-3 text-base font-bold leading-7 text-white/75">
             {hiddenStrength}
           </p>
         </div>

         <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-5">
           <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/35">
             Blind Spot
           </p>
           <p className="mt-3 text-base font-bold leading-7 text-white/75">
             {blindSpot}
           </p>
         </div>
       </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-lime-400/20 bg-lime-400/10 px-5 py-5">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-lime-400">
              Trust Score
            </p>
            <p className="mt-3 text-4xl font-black text-lime-400">
              {confidence}%
            </p>
            <p className="mt-2 text-sm leading-5 text-white/45">
              how strongly one identity signal repeated
            </p>
         </div>

         <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-5">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/35">
             Consistency
            </p>
            <p className="mt-3 text-4xl font-black text-white">
              {consistency}
            </p>
            <p className="mt-2 text-sm leading-5 text-white/45">
              based on how concentrated the votes were
           </p>
         </div>
      </div>

          <div className="mt-8 border-t border-white/10 pt-7">
            <div className="flex items-center gap-4">
              <span className="h-4 w-4 border border-[#f7c96f]" />
              <p className="text-xl font-semibold tracking-[-0.04em] text-white/75">
                rare identity signal unlocked
              </p>
            </div>

            <p className="mt-8 text-sm text-white/35">
              identitymirror.vercel.app
            </p>
          </div>
        </section>
      </section>
    </main>
  )
}