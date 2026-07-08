'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type MirrorNavState = {
  slug: string
  traitCount: number
  isReady: boolean
}

export default function BottomNav() {
  const router = useRouter()
  const [mirrorState, setMirrorState] = useState<MirrorNavState | null>(null)

  useEffect(() => {
    async function loadActiveMirror() {
      const savedSlug = localStorage.getItem('traits_active_mirror')

      if (!savedSlug) return

      const supabase = createClient()

      const { data: mirror } = await supabase
        .from('mirrors')
        .select('slug, is_removed, expires_at, votes(count)')
        .eq('slug', savedSlug)
        .single()

      if (!mirror || mirror.is_removed) {
        localStorage.removeItem('traits_active_mirror')
        setMirrorState(null)
        return
      }

      const expiresAt = mirror.expires_at ? new Date(mirror.expires_at) : null
      const isExpired = expiresAt ? expiresAt.getTime() <= Date.now() : false

      if (isExpired) {
        localStorage.removeItem('traits_active_mirror')
        setMirrorState(null)
        return
      }

      const traitCount = Array.isArray(mirror.votes)
        ? Number(mirror.votes[0]?.count || 0)
        : 0

      setMirrorState({
        slug: mirror.slug,
        traitCount,
        isReady: traitCount >= 3,
      })
    }

    loadActiveMirror()
  }, [])

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-md items-center justify-evenly">
        <button
          type="button"
          onClick={() => router.push('/create')}
          className="text-sm font-bold text-white/60"
        >
          🏠 Home
        </button>

        {mirrorState ? (
          <button
            type="button"
            onClick={() => router.push('/activity')}
            className="relative text-sm font-bold text-lime-400"
          >
            🔔 Activity

            {mirrorState.isReady ? (
              <span className="ml-2 rounded-full bg-lime-400 px-2 py-0.5 text-[10px] font-black text-black">
                Ready
              </span>
            ) : mirrorState.traitCount > 0 ? (
              <span className="ml-2 rounded-full bg-lime-400 px-2 py-0.5 text-[10px] font-black text-black">
                {mirrorState.traitCount}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>
    </nav>
  )
}