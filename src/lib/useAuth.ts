import { useState, useEffect } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string) => {
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { session, user: session?.user ?? null, loading, signIn, signOut }
}
