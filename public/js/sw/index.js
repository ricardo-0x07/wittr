const STATIC_CACHE_NAME = 'wittr-static-v4'

self.addEventListener('install', function(event) {
  const urlsToCache = [
    '/',
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

self.addEventListener('fetch', function(event) {
  self.__EVENT__CURRENT_FETCH__ = event // for debugging purposes only
  event.respondWith(caches.match(event.request)
    .then(response => response || fetch(event.request)))
})

// `skipWaiting` if we get the right kind of message from the UI
self.addEventListener('message', function(event) {
  console.log('[ui] -> [sw]', event)
  if (event.data.action == 'skipWaiting') self.skipWaiting()
})
