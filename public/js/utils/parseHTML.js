// @flow

const contextRange = (function createCtxRange(bodyRef) {
  if (!bodyRef) throw Error("Can't work with empty document.body!")

  const ctxRange = document.createRange()
  ctxRange.setStart(bodyRef, 0)
  return ctxRange
})(document.body)

export default function strToEls(str: string) {
  return contextRange.createContextualFragment(str)
}
