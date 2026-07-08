import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const UNLOCK_THRESHOLD = 3

type Mirror = {
  id: string
  slug: string
  question: string
  expires_at: string | null
  created_at: string
}

type Vote = {
  id: string
  mirror_id: string
  trait_id: string
  created_at: string
}

type Trait = {
  id: string
  label: string
}

function getTimeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

export default async function ActivityPage() {
  const cookieStore = await cookies()
  const creatorKey = cookieStore.get('traits_creator_key')?.value || ''

  if (!creatorKey) {
    return (
      <main className="min-h-screen bg-black px-5 py-8 text-white">
        <section className="mx-auto w-full max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-400">
            Activity
          </p>

          <h1 className="mt-5 text-3xl font-black leading-tight">
            No activity yet
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/50">
            Create a mirror first. New traits will appear here.
          </p>

          <Link
            href="/create"
            className="mt-6 block rounded-2xl bg-lime-400 px-5 py-4 text-center text-sm font-black text-black"
          >
            Create Mirror
          </Link>
        </section>
      </main>
    )
  }

  const supabase = await createClient()

  const { data: mirrors } = await supabase
    .from('mirrors')
    .select('id, slug, question, expires_at, created_at')
    .eq('creator_key', creatorKey)
    .eq('is_removed', false)
    .order('created_at', { ascending: false })

  const activeMirrors = ((mirrors || []) as Mirror[]).filter((mirror) => {
    if (!mirror.expires_at) return false
    return new Date(mirror.expires_at).getTime() > Date.now()
  })

  const mirrorIds = activeMirrors.map((mirror) => mirror.id)

  const { data: votes } =
    mirrorIds.length > 0
      ? await supabase
          .from('votes')
          .select('id, mirror_id, trait_id, created_at')
          .in('mirror_id', mirrorIds)
          .order('created_at', { ascending: false })
      : { data: [] }

  const voteList = (votes || []) as Vote[]
  const traitIds = [...new Set(voteList.map((vote) => vote.trait_id))]

  const { data: traits } =
    traitIds.length > 0
      ? await supabase
          .from('mirror_traits')
          .select('id, label')
          .in('id', traitIds)
      : { data: [] }

  const traitMap = new Map(
    ((traits || []) as Trait[]).map((trait) => [trait.id, trait.label]),
  )

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-400">
          Activity
        </p>

        <h1 className="mt-5 text-3xl font-black leading-tight">
          Your mirror activity
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/50">
          Traits received across all your active mirrors.
        </p>

        {voteList.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-bold text-white">No traits yet.</p>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Share your mirror. When friends respond, activity will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 divide-y divide-white/10">
            {voteList.map((vote) => {
              const mirror = activeMirrors.find(
                (item) => item.id === vote.mirror_id,
              )

              if (!mirror) return null

              const mirrorVoteCount = voteList.filter(
                (item) => item.mirror_id === mirror.id,
              ).length

              const isReady = mirrorVoteCount >= UNLOCK_THRESHOLD
              const traitLabel = traitMap.get(vote.trait_id) || 'New trait'

              return (
                <Link
                  key={vote.id}
                  href={`/mirror/${mirror.slug}`}
                  className="flex items-center gap-4 py-5"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl">
                    🪞
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">
                      {traitLabel}
                    </p>

                    <p className="mt-1 truncate text-xs font-bold text-white/40">
                      {isReady
                        ? 'Ready to reveal'
                        : `${mirrorVoteCount}/${UNLOCK_THRESHOLD} traits received`}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-white/35">
                      {getTimeAgo(vote.created_at)}
                    </p>

                    <p className="mt-2 text-xl font-black text-white/70">›</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}