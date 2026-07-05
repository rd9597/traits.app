'use client'

import { useEffect, useMemo, useState } from 'react'

type Props = {
  slug: string
  question: string
  traitCount: number
}

export default function ShareActions({ slug, question, traitCount }: Props) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)

    const storageKey = `traits_mirror_count_${slug}`
    const previousCount = Number(localStorage.getItem(storageKey) || 0)

    if (traitCount > previousCount) {
      if (traitCount >= 3) {
        setNotice('Your reveal is ready.')
      } else if (traitCount - previousCount === 1) {
        setNotice('1 new trait arrived.')
      } else {
        setNotice(`${traitCount - previousCount} new traits arrived.`)
      }
    }

    localStorage.setItem(storageKey, String(traitCount))
  }, [slug, traitCount])

  const shareUrl = origin ? `${origin}/mirror/${slug}` : `/mirror/${slug}`

  const shareText = useMemo(() => {
    return `Give me one honest trait:\n\n${question}\n\n${shareUrl}`
  }, [question, shareUrl])

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)

    window.setTimeout(() => {
      setCopied(false)
    }, 1600)
  }

  return (
    <div className="mt-6 grid gap-3">
      {notice ? (
        <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 px-5 py-4">
          <p className="text-sm font-black text-lime-400">{notice}</p>
        </div>
      ) : null}

      <a
        href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-2xl bg-lime-400 px-5 py-4 text-center text-sm font-black text-black"
      >
        Share on WhatsApp
      </a>

      <button
        type="button"
        onClick={copyLink}
        className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white"
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  )
}