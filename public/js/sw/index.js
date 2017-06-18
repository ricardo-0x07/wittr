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

function servePhoto(request: Request) {
  // Photo urls look like:
  // /photos/9-8028-7527734776-e1d2bda28e-800px.jpg
  // But storageUrl has the -800px.jpg bit missing.
  // Use this url to store & match the image in the cache.
  // This means you only store one copy of each photo.
  const storageUrl = request.url.replace(/-\d+px\.jpg$/, '')

  // NOTE: return images from the "wittr-content-imgs" cache
  // if they're in there. Otherwise, fetch the images from
  // the network, put them into the cache, and send it back
  // to the browser.
  //
  // HINT: cache.put supports a plain url as the first parameter
  return caches.open(CONTENT_IMG_CACHE)
    .then(cache => cache.match(storageUrl).then(function(response) {
      if (response) return response

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone())
        return networkResponse
      })
    }))
}

// `skipWaiting` if we get the right kind of message from the UI
self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting()
  }
})
