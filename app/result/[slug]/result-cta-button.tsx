'use client'

import Link from 'next/link'

type Props = {
  slug: string
}

export default function ResultCtaButton({ slug }: Props) {
  async function trackClick() {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'result_to_create',
          mirrorSlug: slug,
          metadata: {},
        }),
      })
    } catch {}
  }

  return (
    <Link
      href="/create"
      onClick={trackClick}
      className="block w-full rounded-full bg-lime-400 px-6 py-5 text-center text-lg font-medium text-black"
    >
      unlock your mirror
    </Link>
  )
}