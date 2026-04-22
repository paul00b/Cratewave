import { useState } from 'react'
import GlassCard from '../components/ui/GlassCard'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signInWithEmail, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      await signInWithEmail(email.trim())
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-6 text-center">
      <h1 className="bg-gradient-to-r from-violet-light to-rose-light bg-clip-text text-4xl font-bold text-transparent">
        Cratewave
      </h1>
      <p className="text-sm text-text-muted">
        Connecte-toi pour retrouver tes playlists partout.
      </p>

      <GlassCard className="w-full">
        <button
          onClick={() => signInWithGoogle().catch((e) => {
            setStatus('error')
            setErrorMsg(e instanceof Error ? e.message : 'Erreur Google')
          })}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-violet/40"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continuer avec Google
        </button>
        <div className="mb-4 flex items-center gap-3 text-xs text-text-muted">
          <div className="h-px flex-1 bg-border" />
          <span>ou par email</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        {status === 'sent' ? (
          <div className="flex flex-col gap-2 text-center">
            <div className="text-3xl">📩</div>
            <p className="text-sm font-medium">Vérifie ta boîte mail</p>
            <p className="text-xs text-text-muted">
              On t'a envoyé un lien magique à <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label className="text-left text-xs text-text-muted">Email</label>
            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-violet/60"
            />
            <button
              type="submit"
              disabled={status === 'sending' || !email}
              className="rounded-xl bg-violet px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-light disabled:opacity-50"
            >
              {status === 'sending' ? 'Envoi…' : 'Recevoir le lien'}
            </button>
            {status === 'error' && (
              <p className="text-xs text-rose-light">{errorMsg}</p>
            )}
          </form>
        )}
      </GlassCard>
    </div>
  )
}
