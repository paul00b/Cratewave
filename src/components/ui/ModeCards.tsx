import type { ReactNode } from 'react'
import { useAppStore } from '../../store'
import type { DiscoveryMode } from '../../types'

const options: {
  value: DiscoveryMode
  label: string
  description: string
  icon: ReactNode
}[] = [
  {
    value: 'close',
    label: 'Dans ton univers',
    description: 'Des artistes dans la lignée de tes goûts',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'far',
    label: 'Au-delà',
    description: "Des découvertes qui t'emmènent ailleurs",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2 5-5 2 2-5z" />
      </svg>
    ),
  },
]

export default function ModeCards() {
  const discoveryMode = useAppStore((s) => s.discoveryMode)
  const setDiscoveryMode = useAppStore((s) => s.setDiscoveryMode)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map(({ value, label, description, icon }) => {
        const active = discoveryMode === value
        return (
          <button
            key={value}
            onClick={() => setDiscoveryMode(value)}
            aria-pressed={active}
            className={`glass group relative overflow-hidden p-4 text-left transition-all ${
              active
                ? 'border-violet/40 ring-1 ring-violet/30'
                : 'hover:border-white/20'
            }`}
          >
            {active && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet/15 via-transparent to-rose/10"
              />
            )}
            <div className="relative flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  active
                    ? 'bg-violet/20 text-violet-light'
                    : 'bg-surface text-text-muted group-hover:text-text'
                }`}
              >
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold ${
                    active ? 'text-text' : 'text-text-muted group-hover:text-text'
                  }`}
                >
                  {label}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-text-muted">
                  {description}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
