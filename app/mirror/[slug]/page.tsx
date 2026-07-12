import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShareActions from './share-actions'
import VoteButtons from './vote-buttons'
import ReportMirrorButton from './report-mirror-button'
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
    <main className="min-h-screen bg-background px-5 py-8 text-foreground">
      <section className="mx-auto w-full max-w-md pb-10">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />

            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground-secondary">
              Your mirror is live
            </p>
          </div>

          <h1 className="font-identity mt-6 text-4xl leading-tight">
            See what they
            <br />
            really think.
          </h1>

          <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-foreground-secondary">
            Share this mirror with friends. Every response stays anonymous.
          </p>
        </div>

        <div className="relative mx-auto mt-10 flex aspect-square w-[260px] items-center justify-center overflow-hidden rounded-full border border-border bg-[radial-gradient(circle_at_50%_35%,rgba(255,90,95,0.22),transparent_48%),linear-gradient(160deg,#24242B,#111115)] shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-5 rounded-full border border-white/5" />
          <div className="absolute inset-10 rounded-full border border-white/5" />

          <div className="relative z-10 text-center">
            <p className="font-identity text-6xl leading-none text-foreground">
              {traitCount}
            </p>

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-foreground-secondary">
              responses
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
            Your mirror asks
          </p>

          <p className="font-identity mx-auto mt-4 max-w-sm text-2xl leading-snug text-foreground">
            {mirror.question}
          </p>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground-secondary">
              Reveal progress
            </p>

            <p className="text-sm font-semibold text-accent">
              {unlocked ? 'Ready to reveal' : `${remainingTraits} more needed`}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {Array.from({ length: unlockTarget }).map((_, index) => (
              <span
                key={index}
                className={`h-3 rounded-full transition ${
                  index < traitCount ? 'bg-accent' : 'bg-surface-muted'
                }`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-foreground-secondary">
              {Math.min(traitCount, unlockTarget)} of {unlockTarget} responses
            </span>

            <span className="text-foreground-secondary">
              {countdownText}
            </span>
          </div>
        </div>

        {unlocked && !isExpired ? (
          <a
            href={`/reveal/${slug}`}
            className="mt-8 flex h-14 w-full items-center justify-center rounded-[14px] bg-accent text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
          >
            Reveal My Identity
          </a>
        ) : null}

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-sm font-medium text-foreground">
            Send it to the people who know you best.
          </p>

          <p className="mt-2 text-center text-sm leading-6 text-foreground-secondary">
            Free reveal unlocks at 3 responses.
          </p>

          <ShareActions
            slug={slug}
            question={mirror.question}
            traitCount={traitCount}
          />
        </div>

        {!isExpired ? (
          <p className="mt-6 text-center text-xs leading-5 text-foreground-muted">
            Deeper Social Pattern available after reveal from ₹19.
          </p>
        ) : null}
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
    <main className="min-h-screen bg-background px-4 pb-28 pt-5 text-foreground sm:px-5 sm:py-8">
      <section className="mx-auto w-full max-w-[420px]">
        <div className="text-center">
  <div className="flex items-center justify-center gap-2">
    <span className="h-2 w-2 rounded-full bg-accent" />

    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground-secondary">
      Anonymous Mirror
    </p>
  </div>

  <h1 className="font-identity mt-5 text-[2rem] leading-[1.08] text-foreground sm:mt-6 sm:text-4xl">
    How do you
    <br />
    really see them?
  </h1>

  <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-foreground-secondary sm:mt-5 sm:max-w-sm sm:leading-7">
    Pick the one trait that feels most true.
    Every answer stays completely anonymous.
  </p>

  <div className="relative mx-auto mt-6 flex h-28 w-28 items-center justify-center sm:mt-8 sm:h-36 sm:w-36">
  <span className="absolute inset-0 animate-ping rounded-full border-2 border-accent/50" />

  <span className="absolute inset-2 animate-pulse rounded-full bg-accent/10" />

  <div className="relative z-10 flex h-24 w-24 animate-[countdownBlink_1.2s_ease-in-out_infinite] items-center justify-center rounded-full border border-accent/50 bg-surface shadow-[0_0_45px_rgba(255,90,95,0.28)] sm:h-32 sm:w-32">
    <div className="text-center">
      <p className="text-xl font-bold leading-tight text-accent sm:text-3xl">
        {countdownText}
      </p>

      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-foreground-muted">
        Remaining
      </p>
    </div>
  </div>
</div>

  <div className="mt-7 rounded-[18px] border border-border bg-surface p-5 text-left sm:mt-10 sm:rounded-[20px] sm:p-6">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
      Mirror Question
    </p>

    <h2 className="font-identity mt-3 text-2xl leading-snug text-foreground sm:text-3xl">
      {mirror.question}
    </h2>
  </div>
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
          <>
            <VoteButtons
              mirrorId={mirror.id}
              traits={mirrorTraits.map((trait) => ({
                id: trait.id,
                label: trait.label,
            
            }))}
          />

          <ReportMirrorButton
            mirrorId={mirror.id}
            mirrorSlug={slug}
          />
       </>
        )}
      </section>
    </main>
  )
}