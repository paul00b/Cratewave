import { useCallback, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../services/firebase'

const EMAIL_STORAGE_KEY = 'cratewave_signin_email'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Complete magic-link sign-in on redirect
  useEffect(() => {
    const url = window.location.href
    if (!isSignInWithEmailLink(auth, url)) return

    let email = localStorage.getItem(EMAIL_STORAGE_KEY)
    if (!email) {
      email = window.prompt('Confirme ton email pour finaliser la connexion :')
    }
    if (!email) return

    signInWithEmailLink(auth, email, url)
      .then(() => {
        localStorage.removeItem(EMAIL_STORAGE_KEY)
        window.history.replaceState({}, '', '/')
      })
      .catch((err) => console.error('[auth] signInWithEmailLink failed', err))
  }, [])

  const signInWithEmail = useCallback(async (email: string) => {
    await sendSignInLinkToEmail(auth, email, {
      url: `${window.location.origin}/`,
      handleCodeInApp: true,
    })
    localStorage.setItem(EMAIL_STORAGE_KEY, email)
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }, [])

  const signOut = useCallback(async () => {
    await fbSignOut(auth)
  }, [])

  return { user, loading, signInWithEmail, signInWithGoogle, signOut }
}
