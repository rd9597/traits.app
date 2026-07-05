import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function ShareCardPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: mirror } = await supabase
    .from('mirrors')
    .select('question, is_removed')
    .eq('slug', slug)
    .single()

  if (!mirror || mirror.is_removed) {
    notFound()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 py-8 text-white">
      <section className="w-full max-w-md rounded-4xl border border-lime-400/40 bg-white/5 p-6">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-400">
          Anonymous Mirror
        </p>

        <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight">
          {mirror.question}
        </h1>

        <p className="mt-6 text-base font-bold leading-7 text-white/60">
          Pick one trait anonymously. 3 traits unlock the result.
        </p>

        <div className="mt-8 rounded-2xl bg-lime-400 px-5 py-4 text-center text-sm font-black text-black">
          Open Mirror
        </div>
      </section>
    </main>
  )
}