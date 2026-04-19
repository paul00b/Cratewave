import { useAppStore } from '../../store'
import type { TimeRange } from '../../types'

const tabs: { value: TimeRange; label: string }[] = [
  { value: 'short_term', label: '4 semaines' },
  { value: 'medium_term', label: '6 mois' },
  { value: 'long_term', label: 'Depuis toujours' },
]

export default function TimeRangeTabs() {
  const timeRange = useAppStore((s) => s.timeRange)
  const setTimeRange = useAppStore((s) => s.setTimeRange)

  return (
    <div className="glass inline-flex gap-1 p-1">
      {tabs.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setTimeRange(value)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            timeRange === value
              ? 'bg-violet/20 text-violet-light'
              : 'text-text-muted hover:text-text'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
