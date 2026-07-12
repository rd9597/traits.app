'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Trait = {
  id: string
  label: string
}

type Props = {
  mirrorId: string
  traits: Trait[]
}

function getVoterKey() {
  const storageKey = 'traits_voter_key'
  const existingKey = localStorage.getItem(storageKey)

  if (existingKey) {
    return existingKey
  }

  const newKey = crypto.randomUUID()
  localStorage.setItem(storageKey, newKey)

  return newKey
}

export default function VoteButtons({ mirrorId, traits }: Props) {
  const router = useRouter()

  const [selectedTraitId, setSelectedTraitId] = useState<string | null>(null)
  const [loadingTraitId, setLoadingTraitId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  async function submitVote(traitId: string) {
    if (loadingTraitId || selectedTraitId) return

    setLoadingTraitId(traitId)
    setMessage('')

    const res = await fetch('/api/votes/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mirrorId,
        traitId,
        voterKey: getVoterKey(),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage(data.error || 'Trait submit failed. Try again.')
      setLoadingTraitId(null)
      return
    }

    setSelectedTraitId(traitId)
    setMessage('Trait submitted anonymously.')
    setLoadingTraitId(null)
    router.refresh()
  }
return (
  <div className="mt-7 sm:mt-10">
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
        One honest choice
      </p>

      <h2 className="font-identity mt-3 text-3xl leading-tight text-foreground">
        Which one feels
        <br />
        most like them?
      </h2>

      <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-foreground-secondary">
        Pick instinctively. They will see the trait, but never who chose it.
      </p>
    </div>

    <div className="mt-6 space-y-2 sm:mt-8">
      {traits.map((trait) => {
        const isSelected = selectedTraitId === trait.id
        const isLoading = loadingTraitId === trait.id

        return (
          <button
            key={trait.id}
            type="button"
            onClick={() => submitVote(trait.id)}
            disabled={Boolean(loadingTraitId || selectedTraitId)}
            className={`group relative flex w-full items-center justify-between overflow-hidden rounded-[18px] border px-4 py-4 sm:px-5 sm:py-5 text-left transition-all duration-200 active:scale-[0.985] disabled:cursor-not-allowed ${
              isSelected
                ? 'border-accent bg-accent text-accent-foreground shadow-[0_14px_50px_rgba(255,90,95,0.2)]'
                : 'border-transparent bg-surface/70 text-foreground hover:border-accent/40 hover:bg-surface'
            }`}
          >
            <span className="font-identity text-lg leading-snug sm:text-xl">
              {isLoading ? 'Locking your answer…' : trait.label}
            </span>

            <span
              className={`ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                isSelected
                  ? 'border-accent-foreground/25 bg-accent-foreground/10 text-accent-foreground'
                  : 'border-border text-foreground-muted group-hover:border-accent group-hover:text-accent'
              }`}
            >
              {isSelected ? '✓' : '→'}
            </span>

            {!isSelected ? (
              <span className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-accent opacity-0 transition-opacity group-hover:opacity-100" />
            ) : null}
          </button>
        )
      })}
    </div>

    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-foreground-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      <span>Anonymous</span>
      <span>•</span>
      <span>One response only</span>
      <span>•</span>
      <span>No undo</span>
    </div>

    {message ? (
      <div
        className={`mt-8 rounded-[20px] border p-6 ${
          selectedTraitId
            ? 'border-accent/30 bg-accent/10'
            : 'border-error/30 bg-error/10'
        }`}
      >
        <p
          className={`text-center text-sm font-semibold ${
            selectedTraitId ? 'text-accent' : 'text-error'
          }`}
        >
          {message}
        </p>

        {selectedTraitId ? (
          <>
            <h3 className="font-identity mt-5 text-center text-3xl leading-tight text-foreground">
              Now find out what
              <br />
              your friends see in you.
            </h3>

            <p className="mx-auto mt-4 max-w-xs text-center text-sm leading-6 text-foreground-secondary">
              Create your own mirror and collect anonymous answers from the
              people who know you best.
            </p>

            <Link
              href="/create"
              className="mt-7 flex h-14 w-full items-center justify-center rounded-[14px] bg-accent text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
            >
              Create My Mirror
            </Link>
          </>
        ) : null}
      </div>
    ) : null}
  </div>
)
}