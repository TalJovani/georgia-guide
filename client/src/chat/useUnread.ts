import { useContext } from 'react'
import { UnreadContext } from './context'

export function useUnread() {
  const value = useContext(UnreadContext)
  if (!value) {
    throw new Error('useUnread must be used inside <UnreadProvider>')
  }
  return value
}
