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
    <div className="flex flex-wrap gap-2">
      {moods.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setMood(value)}
          className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
            mood === value
              ? 'border-rose/30 bg-rose/20 text-rose-light'
              : 'border-border bg-surface text-text-muted hover:text-text'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
