import { useAppStore } from '../../store'
import type { Mood } from '../../types'

const moods: { value: Mood; label: string }[] = [
  { value: 'focus', label: 'Focus' },
  { value: 'energy', label: 'Énergie' },
  { value: 'melancholy', label: 'Mélancolie' },
  { value: 'party', label: 'Fête' },
  { value: 'chill', label: 'Chill' },
  { value: 'introspection', label: 'Introspection' },
]

export default function MoodSelector() {
  const mood = useAppStore((s) => s.mood)
  const setMood = useAppStore((s) => s.setMood)

  return (
    <div className="relative -mx-4 sm:mx-0">
      <div className="overflow-x-auto px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <div className="flex w-max gap-2 pr-4 sm:pr-0">
          {moods.map(({ value, label }) => {
            const active = mood === value
            return (
              <button
                key={value}
                onClick={() => setMood(value)}
                className={`shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-rose/40 bg-rose/20 text-rose-light'
                    : 'border-border bg-surface text-text-muted hover:text-text'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
      {/* Right-edge fade mask — mobile only, hints at scrollability */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-bg to-transparent sm:hidden"
      />
    </div>
  )
}
