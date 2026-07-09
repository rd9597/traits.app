import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShareCardClient from './share-card-client'

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

export default async function ShareIdentityPage({ params }: PageProps) {
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
    (unlock) => unlock.unlock_tier === 'full',
  )

  if (!hasFullUnlock) {
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

  const totalVotes = votes?.length || 0

  const rankedTraits: TraitCount[] = (traits || [])
    .map((trait) => {
      const count =
        votes?.filter((vote) => vote.trait_id === trait.id).length || 0

      return {
        id: trait.id,
        label: trait.label,
        count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      }
    })
    .filter((trait) => trait.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  const topTrait = rankedTraits[0]
  const confidence = getScore((topTrait?.percentage || 50) + 25)
  const archetype = getArchetype(topTrait?.label)

  return (
    <ShareCardClient
      slug={slug}
      archetype={archetype}
      topTraitLabel={topTrait?.label || 'Rare Signal'}
      confidence={confidence}
      totalVotes={totalVotes}
      traits={rankedTraits.map((trait) => ({
        label: trait.label,
        percentage: trait.percentage,
      }))}
    />
  )
}