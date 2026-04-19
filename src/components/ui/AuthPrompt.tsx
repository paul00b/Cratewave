import { Link } from 'react-router-dom'

export default function AuthPrompt() {
  return (
    <div className="glass mx-auto mt-16 max-w-md p-8 text-center">
      <div className="mb-4 text-4xl">🔒</div>
      <h2 className="mb-2 text-lg font-semibold">Connexion requise</h2>
      <p className="mb-6 text-sm text-text-muted">
        Connecte-toi à Spotify pour accéder à cette page.
      </p>
      <Link
        to="/settings"
        className="inline-block rounded-xl bg-violet px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-light"
      >
        Aller aux paramètres
      </Link>
    </div>
  )
}
