// @flow

const STATIC_CACHE_NAME = 'wittr-static-v6'

self.addEventListener('install', function(event) {
  const urlsToCache = [
    '/skeleton',    // caching skeleton (app "shell") instead of root page
    '/js/main.js',
    'css/main.css',
    'imgs/icon.png',
    'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
    'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
  ]

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(function(cache) {
        console.groupCollapsed(`SW setup -- caching ${urlsToCache.length} objects`)
          console.info('Successful SW Installation')
          console.info('URLs to cache: ', urlsToCache)
        console.groupEnd()
        return cache.addAll(urlsToCache)
      })
  )
})

self.addEventListener('activate', function(event) {
  event.waitUntil(
    // NOTE: Only remove caches beginning with 'wittr-', and don't disturb
    // caches which other parts of the app may depend on.
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('wittr-') &&
                 cacheName != STATIC_CACHE_NAME
        }).map(cacheName => caches.delete(cacheName))
      )
    })
  )
})

self.addEventListener('fetch', function(event: FetchEvent) {
  self.__EVENT__CURRENT_FETCH__ = event // DEBUG ONLY

  // requests for root page get /skeleton response (from cache)
  const requestUrl = new URL(event.request.url)

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/skeleton'))

      // `skeleton` is cached at install time, so we don't need fallback
      return
    }
  }

  event.respondWith(caches.match(event.request)
    .then(response => response || fetch(event.request)))
})

// `skipWaiting` if we get the right kind of message from the UI
self.addEventListener('message', function(event) {
  console.log('[ui] -> [sw]', event)
  if (event.data.action == 'skipWaiting') self.skipWaiting()
})
