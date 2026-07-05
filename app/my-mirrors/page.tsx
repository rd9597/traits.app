import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const UNLOCK_THRESHOLD = 3

type Mirror = {
  id: string
  slug: string
  question: string
  created_at: string
  expires_at: string | null
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getTimeLeftText(value: string | null) {
  if (!value) return 'No expiry'

  const timeLeftMs = new Date(value).getTime() - Date.now()

  if (timeLeftMs <= 0) return 'Expired'

  const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60))
  const minutesLeft = Math.floor(
    (timeLeftMs % (1000 * 60 * 60)) / (1000 * 60),
  )

  return `${hoursLeft}h ${minutesLeft}m left`
}

export default async function MyMirrorsPage() {
  const cookieStore = await cookies()
  const creatorKey = cookieStore.get('traits_creator_key')?.value || ''

  if (!creatorKey) {
    return (
      <main className="min-h-screen bg-black px-5 py-8 text-white">
        <section className="mx-auto flex min-h-[85vh] w-full max-w-md flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-400">
            My Mirrors
          </p>

          <h1 className="mt-5 text-3xl font-black leading-tight">
            No mirrors found
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/50">
            Create a mirror first. Your mirrors will appear here on this device.
          </p>

          <Link
            href="/create"
            className="mt-6 rounded-2xl bg-lime-400 px-5 py-4 text-center text-sm font-black text-black"
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
    .select('id, slug, question, created_at, expires_at')
    .eq('creator_key', creatorKey)
    .eq('is_removed', false)
    .order('created_at', { ascending: false })

  const mirrorList = (mirrors || []) as Mirror[]
  const mirrorIds = mirrorList.map((mirror) => mirror.id)

  const { data: traits } =
    mirrorIds.length > 0
      ? await supabase
          .from('votes')
          .select('mirror_id')
          .in('mirror_id', mirrorIds)
      : { data: [] }

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-400">
          My Mirrors
        </p>

        <h1 className="mt-5 text-3xl font-black leading-tight">
          Your created mirrors
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/50">
          Share again, track progress, and reveal once 3 traits are assigned.
        </p>

        <Link
          href="/create"
          className="mt-6 block rounded-2xl bg-lime-400 px-5 py-4 text-center text-sm font-black text-black"
        >
          Create Another Mirror
        </Link>

        {mirrorList.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-bold text-white">
              No mirrors created yet.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {mirrorList.map((mirror) => {
              const traitCount =
                traits?.filter((trait) => trait.mirror_id === mirror.id)
                  .length || 0

              const isUnlocked = traitCount >= UNLOCK_THRESHOLD
              const isExpired = mirror.expires_at
                ? new Date(mirror.expires_at).getTime() <= Date.now()
                : false

              const progressText = isUnlocked
                ? 'Unlocked'
                : `${traitCount}/${UNLOCK_THRESHOLD} traits`

              const timeLeftText = getTimeLeftText(mirror.expires_at)

              return (
                <div
                  key={mirror.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">
                      {formatDate(mirror.created_at)}
                    </p>

                    <p
                      className={`text-xs font-black ${
                        isExpired ? 'text-red-400' : 'text-lime-400'
                      }`}
                    >
                      {timeLeftText}
                    </p>
                  </div>

                  <h2 className="mt-3 text-lg font-black leading-snug">
                    {mirror.question}
                  </h2>

                  <p
                    className={`mt-4 text-sm font-black ${
                      isUnlocked && !isExpired
                        ? 'text-lime-400'
                        : 'text-white/45'
                    }`}
                  >
                    {isExpired ? 'Expired' : progressText}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Link
                      href={`/mirror/${mirror.slug}`}
                      className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-black text-white"
                    >
                      Share
                    </Link>

                    {isUnlocked && !isExpired ? (
                      <Link
                        href={`/reveal/${mirror.slug}`}
                        className="rounded-2xl bg-lime-400 px-4 py-3 text-center text-sm font-black text-black"
                      >
                        Reveal
                      </Link>
                    ) : (
                      <div className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-black text-white/25">
                        {isExpired ? 'Expired' : 'Locked'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}