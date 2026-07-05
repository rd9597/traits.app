'use client'

import Link from 'next/link'
import { useState } from 'react'

const reveals = [
  'someone just found out they are the "main character energy" of the friend group',
  'someone just discovered they are everyone emergency contact bestie',
  'a guy just got called "loud in a good way" by 3 anonymous friends',
  'someone mirror cleared and it said "lowkey the glue of the group"',
  'someone found out they give "main lead in a coming-of-age movie" vibes',
  'someone just got told they are the one who would survive a horror movie',
]

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

      <header className="relative z-10 flex items-center justify-between px-6 py-7">
        <div className="flex items-center gap-2 text-lg font-black tracking-tight">
          <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />
          MIRROR
        </div>

        <Link
          href="/create"
          className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/50"
        >
          create yours
        </Link>
      </header>

      <section className="relative z-10 flex flex-col items-center px-6 pb-16 pt-4 text-center">
        <p className="mb-6 text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
          private · anonymous · unlocks only at 3
        </p>

        <h1 className="max-w-4xl text-[2.4rem] font-black leading-[1.02] tracking-tight sm:text-6xl">
          Your friends already talk about you.{' '}
          <span className="text-lime-400">Now you get to listen.</span>
        </h1>

        <p className="mt-5 max-w-sm text-sm leading-7 text-white/50 sm:max-w-xl sm:text-base">
          Send one link. They answer honestly — fully anonymous, zero names
          attached. Once enough people respond, the mirror clears and you see
          everything. No cap.
        </p>

        <div className="mt-14 flex flex-col items-center gap-5">
          <div
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className="relative aspect-square w-[min(72vw,280px)] cursor-none overflow-hidden rounded-full border-2 border-lime-400 bg-[linear-gradient(160deg,#241f3a,#0d0c17)] shadow-[0_0_40px_rgba(163,255,0,.08)] sm:w-[320px]"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-14 text-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-lime-400">
                Your mirror
              </span>

              <p className="font-mono text-sm leading-6 text-white">
                "honestly? the funniest
                <br />
                one in the group"
              </p>

              <span className="font-mono text-[11px] text-white/45">
                — anonymous
              </span>
            </div>

            <div
              className="absolute inset-0 bg-[linear-gradient(160deg,#263014,#11160A)]"
              style={{
              WebkitMaskImage: `radial-gradient(65px at ${spot.x}px ${spot.y}px, transparent 0, transparent 36px, black 62px)`,
              maskImage: `radial-gradient(65px at ${spot.x}px ${spot.y}px, transparent 0, transparent 36px, black 62px)`,
          }}
        />

            <div
              className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-10 text-center font-mono text-xs tracking-wide text-white/55 transition-opacity ${
                peeked ? 'opacity-0' : 'opacity-100'
              }`}
            >
              hover to peek →
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-white/40">
            <span>1 / 3 friends have answered</span>
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
            </span>
          </div>
        </div>

        <Link
          href="/create"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-lime-400 px-8 py-4 text-base font-black text-black transition hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(163,255,0,.35)]"
        >
          start your mirror →
        </Link>

        <p className="mt-4 font-mono text-xs text-white/40">
          takes 40 seconds · no signup drama
        </p>
      </section>

      <section className="relative z-10 px-6 py-16">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-lime-400">
            how it actually works
          </p>

          <h2 className="text-3xl font-black tracking-tight">
            Three steps. Zero awkwardness.
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3">
          <div className="bg-black p-8">
            <span className="font-mono text-xs text-lime-400">01</span>
            <h3 className="mt-5 text-xl font-black">Make your mirror</h3>
            <p className="mt-3 text-sm leading-6 text-white/45">
              Pick what you want feedback on — your vibe, your rizz, your red
              flags. We turn it into one shareable link.
            </p>
          </div>

          <div className="bg-black p-8">
            <span className="font-mono text-xs text-lime-400">02</span>
            <h3 className="mt-5 text-xl font-black">Drop it anywhere</h3>
            <p className="mt-3 text-sm leading-6 text-white/45">
              Insta bio, WhatsApp group, close friends story — wherever your
              people actually are. They tap, answer, gone.
            </p>
          </div>

          <div className="bg-black p-8">
            <span className="font-mono text-xs text-lime-400">03</span>
            <h3 className="mt-5 text-xl font-black">It clears at 3</h3>
            <p className="mt-3 text-sm leading-6 text-white/45">
              Once 3 people reply, the fog lifts and you see every answer.
              Under 3, and it stays sealed forever.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden py-14">
        <p className="mb-8 text-center font-mono text-xs uppercase tracking-[0.18em] text-white/35">
          reveals happening right now
        </p>

        <div className="flex w-max animate-[scroll_32s_linear_infinite] gap-4">
          {[...reveals, ...reveals].map((reveal, index) => (
            <div
              key={`${reveal}-${index}`}
              className="whitespace-nowrap rounded-full border border-white/10 bg-white/4 px-6 py-3 text-sm font-semibold text-white/65"
            >
              {reveal}
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
          Not another "rate your friend" app that outs everyone.
        </h2>

        <p className="mt-5 text-base leading-7 text-white/50">
          We hold every answer back until 3 people have responded. With fewer
          than 3, one guess and the game is over. At 3+, nobody can
          reverse-engineer who said what.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 p-5 text-left">
            <span className="font-mono text-xs text-lime-400">NO NAMES</span>
            <p className="mt-3 text-sm font-semibold text-white/70">
              Answers are never linked to a profile, ever.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 p-5 text-left">
            <span className="font-mono text-xs text-lime-400">3 MINIMUM</span>
            <p className="mt-3 text-sm font-semibold text-white/70">
              Mirror stays fogged until the threshold hits.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 p-5 text-left">
            <span className="font-mono text-xs text-lime-400">
              YOU CONTROL IT
            </span>
            <p className="mt-3 text-sm font-semibold text-white/70">
              Delete your mirror and every answer disappears with it.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 text-center">
        <h2 className="mx-auto max-w-2xl text-4xl font-black leading-tight tracking-tight">
          Stop wondering what they’d say if you weren’t in the room.
        </h2>

        <p className="mt-5 text-white/50">Your mirror is waiting. So are they.</p>

        <Link
          href="/create"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-lime-400 px-8 py-4 text-base font-black text-black"
        >
          create your mirror →
        </Link>
      </section>

      <footer className="relative z-10 flex items-center justify-between border-t border-white/10 px-6 py-7 font-mono text-xs text-white/35">
        <span>mirror</span>
        <span>made for people who need to know</span>
      </footer>

      <style>{`
        @keyframes scroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </main>
  )
}