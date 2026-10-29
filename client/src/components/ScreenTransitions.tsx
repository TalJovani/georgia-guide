import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { changeScreen, directionBetween, screenArrived } from '../lib/screenTransition'

// Every click on a link inside the site becomes an animated screen change. Listening once here,
// before React Router's own handler, saves wiring each <Link> by hand. Links that should behave
// as usual are left alone: new tabs, downloads, other sites, and jumps within the same page.
export function ScreenTransitions() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // The new screen is on the page: the screen change may photograph it now.
  useLayoutEffect(screenArrived, [pathname])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element).closest('a[href]')
      if (!(link instanceof HTMLAnchorElement)) return
      if (link.target && link.target !== '_self') return
      if (link.hasAttribute('download')) return
      const url = new URL(link.href)
      if (url.origin !== location.origin) return
      if (url.pathname === pathname) return // a jump within this page, like #how

      event.preventDefault()
      changeScreen(
        () => navigate(url.pathname + url.search + url.hash),
        directionBetween(pathname, url.pathname),
      )
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [navigate, pathname])

  return null
}
