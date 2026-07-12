'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  slug: string
  question: string
  traitCount: number
}

export default function ShareActions({ slug, question, traitCount }: Props) {
  const router = useRouter()

  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      router.refresh()
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [router])

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

  async function shareMirror() {
  if (!navigator.share) {
    await copyLink()
    setNotice('Share link copied.')
    return
  }

  try {
    await navigator.share({
      title: 'Identity Mirror',
      text: `Give me one honest trait:\n\n${question}`,
      url: shareUrl,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    setNotice('Could not open sharing options.')
  }
}

  return (
  <div className="mt-6 space-y-3">
    {notice ? (
      <div className="rounded-[16px] border border-accent/25 bg-accent/10 px-5 py-4">
        <p className="text-sm font-semibold text-accent">{notice}</p>
      </div>
    ) : null}

    <div className="grid grid-cols-[1fr_auto] gap-3">
  <button
    type="button"
    onClick={shareMirror}
    className="flex h-14 items-center justify-center rounded-[16px] bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover active:scale-[0.99]"
  >
    Sent it. Let them guess.
  </button>

  <button
    type="button"
    onClick={copyLink}
    aria-label={copied ? 'Link copied' : 'Copy link'}
    className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-border bg-surface text-xl text-foreground transition hover:border-accent hover:bg-surface-muted active:scale-[0.98]"
  >
    {copied ? '✓' : '⧉'}
  </button>
</div>

   <p className="mt-3 text-center text-xs text-foreground-muted">
     {copied ? 'Link copied' : 'Share anywhere or copy the link'}
   </p>
    </div>
  )
}