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
    caches.open('wittr-static-v1').then(function(cache) {
      console.groupCollapsed(`SW setup -- caching ${urlsToCache.length} objects`)
      console.info('Successful SW Installation')
      console.info('URLs to cache: ', urlsToCache)
      console.groupEnd()

      return cache.addAll(urlsToCache)
    })
  )
})

self.addEventListener('fetch', function(event) {
  console.log(event.request)
  self.__CURRENT_FETCH__ = event

  if (event.request.url.endsWith('jpg')) {
    event.respondWith(fetch('/imgs/dr-evil.gif'))
  } else {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.status === 404) {
            // return new Response("Whoops, not found :(")

            // NOTE: you can also return a `fetch`ed promise
            return fetch('/imgs/dr-evil.gif')
          }
          return response
        })
        .catch(() => new Response("Uh oh, that totally failed!"))
    )
  }
})

/// HELPERS ///
