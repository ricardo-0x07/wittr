// @flow

type cb = () => mixed

export default function loadScripts(urls: string[], successCallback: cb, failureCallback: cb) {
  let count = urls.length
  let errored = false

  if (urls.length == 0)
    return successCallback()

  urls.forEach(function(url) {
    let scriptEl = document.createElement('script')
    scriptEl.src = url

    scriptEl.onload = function() {
      if (errored) return
      if (!--count) successCallback()
    }

    scriptEl.onerror = function() {
      if (errored) return
      failureCallback()
      errored = true
    }

    // $FlowFixMe
    document.head.insertBefore(scriptEl, document.head.firstChild)
  })
}
