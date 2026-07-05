'use client'

type Props = {
  slug: string
  appUrl: string
  topTraitLabel: string | undefined
}

export default function ShareResultButton({
  slug,
  appUrl,
  topTraitLabel,
}: Props) {
  const shareText = `My friends see me as:\n\n${topTraitLabel || 'Hidden trait'}\n\nWhat's your trait?\n\n${appUrl}/result/${slug}`

  async function trackShare() {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'result_shared',
          mirrorSlug: slug,
          metadata: {
            channel: 'whatsapp',
          },
        }),
      })
    } catch {}
  }

  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
      target="_blank"
      rel="noreferrer"
      onClick={trackShare}
      className="mt-5 block w-full rounded-2xl bg-lime-400 px-5 py-4 text-center text-sm font-black text-black"
    >
      Share My Result
    </a>
  )
}