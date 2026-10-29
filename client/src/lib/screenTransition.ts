// Screen changes, done with the browser's View Transitions: it photographs the old screen, we
// swap in the new one, and CSS (index.css, "Screen changes") animates between the two pictures.
// Browsers without it just change screens at once.

export type Direction = 'forward' | 'back' | 'across'

// Deeper paths are further in: /trips, then /trips/:id, then /trips/:id/chat. Going deeper is
// forward, going up is back, and anything else (the trips to the account) is across.
export function directionBetween(from: string, to: string): Direction {
  const depth = (path: string) => path.split('/').filter(Boolean).length
  if (depth(to) > depth(from) && to.startsWith(from === '/' ? '/' : `${from}/`)) return 'forward'
  if (depth(to) < depth(from) && from.startsWith(to === '/' ? '/' : `${to}/`)) return 'back'
  return 'across'
}

// A screen still loading its data marks itself with data-screen-loading (components/Loading).
// The new picture waits for that mark to go, up to a limit, so the screen arrives with its content.
const LOADING_LIMIT_MS = 700

function screenSettled() {
  if (!document.querySelector('[data-screen-loading]')) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.querySelector('[data-screen-loading]')) done()
    })
    const timer = setTimeout(done, LOADING_LIMIT_MS)
    function done() {
      observer.disconnect()
      clearTimeout(timer)
      resolve()
    }
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

// React Router draws the new screen a moment after navigate() (inside a React transition), so we
// can't photograph it straight away. ScreenTransitions calls screenArrived() once the new
// location is on the page.
let arrived: (() => void) | null = null

export function screenArrived() {
  arrived?.()
  arrived = null
}

export function changeScreen(update: () => void, direction: Direction) {
  if (!document.startViewTransition) {
    update()
    return
  }
  const root = document.documentElement
  root.dataset.screenChange = direction
  const transition = document.startViewTransition(async () => {
    await new Promise<void>((resolve) => {
      arrived = resolve
      setTimeout(resolve, LOADING_LIMIT_MS)
      update()
    })
    await screenSettled()
  })
  transition.finished.finally(() => delete root.dataset.screenChange)
}
