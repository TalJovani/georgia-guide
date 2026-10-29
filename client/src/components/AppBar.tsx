import { MessageCircle, Star } from 'lucide-react'
import { Link } from 'react-router'
import { homePath } from '../auth/context'
import { useAuth } from '../auth/useAuth'
import { useUnread } from '../chat/useUnread'
import { UnreadBadge } from './UnreadBadge'

// Every link up here is at least 44px tall, so it's easy to hit with a thumb.
const navLinkClassName = 'inline-flex min-h-11 items-center gap-1 transition-colors duration-150'

// The same bar as the landing page's: the name, a few quiet links, frosted over what scrolls
// beneath it. It keeps its own view-transition name, so it stays still while screens change.
export function AppBar() {
  const { user, logout } = useAuth()
  const { total } = useUnread()

  return (
    <header className="app-bar sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 bg-canvas/80 px-4 backdrop-blur-xl backdrop-saturate-150">
      <Link
        to={user ? homePath(user.role) : '/'}
        dir="ltr"
        className="inline-flex min-h-13 items-center text-[21px] font-semibold tracking-tight text-ink"
      >
        Georgia Trips
      </Link>
      {user && (
        <nav className="flex items-center gap-4 text-sm">
          {total > 0 && (
            <Link
              to={homePath(user.role)}
              aria-label={`${total} הודעות חדשות`}
              className={`${navLinkClassName} text-accent`}
            >
              <MessageCircle className="icon" /> <UnreadBadge count={total} />
            </Link>
          )}
          {user.role === 'GUIDE' && (
            <Link to="/guide/reviews" className={`${navLinkClassName} text-ink/80 hover:text-accent`}>
              <Star className="icon" /> ביקורות
            </Link>
          )}
          <Link to="/account" className={`${navLinkClassName} text-ink/80 hover:text-accent`}>
            החשבון שלי
          </Link>
          <button
            type="button"
            onClick={logout}
            className={`${navLinkClassName} text-muted hover:text-accent`}
          >
            התנתקות
          </button>
        </nav>
      )}
    </header>
  )
}
