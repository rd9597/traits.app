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
    <main className="min-h-screen bg-background px-5 pb-24 pt-6 text-foreground">
      <section className="mx-auto w-full max-w-md">
        <header className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />

            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-accent">
              Reveal unlocked
            </p>
          </div>

          <h1 className="font-identity mt-3 text-[28px] leading-tight tracking-[-0.035em]">
            Your Mirror opened.
          </h1>

          <p className="mt-1 text-[10px] text-foreground-muted">
            Based on {totalTraits} anonymous trait
            {totalTraits !== 1 ? 's' : ''}.
          </p>
        </header>

        {topTrait ? (
          <>
            <section className="relative mt-5 flex flex-col items-center text-center">
              <div className="pointer-events-none absolute top-8 h-48 w-48 rounded-full bg-accent/10 blur-[60px]" />

              <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-accent/20 bg-surface shadow-[0_0_50px_rgba(255,90,95,0.08)]">
                <div className="absolute inset-3 rounded-full border border-white/[0.05]" />
                <div className="absolute inset-7 rounded-full border border-white/[0.04]" />

                <div className="relative px-5">
                  <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-accent">
                    Most repeated
                  </p>

                  <h2 className="font-identity mt-3 text-[28px] leading-[1.02] tracking-[-0.04em]">
                    {topTrait.label}
                  </h2>

                  <p className="mt-3 text-[9px] font-semibold text-foreground-secondary">
                    {topTrait.count} friend
                    {topTrait.count !== 1 ? 's' : ''} chose this
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-[330px] text-[17px] font-semibold leading-6 tracking-[-0.02em]">
                {socialPattern.title}
              </p>

              <p className="mt-2 max-w-[340px] text-[11px] leading-5 text-foreground-secondary">
                {socialPattern.body}
              </p>
            </section>

            {secondaryTraits.length > 0 ? (
              <section className="mt-5">
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />

                  <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-foreground-muted">
                    They noticed this too
                  </p>

                  <span className="h-px flex-1 bg-border" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  {secondaryTraits.map((trait, index) => (
                    <div
                      key={trait.id}
                      className="rounded-card border border-border bg-surface px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[9px] font-bold text-foreground-muted">
                          0{index + 2}
                        </p>

                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />

                          <span className="text-[9px] font-bold text-foreground-secondary">
                            {trait.count}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-[12px] font-semibold leading-4 text-foreground">
                        {trait.label}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-5 text-center">
              <p className="font-identity text-[18px] leading-6">
                You did not choose these words.
              </p>

              <p className="mt-1 text-[10px] leading-4 text-foreground-muted">
                This was the impression people naturally formed about you.
              </p>
            </section>
          </>
        ) : (
          <section className="mt-6 rounded-card border border-border bg-surface px-5 py-7 text-center">
            <p className="font-identity text-[22px]">
              Your mirror is still forming.
            </p>

            <p className="mx-auto mt-2 max-w-[280px] text-[10px] leading-5 text-foreground-muted">
              More responses are needed before your strongest traits can be
              revealed.
            </p>
          </section>
        )}
<section className="relative mt-6 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#141417] px-5 py-5">
  <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent/12 blur-[80px]" />
  <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-accent/5 blur-[70px]" />

  <div className="relative">
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-accent">
          Hidden layer
        </p>

        <h3 className="font-identity mt-3 max-w-[250px] text-[25px] leading-[1.05] tracking-[-0.035em] text-foreground">
          There’s more they didn’t say first.
        </h3>
      </div>

    <p className="mt-4 max-w-[330px] text-[11px] leading-5 text-foreground-secondary">
      Unlock the quieter traits, rare impressions and the full ranking hidden
      inside your responses.
    </p>

    <div className="mt-5 grid grid-cols-3 gap-2">
      {[
        ['04', 'Hidden'],
        ['05', 'Rare'],
        ['06', 'Unexpected'],
      ].map(([rank, label]) => (
        <div
          key={rank}
          className="relative overflow-hidden rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-3 py-3"
        >
          <div className="pointer-events-none absolute -right-5 -top-5 h-14 w-14 rounded-full bg-accent/8 blur-2xl" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-[8px] font-bold text-foreground-muted">
                {rank}
              </p>

              <span className="text-[9px] text-foreground-muted">⌁</span>
            </div>

            <p className="mt-4 text-[10px] font-semibold text-foreground-secondary">
              {label}
            </p>

            <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.07] blur-[1px]" />
          </div>
        </div>
      ))}
    </div>

    <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-4">
      <div>
        <p className="text-[10px] font-semibold text-foreground">
          Complete your mirror
        </p>

        <p className="mt-1 text-[9px] text-foreground-muted">
          Hidden traits · Rare signals · Full ranking
        </p>
      </div>

      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-accent">
        Instant access
      </p>
    </div>

    <a
      href={`/result/${slug}`}
      className="mt-4 flex w-full items-center justify-between rounded-[15px] bg-accent px-4 py-3.5 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
    >
      <span>Unlock hidden traits</span>
      <span>₹19 →</span>
    </a>
  </div>
</section>

        <div className="mt-3">
          <ShareResultButton
            slug={slug}
            appUrl={appUrl}
            topTraitLabel={topTrait?.label}
          />
        </div>
      </section>
    </main>
  )
}