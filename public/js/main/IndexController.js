// @flow weak

import idb from 'idb'
import invariant from 'invariant'
import PostsView from './views/Posts'
import ToastsView from './views/Toasts'

const NO_SW_MESSAGE = 'Service Workers are not supported on this browser!'

function openDatabase() {
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve()
  }

  // TODO: return a promise for a database called 'wittr'
  // that contains one objectStore: 'wittrs'
  // that uses 'id' as its key
  // and has an index called 'by-date', which is sorted
  // by the 'time' property
}

export default function IndexController(container: HTMLElement) {
  invariant(container, "The `container` provided is not an HTML Element!")

  this._container = container
  this._postsView = new PostsView(this._container)
  this._toastsView = new ToastsView(this._container)
  this._lostConnectionToast = null
  this._openSocket()
  this._dbPromise = openDatabase()

  if ('serviceWorker' in navigator) {
    this._registerServiceWorker()
  } else {
    console.warn(NO_SW_MESSAGE)
  }
}

IndexController.prototype._registerServiceWorker = function() {
  const indexController = this

  invariant(navigator.serviceWorker, NO_SW_MESSAGE)

  navigator.serviceWorker.register('/sw.js').then(function(reg) {
    if (process.env.NODE_ENV === 'development')
      self.__SW_REGISTRATION__ = reg

    // $FlowFixMe -- NOTE: Not loaded via SW, so we know it's the latest version
    if (!Boolean(navigator.serviceWorker.controller)) // eslint-disable-line no-extra-boolean-cast
      return

    // updated worker already waiting
    if (reg.waiting) {
      indexController._updateReady(reg.waiting)
      return
    }

    // NOTE: if there's an updated worker installing, track its
    // progress. If it becomes "installed", call
    // indexController._updateReady()
    if (reg.installing) {
      indexController._trackInstalling(reg.installing)
      return
    }

    // [...] otherwise, listen for new installing workers arriving and track their progress
    reg.addEventListener('updatefound', function() {
      indexController._trackInstalling(reg.installing)
    })
  })

  // Listen for controlling SW changies & reload when appropriate.
  let refreshing = false
  // $FlowFixMe
  navigator.serviceWorker.addEventListener('controllerchange', (event) => {
    if (process.env.NODE_ENV === 'development')
      console.log('[sw#controllerchange]', event)

    if (refreshing) return // ensure `refresh` is only called once.
    window.location.reload()
    refreshing = true
  })
}

// Keep track of a Service Worker that's being installed, and
// notify the user when the installation has successfully finished.
IndexController.prototype._trackInstalling = function(worker: ServiceWorker) {
  const indexController = this
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed') {
      indexController._updateReady(worker)
    }
  })
}

IndexController.prototype._updateReady = function(worker: ServiceWorker, updateMessage?: string) {
  const msg = updateMessage || 'New Version Available'
  const toast = this._toastsView.show(msg, {
    buttons: ['refresh', 'dismiss']
  })

  toast.answer.then(function(answer) {
    if (answer != 'refresh') return
    worker.postMessage({ action: 'skipWaiting' }) // tell SW to `skipWaiting`
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
