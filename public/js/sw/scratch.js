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
