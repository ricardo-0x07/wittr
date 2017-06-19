// @flow

// $FlowFixMe
import toastTemplate from './../../../../templates/toast.hbs'

import parseHTML from './../../utils/parseHTML'
import defaults from 'lodash/object/defaults'
import transition from 'simple-transition'
import closest from 'closest'

/**
 * Toast UI constructor.
 * @constructor
 * @param {string} text - Toast message, e.g. "Do you want to continue?"
 * @param {number} duration - How long should the Toast be visible?
 * @param {string[]} buttons - Titles of the Toast's buttons.
 */
function Toast(text: string, duration: number, buttons: string[]) {
  const toast = this

  const _parsedHTML = parseHTML(toastTemplate({
    text: text,
    buttons: buttons
  })).firstChild

  if (!_parsedHTML) throw Error("Error during creation of Toast container!")
  this.container = _parsedHTML

  this.answer = new Promise(function(resolve) {
    toast._answerResolver = resolve
  })

  this.gone = new Promise(function(resolve) {
    toast._goneResolver = resolve
  })

  if (duration) {
    this._hideTimeout = setTimeout(function() {
      toast.hide()
    }, duration)
  }

  this.container.addEventListener('click', function(event: Event) {
    const button: HTMLElement = closest(event.target, 'button', true)
    if (!button) return

    toast._answerResolver(button.textContent)
    toast.hide()
  })
}

Toast.prototype.hide = function() {
  clearTimeout(this._hideTimeout)
  this._answerResolver()

  transition(this.container, {
    opacity: 0
  }, 0.3, 'ease-out').then(this._goneResolver)

  return this.gone
}

///

function Toasts(elemToAppend: HTMLElement) {
  const container = parseHTML('<div class="toasts"></div>').firstChild

  if (!container) throw Error("Something went wrong while creating Toasts container!")
  this._container = container

  elemToAppend.appendChild(this._container)
}


/**
 * Returns a `Toast` -a UI component that shows a message to the user.
 * @example
 * toasts.show("Do you wish to continue?", {
 *  buttons: ['yes', 'no']
 * })
 */
function showToast(message: string, opts: { duration: number, buttons: string[] }) {
  opts = defaults({}, opts, {
    duration: 0,
    buttons: ['dismiss']
  })

  const toast = new Toast(message, opts.duration, opts.buttons)
  this._container.appendChild(toast.container)

  transition(toast.container, {
    opacity: 1
  }, 0.5, 'ease-out')

  toast.gone.then(function() {
    // $FlowFixMe
    toast.container.parentNode.removeChild(toast.container)
  })

  return toast
}

Toasts.prototype.show = showToast

export default Toasts
