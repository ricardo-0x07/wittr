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
    // NOTE: save urls to 'wittr-static-v1' cache
    caches.open('wittr-static-v2').then(function(cache) {
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
    // remove old cache
    caches.delete('wittr-static-v1')
  )
})

self.addEventListener('fetch', function(event) {
  self.__CURRENT_FETCH__ = event // for debugging purposes only

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  )
})
