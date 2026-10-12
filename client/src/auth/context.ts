import { createContext } from 'react'

export type User = {
  id: string
  email: string
  name: string
  phone: string | null
  role: 'TRAVELER' | 'GUIDE'
}

export type RegisterData = {
  email: string
  password: string
  name: string
  phone?: string
}

export type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  // After the account page changes or deletes the user on the server.
  setUser: (user: User | null) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
