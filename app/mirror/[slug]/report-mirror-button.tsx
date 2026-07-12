'use client'

import { useState } from 'react'

type Props = {
  mirrorId: string
  mirrorSlug: string
}

const reasons = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'underage', label: 'Underage issue' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
] as const

function getReporterKey() {
  const storageKey = 'traits_reporter_key'
  const existingKey = localStorage.getItem(storageKey)

  if (existingKey) return existingKey

  const newKey = crypto.randomUUID()
  localStorage.setItem(storageKey, newKey)

  return newKey
}

export default function ReportMirrorButton({ mirrorId, mirrorSlug }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function submitReport() {
    if (!reason || loading) return

    setLoading(true)
    setMessage('')

    const res = await fetch('/api/mirrors/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mirrorId,
        mirrorSlug,
        reporterKey: getReporterKey(),
        reason,
      }),
    })

    const data = await res.json()

    setLoading(false)

    if (!res.ok) {
      setMessage(data.error || 'Report failed.')
      return
    }

    setMessage('Report submitted.')
  }

  return (
    <div className="mt-8 border-t border-white/10 pt-5">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-[12px] border border-border bg-surface px-4 py-3 text-xs font-semibold text-foreground-secondary transition hover:border-accent hover:text-foreground"
        >
          Report this mirror
        </button>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/4 p-4">
          <p className="text-sm font-black text-white">Report this mirror</p>

          <div className="mt-4 space-y-2">
            {reasons.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setReason(item.value)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold ${
                  reason === item.value
                    ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                    : 'border-white/10 bg-black text-white/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={submitReport}
            disabled={!reason || loading}
            className="mt-4 w-full rounded-2xl bg-lime-400 px-5 py-4 text-sm font-black text-black disabled:opacity-40"
          >
            {loading ? 'Submitting...' : 'Submit report'}
          </button>

          {message ? (
            <p className="mt-3 text-sm font-bold text-white/50">{message}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}