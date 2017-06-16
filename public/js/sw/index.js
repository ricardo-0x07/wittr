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
