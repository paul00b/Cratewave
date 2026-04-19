import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const links: { to: string; label: string; icon: ReactNode }[] = [
  {
    to: '/',
    label: 'Home',
    icon: (
      <svg {...iconProps}>
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
      </svg>
    ),
  },
  {
    to: '/stats',
    label: 'Stats',
    icon: (
      <svg {...iconProps}>
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 4 6-6" />
      </svg>
    ),
  },
  {
    to: '/discover',
    label: 'Discover',
    icon: (
      <svg {...iconProps}>
        <circle cx="11" cy="11" r="7" />
        <path d="M11 8a3 3 0 013 3" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg {...iconProps}>
        <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
]

export default function Nav() {
  return (
    <nav className="glass fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-1 px-2 py-2">
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            `flex items-center justify-center rounded-xl p-2.5 transition-colors ${
              isActive
                ? 'bg-violet/20 text-violet-light'
                : 'text-text-muted hover:text-text'
            }`
          }
        >
          {icon}
        </NavLink>
      ))}
    </nav>
  )
}
