// @flow

export default function(): boolean {
  if (!window.__IDB_AVAILABLE__) {
    console.warn('No IDB Store Found!')
    return false
  } else {
    return true
  }
}
