self.addEventListener('fetch', function(event) {
  console.log(event.request)
  // self.__CURRENT_FETCH__ = event

  if (checkUrlforJpg(event.request.url)) {
    event.respondWith(
      fetch('/imgs/dr-evil.gif')
    )
  }
})


/// HELPERS ///

function checkUrlforJpg(url) {
  console.log(url.endsWith('jpg'))
  const split = url.split('.')
  return 'jpg' === split.reverse()[0]
}

function fixedHello(respBody) { // eslint-disable-line no-unused-vars
  const html = respBody || `
    <div class="a-winner-is-me">
      <h1>Hello World!</h1>
    </div>
    `

  new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8'
    }
  })
}
