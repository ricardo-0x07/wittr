self.addEventListener('fetch', function(event) {
  console.log(event.request)
  // self.__CURRENT_FETCH__ = event

  const html = `
  <div class="a-winner-is-me">
    <h1>Hello World!</h1>
  </div>
  `

  event.respondWith(
    new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  )
})
