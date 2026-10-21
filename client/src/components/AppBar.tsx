import { MessageCircle, Mountain, Star } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { useUnread } from '../chat/useUnread'
import { UnreadBadge } from './UnreadBadge'

// Every link up here is at least 44px tall, so it's easy to hit with a thumb.
const navLinkClassName = 'inline-flex min-h-11 items-center gap-1 transition-colors duration-150'

export function AppBar() {
  const { user, logout } = useAuth()
  const { total } = useUnread()

  return (
    <header className="flex items-center justify-between gap-3 border-b border-line pb-2">
      <Link to="/" className="inline-flex min-h-11 items-center gap-2 font-display text-xl text-brand">
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-brand to-accent text-on-brand shadow-button"
        >
          <Mountain className="size-5" strokeWidth={2.25} />
        </span>
        Georgia Trips
      </Link>
      {user && (
        <nav className="flex items-center gap-3 text-sm font-semibold">
          {total > 0 && (
            <Link
              to={user.role === 'GUIDE' ? '/guide' : '/trips'}
              aria-label={`${total} הודעות חדשות`}
              className={`${navLinkClassName} text-brand`}
            >
              <MessageCircle className="icon" /> <UnreadBadge count={total} />
            </Link>
          )}
          {user.role === 'GUIDE' && (
            <Link to="/guide/reviews" className={`${navLinkClassName} text-ink hover:text-brand`}>
              <Star className="icon" /> ביקורות
            </Link>
          )}
          <Link to="/account" className={`${navLinkClassName} text-ink hover:text-brand`}>
            החשבון שלי
          </Link>
          <button
            type="button"
            onClick={logout}
            className={`${navLinkClassName} text-muted hover:text-brand`}
          >
            התנתקות
          </button>
        </nav>
      )}
    </header>
  )
}
