'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function HomePage() {
  const [spot, setSpot] = useState({ x: -999, y: -999 })
  const [peeked, setPeeked] = useState(false)

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()

    setSpot({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })

    setPeeked(true)
  }

  function handlePointerLeave() {
    setSpot({ x: -999, y: -999 })
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none fixed left-1/2 top-[-20%] z-0 h-225 w-225 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(163,255,0,.14),transparent_65%)]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6">
  <div className="flex items-center gap-2">
    <div className="h-2.5 w-2.5 rounded-full bg-accent" />
    <span className="text-sm font-semibold tracking-wide text-foreground">
      Identity Mirror
    </span>
  </div>

  <Link
    href="/create"
    className="rounded-[14px] border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground-secondary transition hover:border-accent hover:text-foreground"
  >
    Create
  </Link>
</header>

<section className="relative z-10 px-6 pb-16 pt-8 text-center">
  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground-secondary">
    Anonymous • Honest • Social Identity
  </p>

  <h1 className="font-identity mx-auto mt-6 max-w-xl text-[2.15rem] leading-[1.05] tracking-tight text-foreground sm:text-6xl">
    How do your friends
    <br />
    actually see you?
  </h1>

  <p className="mx-auto mt-6 max-w-md text-[15px] leading-7 text-foreground-secondary">
    Create your own mirror, share one link, and discover how people really
    perceive you through completely anonymous responses.
  </p>

  <Link
    href="/create"
    className="mt-10 inline-flex h-14 items-center justify-center rounded-[14px] bg-accent px-8 text-base font-semibold text-accent-foreground transition hover:opacity-95"
  >
    Create my mirror
  </Link>

  <p className="mt-4 text-sm text-foreground-muted">
    Takes less than a minute
  </p>

  <div className="mt-14">
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative mx-auto aspect-square w-[min(72vw,280px)] cursor-none overflow-hidden rounded-full border border-border bg-[linear-gradient(160deg,#23252D_0%,#181A20_55%,#101115_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:w-[320px]"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-10 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-foreground-secondary">
          Identity Mirror
        </span>

        <p className="font-identity text-2xl leading-tight text-foreground">
          Quiet
          <br />
          Mystery
        </p>

        <span className="text-sm text-foreground-secondary">
          Hidden until friends respond
        </span>
      </div>

      <div
        className="absolute inset-0 bg-[linear-gradient(160deg,#23252D_0%,#181A20_55%,#101115_100%)]"
        style={{
  background: `
    radial-gradient(
      circle at ${spot.x}px ${spot.y}px,
      rgba(255,90,95,0.18) 0%,
      rgba(255,90,95,0.08) 70px,
      transparent 140px
    ),
    linear-gradient(160deg,#23252D 0%,#181A20 55%,#101115 100%)
  `,
  WebkitMaskImage: `radial-gradient(65px at ${spot.x}px ${spot.y}px, transparent 0, transparent 36px, black 62px)`,
  maskImage: `radial-gradient(65px at ${spot.x}px ${spot.y}px, transparent 0, transparent 36px, black 62px)`,
}}
      />

      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.18em] text-foreground-secondary transition-opacity ${
          peeked ? 'opacity-0' : 'opacity-100'
        }`}
      >
        Hover to reveal
      </div>
    </div>
    <div className="mt-6 flex items-center justify-center gap-3 text-sm text-foreground-secondary">
      <span>1 of 3 responses received</span>

      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-accent" />
        <span className="h-2 w-2 rounded-full bg-border" />
        <span className="h-2 w-2 rounded-full bg-border" />
      </div>
    </div>
  </div>
</section>

      <section className="relative z-10 px-6 py-20">
  <div className="mx-auto max-w-xl text-center">
    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--foreground-secondary)]">
      How it works
    </p>

    <h2 className="font-identity mt-5 text-4xl leading-tight text-[var(--foreground)]">
      Three simple steps.
      <br />
      One honest identity.
    </h2>

    <p className="mt-5 text-[15px] leading-7 text-[var(--foreground-secondary)]">
      No usernames. No comments. Just anonymous traits chosen by the people
      who know you best.
    </p>
  </div>

  <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-7">
      <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-foreground)]">
        1
      </div>

      <h3 className="text-lg font-semibold text-[var(--foreground)]">
        Create your mirror
      </h3>

      <p className="mt-3 text-sm leading-7 text-[var(--foreground-secondary)]">
        Choose what you want people to describe and generate your personal
        mirror in seconds.
      </p>
    </div>

    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-7">
      <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-foreground)]">
        2
      </div>

      <h3 className="text-lg font-semibold text-[var(--foreground)]">
        Share with friends
      </h3>

      <p className="mt-3 text-sm leading-7 text-[var(--foreground-secondary)]">
        Send one link through WhatsApp, Instagram or anywhere your friends are.
        Every response stays anonymous.
      </p>
    </div>

    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-7">
      <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-foreground)]">
        3
      </div>

      <h3 className="text-lg font-semibold text-[var(--foreground)]">
        Reveal your identity
      </h3>

      <p className="mt-3 text-sm leading-7 text-[var(--foreground-secondary)]">
        Once enough people respond, your identity unlocks with insights,
        patterns and your complete social report.
      </p>
    </div>
  </div>
</section>
      <section className="relative z-10 px-6 py-20">
  <div className="mx-auto max-w-xl text-center">
    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground-secondary">
      Privacy first
    </p>

    <h2 className="font-identity mt-5 text-4xl leading-tight text-foreground">
      Honest answers.
      <br />
      Completely anonymous.
    </h2>

    <p className="mt-5 text-[15px] leading-7 text-foreground-secondary">
      Nobody can see who picked which trait. Your friends stay anonymous,
      while you discover the patterns that define how people truly see you.
    </p>
  </div>

  <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
    <div className="rounded-[16px] border border-border bg-surface p-7">
      <p className="text-2xl">🔒</p>

      <h3 className="mt-5 text-lg font-semibold text-foreground">
        Anonymous
      </h3>

      <p className="mt-3 text-sm leading-7 text-foreground-secondary">
        Nobody knows who selected which trait.
      </p>
    </div>

    <div className="rounded-[16px] border border-border bg-surface p-7">
      <p className="text-2xl">👥</p>

      <h3 className="mt-5 text-lg font-semibold text-foreground">
        Minimum 3 responses
      </h3>

      <p className="mt-3 text-sm leading-7 text-foreground-secondary">
        Your mirror unlocks only after enough people respond.
      </p>
    </div>

    <div className="rounded-[16px] border border-border bg-surface p-7">
      <p className="text-2xl">🗑️</p>

      <h3 className="mt-5 text-lg font-semibold text-foreground">
        Your mirror. Your control.
      </h3>

      <p className="mt-3 text-sm leading-7 text-foreground-secondary">
        Delete your mirror anytime and remove every response.
      </p>
    </div>
  </div>
</section>

<section className="relative z-10 px-6 py-24 text-center">
  <h2 className="font-identity mx-auto max-w-2xl text-4xl leading-tight text-foreground">
    Ready to discover
    <br />
    what people never tell you?
  </h2>

  <p className="mx-auto mt-6 max-w-md text-[15px] leading-7 text-foreground-secondary">
    Your identity is already there.
    Your friends just need one link to reveal it.
  </p>

  <Link
    href="/create"
    className="mt-10 inline-flex h-14 items-center justify-center rounded-[14px] bg-accent px-8 text-base font-semibold text-accent-foreground transition hover:bg-accent-hover"
  >
    Create my mirror
  </Link>
</section>

<footer className="relative z-10 border-t border-border px-6 py-8 text-center">
  <p className="font-semibold text-foreground">
    Identity Mirror
  </p>

  <p className="mt-2 text-sm text-foreground-secondary">
    Made for honest friendships.
  </p>
</footer>
    </main>
  )
}