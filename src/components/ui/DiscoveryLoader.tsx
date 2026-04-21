import { useEffect, useState } from 'react'
import type { DiscoveryMode } from '../../types'

const CLOSE_MESSAGES = [
  'Lecture de tes écoutes récentes…',
  'Extraction des tags dominants…',
  'Recherche d’artistes voisins…',
  'Pondération selon ton mood…',
  'Résolution sur Spotify…',
  'Sélection des meilleurs titres…',
]

const FAR_MESSAGES = [
  'Analyse de ta signature musicale…',
  'Cartographie des genres à explorer…',
  'Consultation de Gemini…',
  'Traversée des sous-scènes…',
  'Filtrage des artistes que tu connais déjà…',
  'Résolution sur Spotify…',
  'Vérification des correspondances…',
]

interface Props {
  mode: DiscoveryMode
}

export default function DiscoveryLoader({ mode }: Props) {
  const messages = mode === 'far' ? FAR_MESSAGES : CLOSE_MESSAGES
  const [index, setIndex] = useState(0)
  const [start] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = mode === 'far' ? 2600 : 1400
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length)
    }, interval)
    return () => clearInterval(id)
  }, [messages.length, mode])

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - start), 500)
    return () => clearInterval(id)
  }, [start])

  return (
    <div className="glass relative flex flex-col gap-4 overflow-hidden p-6">
      {/* Ambient halo */}
      <div
        className={`pointer-events-none absolute -inset-16 opacity-50 blur-3xl ${
          mode === 'far'
            ? 'bg-gradient-to-br from-rose/20 via-violet/10 to-transparent'
            : 'bg-gradient-to-br from-violet/20 via-rose/10 to-transparent'
        }`}
      />

      <div className="relative flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
              mode === 'far' ? 'bg-rose' : 'bg-violet'
            }`}
          />
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              mode === 'far' ? 'bg-rose-light' : 'bg-violet-light'
            }`}
          />
        </span>
        <span className="text-xs uppercase tracking-[0.2em] text-text-muted">
          {mode === 'far' ? 'Exploration lointaine' : 'Exploration proche'}
        </span>
        <span className="ml-auto text-xs tabular-nums text-text-muted">
          {(elapsed / 1000).toFixed(1)}s
        </span>
      </div>

      <div className="relative h-6 overflow-hidden">
        {messages.map((m, i) => (
          <p
            key={m}
            className={`absolute inset-0 text-sm font-medium text-text transition-all duration-500 ease-out ${
              i === index
                ? 'translate-y-0 opacity-100'
                : i === (index - 1 + messages.length) % messages.length
                  ? '-translate-y-3 opacity-0'
                  : 'translate-y-3 opacity-0'
            }`}
          >
            {m}
          </p>
        ))}
      </div>

      {/* Shimmer progress bar */}
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`absolute inset-y-0 h-full w-1/3 rounded-full bg-gradient-to-r ${
            mode === 'far'
              ? 'from-transparent via-rose/60 to-transparent'
              : 'from-transparent via-violet/60 to-transparent'
          } animate-[shimmer_1.8s_ease-in-out_infinite]`}
        />
      </div>
    </div>
  )
}
