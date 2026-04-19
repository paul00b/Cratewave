import { useAppStore } from '../../store'
import type { DiscoveryMode } from '../../types'

const modes: { value: DiscoveryMode; label: string }[] = [
  { value: 'close', label: 'Proche' },
  { value: 'far', label: 'Lointain' },
]

export default function ModeSlider() {
  const discoveryMode = useAppStore((s) => s.discoveryMode)
  const setDiscoveryMode = useAppStore((s) => s.setDiscoveryMode)

  return (
    <div className="glass inline-flex gap-1 p-1">
      {modes.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setDiscoveryMode(value)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            discoveryMode === value
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
