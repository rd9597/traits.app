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
      className="block w-full rounded-[12px] border border-[#FF6673]/25 bg-[#FF6673]/10 px-5 py-3 text-center text-xs font-bold text-[#FF8590] transition-colors hover:bg-[#FF6673]/15"
    >
      Share My Result
    </a>
  )
}