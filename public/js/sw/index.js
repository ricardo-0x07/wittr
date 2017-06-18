// @flow

const STATIC_CACHE_NAME = 'wittr-static-v8'
const CONTENT_IMG_CACHE = 'wittr-content-imgs'

// all the caches we care about
const allCaches = [
  STATIC_CACHE_NAME,
  CONTENT_IMG_CACHE,
]

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(function(cache) {
      return cache.addAll([
        '/skeleton',    // caching skeleton (app "shell") instead of root page
        '/js/main.js',
        'css/main.css',
        'imgs/icon.png',
        'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
        'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
      ])
    })
  )
})


self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('wittr-') &&
                 !allCaches.includes(cacheName)
        }).map(cacheName => caches.delete(cacheName))
      )
    })
  )
})


self.addEventListener('fetch', function(event: FetchEvent) {
  const requestUrl = new URL(event.request.url)

  // app shell
  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/skeleton'))
      return
    }
  }

  // photos (non-static content)
  if (requestUrl.pathname.startsWith('/photos/')) {
    event.respondWith(servePhoto(event.request))
    return
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request)
    })
  )
})


// `skipWaiting` if we get the right kind of message from the UI
self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting()
  }
})


/// HELPERS ///

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
