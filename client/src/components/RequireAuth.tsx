import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { User } from '../auth/context'
import { useAuth } from '../auth/useAuth'

type RequireAuthProps = {
  role?: User['role']
  children: ReactNode
}

export function RequireAuth({ role, children }: RequireAuthProps) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />
  }
  return children
}
