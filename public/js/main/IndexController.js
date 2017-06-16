import PostsView from './views/Posts'
import ToastsView from './views/Toasts'
import idb from 'idb'

export default function IndexController(container) {
  this._container = container
  this._postsView = new PostsView(this._container)
  this._toastsView = new ToastsView(this._container)
  this._lostConnectionToast = null
  this._openSocket()
  this._registerServiceWorker()
}

IndexController.prototype._registerServiceWorker = function() {
  const indexController = this

  if (!navigator.serviceWorker) {
    console.error('Service Workers are not supported on this browser.')
    return
  }

  navigator.serviceWorker.register('/sw.js')
    .then(function(reg) {
      self.__SW_REGISTRATION__ = reg // debugging only

      // NOTE/FSO: no controller means page wasn't loaded via a SW
      // (so users are looking the latest version)
      if (!navigator.serviceWorker.controller) return

      // updated worker already waiting
      if (reg.waiting) {
        indexController._updateReady()
        return
      }

      // NOTE: if there's an updated worker installing, track its
      // progress. If it becomes "installed", call
      // indexController._updateReady()
      if (reg.installing) {
        indexController._trackInstalling(reg.installing)
        return
      }

      // [...] otherwise, listen for new installing workers arriving, and
      // track their progress
      reg.addEventListener('updatefound', () => { indexController._trackInstalling(reg.installing) })
    })

  // TODO: listen for the controlling service worker changing
  // and reload the page
}

// Keep track of a Service Worker that's being installed, and
// notify the user when the installation has successfully finished.
IndexController.prototype._trackInstalling = function(worker) {
  const indexController = this

  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed') {
      indexController._updateReady()
    }
  })
}

IndexController.prototype._updateReady = function(updateMessage) {
  const msg = updateMessage || 'New Version Available'
  const toast = this._toastsView.show(msg, {
    buttons: ['refresh', 'dismiss']
  })

  toast.answer.then(function(answer) {
    if (answer != 'refresh') return

    // TODO: tell SW to skipWaiting
  })
}

// open a connection to the server for live updates
IndexController.prototype._openSocket = function() {
  var indexController = this
  var latestPostDate = this._postsView.getLatestPostDate()

  // create a url pointing to /updates with the ws protocol
  var socketUrl = new URL('/updates', window.location)
  socketUrl.protocol = 'ws'

  if (latestPostDate) {
    socketUrl.search = 'since=' + latestPostDate.valueOf()
  }

  // this is a little hack for the settings page's tests,
  // it isn't needed for Wittr
  socketUrl.search += '&' + location.search.slice(1)

  var ws = new WebSocket(socketUrl.href)

  // add listeners
  ws.addEventListener('open', function() {
    if (indexController._lostConnectionToast) {
      indexController._lostConnectionToast.hide()
    }
  })

  ws.addEventListener('message', function(event) {
    requestAnimationFrame(function() {
      indexController._onSocketMessage(event.data)
    })
  })

  ws.addEventListener('close', function() {
    // tell the user
    if (!indexController._lostConnectionToast) {
      indexController._lostConnectionToast = indexController._toastsView.show("Unable to connect. Retrying…")
    }

    // try and reconnect in 5 seconds
    setTimeout(function() {
      indexController._openSocket()
    }, 5000)
  })
}

// called when the web socket sends message data
IndexController.prototype._onSocketMessage = function(data) {
  var messages = JSON.parse(data)
  this._postsView.addPosts(messages)
}
