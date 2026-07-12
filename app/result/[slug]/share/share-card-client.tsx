'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { toPng } from 'html-to-image'

type ShareTrait = {
  label: string
  percentage: number
}

type Props = {
  slug: string
  archetype: string
  topTraitLabel: string
  confidence: number
  totalVotes: number
  traits: ShareTrait[]
}

type ProcessingAction = 'download' | 'share' | null

function getCuriosityLine(label: string) {
  const normalized = label.toLowerCase()

  if (normalized.includes('guarded')) {
    return 'Apparently, people notice how carefully I let people in.'
  }

  if (normalized.includes('loyal')) {
    return 'Apparently, people notice who stays when things get real.'
  }

  if (normalized.includes('soft')) {
    return 'Apparently, people notice the side I do not show loudly.'
  }

  if (normalized.includes('leader')) {
    return 'Apparently, people notice the energy I bring into a room.'
  }

  if (normalized.includes('funny')) {
    return 'Apparently, people notice how fast I can shift the mood.'
  }

  if (normalized.includes('calm')) {
    return 'Apparently, people notice how I stay steady under pressure.'
  }

  return 'Apparently, people notice something about me I do not say out loud.'
}

function dataUrlToBlob(dataUrl: string) {
  const separatorIndex = dataUrl.indexOf(',')

  if (separatorIndex === -1) {
    throw new Error('Invalid image data')
  }

  const header = dataUrl.slice(0, separatorIndex)
  const encodedData = dataUrl.slice(separatorIndex + 1)

  const mimeType =
    header.match(/^data:([^;]+);base64$/)?.[1] || 'image/png'

  const binary = window.atob(encodedData)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], {
    type: mimeType,
  })
}

export default function ShareCardClient({
  slug,
  archetype,
  topTraitLabel,
  totalVotes,
  traits,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const imageBlobRef = useRef<Blob | null>(null)
  const isShareInFlightRef = useRef(false)

  const [isImageReady, setIsImageReady] = useState(false)
  const [processingAction, setProcessingAction] =
    useState<ProcessingAction>(null)

  const curiosityLine = getCuriosityLine(topTraitLabel)

  const secondaryTraits = traits
    .filter((trait) => trait.label !== topTraitLabel)
    .slice(0, 2)

  async function createImageBlob() {
    const card = cardRef.current

    if (!card) {
      throw new Error('Share card is unavailable')
    }

    const dataUrl = await toPng(card, {
      cacheBust: true,
      pixelRatio: 3,
      skipAutoScale: true,
    })

    return dataUrlToBlob(dataUrl)
  }

  useEffect(() => {
    let cancelled = false
    let frameId = 0

    imageBlobRef.current = null
    setIsImageReady(false)

    frameId = window.requestAnimationFrame(() => {
      void createImageBlob()
        .then((blob) => {
          if (cancelled) {
            return
          }

          imageBlobRef.current = blob
          setIsImageReady(true)
        })
        .catch((error) => {
          if (!cancelled) {
            console.error('Share image preparation failed:', error)
          }
        })
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frameId)
    }
  }, [archetype, topTraitLabel, totalVotes, traits])

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `identity-mirror-${slug}.png`
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }

  async function handleDownload() {
    if (processingAction !== null) {
      return
    }

    setProcessingAction('download')

    try {
      const blob =
        imageBlobRef.current || (await createImageBlob())

      imageBlobRef.current = blob
      setIsImageReady(true)

      downloadBlob(blob)
    } catch (error) {
      console.error('Image download failed:', error)
    } finally {
      setProcessingAction(null)
    }
  }

  async function handleShare() {
    if (processingAction !== null || isShareInFlightRef.current) {
      return
    }

    const blob = imageBlobRef.current

    if (!blob) {
      return
    }

    if (typeof navigator.share !== 'function') {
      console.error('Web Share API is not supported on this browser')
      return
    }

    const file = new File(
      [blob],
      `identity-mirror-${slug}.png`,
      {
        type: 'image/png',
      }
    )

    const isMobileDevice =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    isShareInFlightRef.current = true
    setProcessingAction('share')

    const timeoutPromise = new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error('share-timeout'))
      }, 8000)
    })

    try {
      if (
        isMobileDevice &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await Promise.race([
          navigator.share({
            title: 'My Identity Mirror',
            text: 'How my friends see me.',
            files: [file],
          }),
          timeoutPromise,
        ])
      } else {
        await Promise.race([
          navigator.share({
            title: 'My Identity Mirror',
            text: 'How my friends see me.',
            url: window.location.href,
          }),
          timeoutPromise,
        ])
      }
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        // user closed the share sheet, do nothing
      } else {
        console.error('Share failed or timed out:', error)
      }
    } finally {
      isShareInFlightRef.current = false
      setProcessingAction(null)
    }
  }

  return (
    <main className="min-h-screen bg-black px-5 py-6 text-white">
      <section className="mx-auto w-full max-w-md">
        <Link
          href={`/result/${slug}/analytics`}
          className="font-mono text-xs uppercase tracking-[0.24em] text-white/35"
        >
          ← Report
        </Link>

        <div
          ref={cardRef}
          className="relative mt-6 flex w-full flex-col overflow-hidden rounded-4xl border border-white/10 bg-[#060606] px-7 py-8 text-white"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,90,95,0.18),transparent_38%)]" />

          <div className="absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-accent/10 via-transparent to-transparent" />

          <div className="relative z-10 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF5A5F]">
              Identity Mirror
            </p>

            <p className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
              Anon Signal
            </p>
          </div>

          <div className="relative z-10 mt-14">
            <p className="text-sm font-bold leading-6 text-white/45">
              I asked my friends what energy I give off.
            </p>

            <p className="mt-8 text-sm font-black uppercase tracking-[0.24em] text-white/35">
              They picked
            </p>

            <h1 className="mt-4 max-w-[18rem] text-[3.35rem] font-black leading-[0.9] tracking-[-0.07em] text-white">
              {topTraitLabel}
            </h1>

            <p className="mt-5 text-xl font-black leading-6 tracking-[-0.04em] text-accent">
              {archetype}
            </p>
          </div>

          <div className="relative z-10 mt-10 rounded-[1.75rem] border border-white/10 bg-white/4 px-5 py-5">
            <p className="text-lg font-black leading-6 tracking-[-0.04em] text-white">
              {curiosityLine}
            </p>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-white/10 bg-black/30 px-4 py-4">
                <p className="text-3xl font-black text-white">
                  {totalVotes}
                </p>

                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  Anon traits
                </p>
              </div>

              <div className="rounded-3xl border border-[#FF5A5F]/20 bg-[#FF5A5F]/10 px-4 py-4">
                <p className="text-3xl font-black text-[#FF5A5F]">
                  secret
                </p>

                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  friends stayed hidden
                </p>
              </div>
            </div>

            {secondaryTraits.length > 0 ? (
              <div className="mt-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                  Also came up
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {secondaryTraits.map((trait) => (
                    <p
                      key={trait.label}
                      className="rounded-full bg-white/8 px-4 py-2 text-sm font-black text-white"
                    >
                      {trait.label}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="text-xs font-bold leading-5 text-white/40">
                Not a personality test. This came from people who
                actually know me.
              </p>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-accent">
                identitymirror.app
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={processingAction !== null}
            className="rounded-2xl border border-white/15 px-5 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processingAction === 'download'
              ? 'Processing...'
              : 'Download'}
          </button>

          <button
            type="button"
            onClick={handleShare}
            disabled={
              !isImageReady ||
              processingAction !== null
            }
            className="rounded-2xl bg-accent px-5 py-4 text-sm font-black text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {!isImageReady
              ? 'Preparing...'
              : processingAction === 'share'
                ? 'Processing...'
                : 'Share'}
          </button>
        </div>
      </section>
    </main>
  )
}