import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShareActions from './share-actions'
import VoteButtons from './vote-buttons'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

type MirrorTrait = {
  id: string
  label: string
  sort_order: number
}

export default async function MirrorPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: mirror } = await supabase
    .from('mirrors')
    .select(`
      id,
      question,
      category,
      tone,
      language,
      creator_key,
      is_removed,
      expires_at,
      votes(count)
    `)
    .eq('slug', slug)
    .single()

  if (!mirror || mirror.is_removed) {
    notFound()
  }

  const cookieStore = await cookies()
  const creatorKey = cookieStore.get('traits_creator_key')?.value
  const isCreator = Boolean(creatorKey && creatorKey === mirror.creator_key)

  const traitCount = Array.isArray(mirror.votes)
    ? Number(mirror.votes[0]?.count || 0)
    : 0

  const unlockTarget = 3
  const unlocked = traitCount >= unlockTarget
  const remainingTraits = Math.max(unlockTarget - traitCount, 0)
  const progressPercent = Math.min((traitCount / unlockTarget) * 100, 100)

  const expiresAt = mirror.expires_at ? new Date(mirror.expires_at) : null
  const isExpired = expiresAt ? expiresAt.getTime() <= Date.now() : false
  const timeLeftMs = expiresAt
    ? Math.max(expiresAt.getTime() - Date.now(), 0)
    : 0
  const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60))
  const minutesLeft = Math.floor(
    (timeLeftMs % (1000 * 60 * 60)) / (1000 * 60),
  )
  const countdownText = isExpired
    ? 'Expired'
    : `${hoursLeft}h ${minutesLeft}m left`

  if (isCreator) {
    return (
      <main className="min-h-screen bg-black px-5 py-8 text-white">
        <section className="mx-auto flex min-h-[85vh] w-full max-w-md flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-400">
            Mirror created
          </p>

          <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight">
            Share this link with friends
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/50">
            You cannot see the trait options on your own mirror. Only friends who open your shared link can give traits.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/4 px-5 py-4 text-sm font-bold text-white">
            {mirror.question}
          </div>

          <div className="mt-4 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
              Time left
            </p>

            <p className="mt-2 text-xl font-black text-white">
              {countdownText}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                  Traits collected
                </p>

                <p className="mt-2 text-2xl font-black">
                  {Math.min(traitCount, unlockTarget)} / {unlockTarget}
                </p>
              </div>

              <p className="text-right text-xs font-bold text-lime-400">
                {unlocked ? 'Unlocked' : `${remainingTraits} more needed`}
              </p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-lime-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="mt-4 text-sm leading-6 text-white/50">
              {unlocked
                ? 'Your mirror result is ready to reveal.'
                : 'Share your mirror to collect more anonymous traits.'}
            </p>

            {unlocked && !isExpired ? (
              <a
                href={`/reveal/${slug}`}
                className="mt-5 block w-full rounded-2xl bg-lime-400 px-5 py-4 text-center text-sm font-black text-black"
              >
                Reveal My Traits
              </a>
            ) : null}
          </div>

          <ShareActions
            slug={slug}
            question={mirror.question}
            traitCount={traitCount}
        />
        </section>
      </main>
    )
  }

  const { data: traits } = await supabase
    .from('mirror_traits')
    .select('id, label, sort_order')
    .eq('mirror_id', mirror.id)
    .order('sort_order', { ascending: true })

  const mirrorTraits = (traits || []) as MirrorTrait[]

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
      <section className="mx-auto w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">
          Traits
        </p>

        <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight">
          {mirror.question}
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/50">
          Pick the trait that fits this person best. Your trait stays anonymous.
        </p>

        <div className="mt-5 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
            Time left
          </p>

          <p className="mt-2 text-xl font-black text-white">
            {countdownText}
          </p>
        </div>

        {isExpired ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-lg font-black text-white">
              This mirror has expired.
            </p>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Create your own mirror and ask friends to assign traits before it expires.
            </p>

            <a
              href="/create"
              className="mt-5 block rounded-2xl bg-lime-400 px-5 py-4 text-center text-sm font-black text-black"
            >
              Create Mirror
            </a>
          </div>
        ) : (
          <VoteButtons
            mirrorId={mirror.id}
            traits={mirrorTraits.map((trait) => ({
              id: trait.id,
              label: trait.label,
            }))}
          />
        )}
      </section>
    </main>
  )
}