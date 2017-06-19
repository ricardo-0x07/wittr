// @flow

/**
 * Individual message from conf-app backend.
 */
export type Message = {
  avatar: string,
  body: string,
  id: string,
  name: string,
  time: string,
  photo?: string,
}
