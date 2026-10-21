// The service worker: a small script the browser keeps and runs in the background,
// apart from the page. It is what shows a push notification when the site is closed.
// It lives in public/ so it is served as is from /sw.js and covers the whole site.

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}

  event.waitUntil(
    (async () => {
      // Someone is looking at the site right now: the unread badge already tells them.
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      if (windows.some((w) => w.focused)) return

      await self.registration.showNotification(data.title || 'Georgia Trips', {
        body: data.body || '',
        tag: data.tag,
        icon: '/favicon.svg',
        data: { url: data.url || '/' },
      })
    })(),
  )
})

// Clicking the notification opens the chat: in a tab of the site if one is open, else a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const win of windows) {
        try {
          await win.focus()
          await win.navigate(url)
          return
        } catch {
          // This tab can't be steered from here; open a new one instead.
        }
      }
      await self.clients.openWindow(url)
    })(),
  )
})
