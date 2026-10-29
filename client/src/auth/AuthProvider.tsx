import { useEffect, useState, type ReactNode } from 'react'
import { disablePush } from '../chat/notifications'
import { apiFetch } from '../lib/api'
import { AuthContext, type RegisterData, type User } from './context'

type UserResponse = { user: User }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<UserResponse>('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const data = await apiFetch<UserResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setUser(data.user)
    return data.user
  }

  async function register(registerData: RegisterData) {
    await apiFetch<UserResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    })
    await login(registerData.email, registerData.password)
  }

  async function logout() {
    // While still signed in, so the server lets us remove this browser's push subscription.
    await disablePush().catch(() => {})
    await apiFetch<void>('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
