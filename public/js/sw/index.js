self.addEventListener('fetch', function(event) {
  console.info(`Changing something...`)
  console.log(event.request)
})
