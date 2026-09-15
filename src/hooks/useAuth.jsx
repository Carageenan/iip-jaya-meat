import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null) // 'admin' | 'kasir' | null
  const [roleLoading, setRoleLoading] = useState(true)

  async function fetchRole(userId) {
    if (!userId) {
      setRole(null)
      setRoleLoading(false)
      return
    }
    setRoleLoading(true)
    const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single()
    // Gagal / profil belum ada -> fail-safe ke role paling rendah (kasir), bukan admin.
    setRole(error ? 'kasir' : data.role)
    setRoleLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
      fetchRole(data.session?.user?.id)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(false)
      fetchRole(newSession?.user?.id)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isAdmin = role === 'admin'

  return (
    <AuthContext.Provider
      value={{ session, loading, signIn, signOut, role, roleLoading, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
