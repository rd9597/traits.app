'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'            
type MirrorTone = 'plus' | 'minus'

type MirrorCategory = {
  id: string
  label: string
}

const categories: MirrorCategory[] = [
  { id: 'friendship', label: 'Friendship' },
  { id: 'dating_relationships', label: 'Dating & Relationships' },
  { id: 'hidden_self', label: 'Hidden Self' },
  { id: 'first_impression', label: 'First Impression' },
  { id: 'career_study', label: 'Career & Study' },
  { id: 'chaos_mode', label: 'Chaos Mode' },
]

const questionBank: Record<string, Record<MirrorTone, string[]>> = {
  friendship: {
    plus: [
      'What makes me a good friend?',
      'What role do I play best in a friend group?',
      'What do my friends secretly appreciate about me?',
      'Why do people feel comfortable around me?',
      'What makes people trust me as a friend?',
      'What is my strongest friendship quality?',
    ],
    minus: [
      'What makes me difficult to be friends with?',
      'What do my friends tolerate about me?',
      'What toxic friend habit do I not notice?',
      'When do I become hard to deal with?',
      'What do I do that secretly annoys friends?',
      'What friendship red flag do I give off?',
    ],
  },
  dating_relationships: {
    plus: [
      'What would make me attractive in a relationship?',
      'What is my biggest green flag in dating?',
      'What kind of partner would I be at my best?',
      'What makes someone feel emotionally safe with me?',
      'What would make someone fall for me slowly?',
      'What is my strongest relationship quality?',
    ],
    minus: [
      'What is my biggest red flag in relationships?',
      'What would make dating me difficult?',
      'What toxic pattern would I bring into love?',
      'What would someone misunderstand about loving me?',
      'Where would I probably mess up in a relationship?',
      'What makes me emotionally hard to handle?',
    ],
  },
  hidden_self: {
    plus: [
      'What hidden strength do people see in me?',
      'What part of me is deeper than people expect?',
      'What emotion do I handle better than people think?',
      'What quiet quality makes me different?',
      'What do people admire about me but never say?',
      'What version of me do only close people notice?',
    ],
    minus: [
      'What emotion do I hide the most?',
      'What insecurity do people sense in me?',
      'What part of me feels hard to understand?',
      'What do I pretend not to care about?',
      'What truth about me do people notice silently?',
      'What side of me comes out when I am hurt?',
    ],
  },
  first_impression: {
    plus: [
      'What makes my first impression memorable?',
      'What positive vibe do I give at first?',
      'What makes people curious about me quickly?',
      'What do people like about me before knowing me?',
      'What makes me stand out in a room?',
      'What energy do I give when people first meet me?',
    ],
    minus: [
      'What do people wrongly assume about me first?',
      'What negative vibe do I accidentally give off?',
      'What makes me look unapproachable at first?',
      'What first impression works against me?',
      'What do people misread about my face or silence?',
      'What makes me seem difficult before knowing me?',
    ],
  },
  career_study: {
    plus: [
      'What makes me useful in a team?',
      'What work or study strength do people notice in me?',
      'What makes people trust me with responsibility?',
      'What role would I naturally take in a project?',
      'What makes me look capable under pressure?',
      'What professional quality do I quietly have?',
    ],
    minus: [
      'What makes me hard to work or study with?',
      'What bad habit affects my progress most?',
      'What do people doubt about me in serious work?',
      'Where do I look less reliable than I actually am?',
      'What weakness shows up when pressure increases?',
      'What work or study red flag do I give off?',
    ],
  },
  chaos_mode: {
    plus: [
      'What makes me secretly entertaining?',
      'What chaotic talent would I survive with?',
      'What funny role would I play in a reality show?',
      'What makes my drama enjoyable to watch?',
      'What unserious strength do people see in me?',
      'What makes me accidentally iconic?',
    ],
    minus: [
      'What chaos do I bring without realizing?',
      'What would get me cancelled in a friend group?',
      'What reality show would expose me first?',
      'What messy habit do people associate with me?',
      'What trouble would I accidentally start?',
      'What makes me a walking plot twist?',
    ],
  },
}

function getShuffledQuestions(categoryId: string, tone: MirrorTone) {
  return [...questionBank[categoryId][tone]]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)
}

export default function CreatePage() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTone, setSelectedTone] = useState<MirrorTone>('plus')
  const [selectedQuestion, setSelectedQuestion] = useState('')
  const [customQuestion, setCustomQuestion] = useState('')
  const [error, setError] = useState('')
  const [shuffleKey, setShuffleKey] = useState(0)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [activeMirrorSlug, setActiveMirrorSlug] = useState('')

  const visibleQuestions = useMemo(() => {
    if (!selectedCategory) return []
    shuffleKey
    return getShuffledQuestions(selectedCategory, selectedTone)
  }, [selectedCategory, selectedTone, shuffleKey])

  useEffect(() => {
  const savedSlug = localStorage.getItem('traits_active_mirror')

  if (savedSlug) {
    setActiveMirrorSlug(savedSlug)
  }
}, [])

  function handleCategoryChange(categoryId: string) {
    setSelectedCategory(categoryId)
    setSelectedQuestion('')
    setCustomQuestion('')
    setError('')
    setShowCategories(false)
    setShuffleKey((current) => current + 1)
  }

  function handleToneChange(tone: MirrorTone) {
    setSelectedTone(tone)
    setSelectedQuestion('')
    setCustomQuestion('')
    setError('')
    setShuffleKey((current) => current + 1)
  }

  async function handleCreate() {
  const question = customQuestion.trim() || selectedQuestion

  if (!selectedCategory) {
    setError('Please choose a category.')
    return
  }

  if (!question) {
    setError('Please select or type a question.')
    return
  }

  try {
    setLoading(true)
    setError('')

    const creatorKey =
      localStorage.getItem('traits_creator_key') ||
      crypto.randomUUID()

    localStorage.setItem(
      'traits_creator_key',
      creatorKey
    )
    document.cookie = `traits_creator_key=${creatorKey}; path=/; max-age=31536000; SameSite=Lax`

    const response = await fetch('/api/mirrors/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: selectedCategory,
        tone: selectedTone,
        question,
        language: 'english',
        creatorKey,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create mirror.')
    }

    localStorage.setItem('traits_active_mirror', data.slug)

    router.push(`/mirror/${data.slug}`)

    router.push(`/mirror/${data.slug}`)
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'Failed to create mirror.'
    )
  } finally {
    setLoading(false)
  }
}

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <section className="mx-auto flex min-h-[85vh] w-full max-w-md flex-col justify-center">

  <p className="text-xs font-bold uppercase tracking-[0.28em] text-lime-400">
    Create Mirror
  </p>

        <h1 className="mt-4 text-4xl font-black leading-tight">
          What do you want your friends to reveal?
        </h1>

        <div className="mt-8">
  <button
    type="button"
    onClick={() => setShowCategories((current) => !current)}
    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left"
  >
    <span>
      <span className="block text-xs font-bold uppercase tracking-[0.2em] text-white/35">
        Category
      </span>
      <span className="mt-1 block text-base font-bold text-white">
        {selectedCategory
          ? categories.find((category) => category.id === selectedCategory)?.label
          : 'Select category'}
      </span>
    </span>

    <span className="text-sm font-bold text-lime-400">
      {showCategories ? 'Close' : 'Change'}
    </span>
  </button>

  {showCategories ? (
    <div className="mt-3 grid grid-cols-1 gap-3">
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategoryChange(category.id)}
            className={`rounded-2xl border px-5 py-4 text-left text-sm font-bold ${
              isSelected
                ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                : 'border-white/10 bg-white/5 text-white'
            }`}
          >
            {category.label}
          </button>
        )
      })}
    </div>
  ) : null}
</div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleToneChange('plus')}
            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
              selectedTone === 'plus'
                ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                : 'border-white/10 bg-white/5 text-white'
            }`}
          >
            Gas Me Up
          </button>

          <button
            type="button"
            onClick={() => handleToneChange('minus')}
            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
              selectedTone === 'minus'
                ? 'border-red-400 bg-red-400/10 text-red-400'
                : 'border-white/10 bg-white/5 text-white'
            }`}
          >
            Be Brutal
          </button>
        </div>

        {selectedCategory ? (
          <>
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-white/40">Pick one question</p>

              <button
                type="button"
                onClick={() => {
                  setSelectedQuestion('')
                  setCustomQuestion('')
                  setError('')
                  setShuffleKey((current) => current + 1)
                }}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-lime-400"
              >
                Shuffle
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {visibleQuestions.map((question) => {
                const isSelected = selectedQuestion === question

                return (
                  <button
                    key={question}
                    type="button"
                    onClick={() => {
                      setSelectedQuestion(question)
                      setCustomQuestion('')
                      setError('')
                    }}
                    className={`w-full rounded-2xl border px-5 py-4 text-left ${
                      isSelected
                        ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                        : 'border-white/10 bg-white/5 text-white'
                    }`}
                  >
                    {isSelected ? `✓ ${question}` : question}
                  </button>
                )
              })}
            </div>

            <input
              type="text"
              maxLength={90}
              value={customQuestion}
              onChange={(event) => {
                setCustomQuestion(event.target.value)
                setSelectedQuestion('')
                setError('')
              }}
              placeholder="Or type your own sharp question..."
              className="mt-6 h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-5 outline-none placeholder:text-white/30"
            />
          </>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          className="mt-8 h-14 rounded-2xl bg-lime-400 font-bold text-black disabled:opacity-50"
      >
          {loading ? 'Creating Mirror...' : 'Create My Mirror'}
        </button>
      </section>
    </main>
  )
}