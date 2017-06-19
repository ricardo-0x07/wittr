// @flow

import toArray from 'lodash/lang/toArray'

// $FlowFixMe
import postTemplate from './../../../../templates/post.hbs'
import parseHTML from './../../utils/parseHTML'
import humanReadableTimeDiff from './../../utils/humanReadableTimeDiff'

import {MAX_MESSAGES} from '../config'

import type { Message } from '../../utils/types'

/**
 * Container for `post` Messages.
 * @constructor
 * @param {HTMLElement} container
 */
function Posts(container: HTMLElement) {
  const posts = this
  this._container = container

  const scroller = container.querySelector('.posts')
  if (!scroller) { throw Error("Could not find .posts container!") }
    else { this._scroller = scroller }

  const newPostAlert = container.querySelector('.posts-alert')
  if (!newPostAlert) {throw Error("Could not find .post-alert container!") }
    else { this._newPostAlert = newPostAlert }

  this._lastTimeUpdate = 0
  this._scrollUpdatePending = false

  this._timesUpdate()

  // update times on an interval
  setInterval(function() {
    requestAnimationFrame(function() {
      posts._softTimesUpdate()
    })
  }, 1000 * 30)

  // listen to scrolling
  this._scroller.addEventListener('scroll', function(event) { // eslint-disable-line no-unused-vars
    if (posts._scrollUpdatePending) return
    posts._scrollUpdatePending = true

    requestAnimationFrame(function() {
      posts._onScroll()
      posts._scrollUpdatePending = false
    })
  })
}

// update all the <time> elements, unless we've
// already done so within the last 10 seconds
Posts.prototype._softTimesUpdate = function() {
  if (Date.now() - this._lastTimeUpdate < 1000 * 10) return
  this._timesUpdate()
}

// update all the <time> elements
Posts.prototype._timesUpdate = function() {
  const postTimeEls: HTMLElement[] = toArray(this._container.querySelectorAll('.post-time'))

  postTimeEls.forEach(function(timeEl) {
    // $FlowFixMe
    const postDate = new Date(timeEl.getAttribute('datetime'))

    timeEl.textContent = humanReadableTimeDiff(postDate)
  })

  this._lastTimeUpdate = Date.now()
}

// called as the scroll position changes
Posts.prototype._onScroll = function() {
  if (this._scroller.scrollTop < 60) {
    this._newPostAlert.classList.remove('active')
  }
}

// processes an array of objects representing messages,
// creates html for them, and adds them to the page
Posts.prototype.addPosts = function(messages: Message[]) {
  // create html for new posts
  const oldLatestPost = this._scroller.querySelector('.post')
  const oldLatestPostOldPosition = oldLatestPost && oldLatestPost.getBoundingClientRect()
  const htmlString = messages
    .map(message => postTemplate(message))
    .join('')

  // add to the dom
  const nodes = parseHTML(htmlString)
  this._scroller.insertBefore(nodes, this._scroller.firstChild)

  // remove really old posts to avoid too much content
  const posts = toArray(this._scroller.querySelectorAll('.post'))
  posts.slice(MAX_MESSAGES).forEach(post => { post.parentNode.removeChild(post) })

  // move scrolling position to make it look like nothing happened
  if (oldLatestPost) {
    const oldLatestPostNewPosition = oldLatestPost.getBoundingClientRect()
    this._scroller.scrollTop = this._scroller.scrollTop
      + (Math.round(oldLatestPostNewPosition.top)
      - Math.round(oldLatestPostOldPosition.top))

    this._newPostAlert.classList.add('active')
  }

  this._timesUpdate()
}

// get the date of the latest post, or null if there are no posts
Posts.prototype.getLatestPostDate = function(messages): null | Date {
  const timeEl = this._container.querySelector('.post-time')
  if (!timeEl) return null
  return new Date(timeEl.getAttribute('datetime'))
}

// Any there any posts in the view?
Posts.prototype.showingPosts = function(messages) {
  return !!this._container.querySelector('.post')
}

export default Posts
