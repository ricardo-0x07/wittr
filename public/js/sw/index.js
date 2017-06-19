// @flow

const STATIC_CACHE_NAME = 'wittr-static-v8'
const CONTENT_IMG_CACHE = 'wittr-content-imgs'
const allCaches = [ STATIC_CACHE_NAME, CONTENT_IMG_CACHE ]


self.addEventListener('install', function(event: InstallEvent) {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => cache.addAll([
          '/skeleton',    // cache app shell
          '/js/main.js',
          'css/main.css',
          'imgs/icon.png',
          'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
          'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
        ]))
  )
})


self.addEventListener('activate', function(event: ExtendableEvent) {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames
        .filter(cacheName => cacheName.startsWith('wittr-') && !allCaches.includes(cacheName))
        .map(cacheName => caches.delete(cacheName))
    ))
  )
})


self.addEventListener('fetch', function(event: FetchEvent) {
  const requestUrl = new URL(event.request.url)

  if (requestUrl.origin === location.origin) {
    // app shell (static)
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/skeleton'))
      return
    }

    // photos (non-static)
    if (requestUrl.pathname.startsWith('/photos/')) {
      event.respondWith(servePhoto(event.request))
      return
    }

    // avatars (non-static)
    if (requestUrl.pathname.startsWith('/avatars/')) {
      event.respondWith(serveAvatar(event.request))
      return
    }
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  )
})


// `skipWaiting` if we get the right kind of message from the UI
self.addEventListener('message', function(event: ServiceWorkerMessageEvent) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting()
  }
})


/// HELPERS ///

function serveAvatar(request: Request) {
  const storageUrl = request.url.replace(/-\dx\.jpg$/, '')

  return caches.open(CONTENT_IMG_CACHE)
    .then(cache => cache.match(storageUrl).then(function(response) {
      // Fetch avatar regardless of cache HIT/MISS
      // (some users change their avatars frequently)
      const networkFetch = fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone())
        return networkResponse
      })

      return response || networkFetch
    }))
}

function servePhoto(request: Request) {
  const storageUrl = request.url.replace(/-\d+px\.jpg$/, '')

  return caches.open(CONTENT_IMG_CACHE)
    .then(cache => cache.match(storageUrl).then(function(response) {
      if (response) return response

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone())
        return networkResponse
      })
    }))
}
