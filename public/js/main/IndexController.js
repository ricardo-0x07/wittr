// @flow

import idb from 'idb'
import invariant from 'invariant'
import PostsView from './views/Posts'
import ToastsView from './views/Toasts'

import {NO_SW_MESSAGE, MAX_WITTRS} from './config'

// type t_db = Promise<void> | Promise<IDBDatabase>
function openDatabase(): * {
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve()
  }

  return idb.open('wittr', 1, function(upgradeDB) {
    const store = upgradeDB.createObjectStore('wittrs', {
      keyPath: 'id'
    })
    store.createIndex('by-date', 'time')
  })
}


export default function IndexController(container: HTMLElement) {
  invariant(container, "The `container` provided is not an HTML Element!")
  this._container = container
  this._postsView = new PostsView(this._container)
  this._toastsView = new ToastsView(this._container)
  this._lostConnectionToast = null
  // this._openSocket() -- firing up ws connection here causes messages to be shown
  //                       twice in the UI
  this._dbPromise = openDatabase()
  this._registerServiceWorker()

  const indexController = this

  this._showCachedMessages().then(() => {
    indexController._openSocket()
  })
}


IndexController.prototype._registerServiceWorker = function() {
  if (!navigator.serviceWorker) {
    console.warn(NO_SW_MESSAGE)
    return
  }

  const indexController = this

  // invariant(navigator.serviceWorker, NO_SW_MESSAGE)

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


IndexController.prototype._showCachedMessages = function() {
  const indexController = this

  return this._dbPromise.then(function(db) {
    // if we're already showing posts, eg shift-refresh
    // or the very first load, there's no point fetching
    // posts from IDB
    if (!db || indexController._postsView.showingPosts()) return

    // NOTE: passing wittr msgs in IDB to _postsView
    // - sorted in order of date, starting with the latest.
    // - return a promise that does all this, so the websocket
    //   isn't opened until done
    const idx = db.transaction('wittrs')
      .objectStore('wittrs').index('by-date')

    return idx.getAll().then(function(messages) {
      indexController._postsView.addPosts(messages.reverse())
    })
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
      // $FlowFixMe
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
  const messages = JSON.parse(data)

  // populate 'wittrs' store
  this._dbPromise.then(function(db) {
    if (!db) return

    const tx = db.transaction('wittrs', 'readwrite')
    const store = tx.objectStore('wittrs')
    messages.forEach(message => { store.put(message) })

    // TODO: keep the newest `MAX_WITTRS` entries in 'wittrs' store,
    // but delete the rest.
    // Hint: you can use .openCursor(null, 'prev') to open a
    // cursor that goes through an index/store backwards.
    store.index('by-date').openCursor(null, 'prev')
      .then(cursor => cursor.advance(MAX_WITTRS))
      .then(function deleteRest(cursor) {
        if (!cursor) return
        cursor.delete()
        return cursor.continue().then(deleteRest)
      })
  })

  this._postsView.addPosts(messages)
}
