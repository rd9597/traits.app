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
    <div className="mt-8 space-y-3">
      {traits.map((trait) => {
        const isSelected = selectedTraitId === trait.id
        const isLoading = loadingTraitId === trait.id

        return (
          <button
            key={trait.id}
            type="button"
            onClick={() => submitVote(trait.id)}
            disabled={Boolean(loadingTraitId || selectedTraitId)}
            className={`w-full rounded-2xl border px-5 py-4 text-left text-base font-bold transition active:scale-[0.99] disabled:cursor-not-allowed ${
              isSelected
                ? 'border-white bg-white text-black'
                : 'border-white/10 bg-white/4 text-white'
            }`}
          >
            {isLoading ? 'Saving trait...' : trait.label}
          </button>
        )
      })}

      {message ? (
        <div className="mt-5 rounded-3xl border border-lime-400/20 bg-lime-400/10 p-5">
          <p className="text-sm font-black text-lime-400">
            {message}
          </p>

          {selectedTraitId ? (
            <>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Want to know how your friends see you?
              </p>

              <Link
                href="/create"
                className="mt-5 block rounded-2xl bg-lime-400 px-5 py-4 text-center text-sm font-black text-black"
              >
                Create Your Mirror
              </Link>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}