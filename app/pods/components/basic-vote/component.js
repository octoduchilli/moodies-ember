import Component from '@ember/component'
import lerpColor from 'moodies-ember/mixins/lerp-color'
import { inject as service } from '@ember/service'
import { htmlSafe } from '@ember/string'
import { set } from '@ember/object'

export default Component.extend(lerpColor, {
  media: service(),
  user: service('current-user'),

  tagName: 'div',
  classNames: 'work pointer',

  movieId: null,

  average: null,
  newAverage: null,

  userPseudo: null,

  onChange () {},

  click (event) {
    if (!this.userPseudo) {
      set(this, 'newAverage', Math.round((event.offsetX / event.target.offsetWidth) * 10))

      this.__onChange(this.newAverage)

      if (this.media.isMobile) {
        set(this, 'newAverage', null)
      }
    }
  },

  mouseMove (event) {
    if (!this.media.isMobile && !this.userPseudo) {
      set(this, 'newAverage', Math.round((event.offsetX / event.target.offsetWidth) * 10))
    }
  },

  mouseLeave () {
    if (!this.media.isMobile && !this.userPseudo) {
      set(this, 'newAverage', null)
    }
  },

  actions: {
    voteAverageBorderColorStyle (average) {
      if (average !== null) {
        return htmlSafe(`border: 2px solid ${this.lerpColor({r: 255, g: 0, b: 0}, {r: 0, g: 255, b: 0}, average / 10)}`)
      }
    },
    voteAverageBgStyle (average) {
      if (!average) {
        return htmlSafe(`width: 0; backgroud: rgba(0, 0, 0, 0)`)
      } else {
        return htmlSafe(`width: ${(average / 10) * 100}%; background: ${this.lerpColor({r: 255, g: 0, b: 0}, {r: 0, g: 255, b: 0}, average / 10)}`)
      }
    }
  },

  __onChange (average) {
    this.user.updateLastActivity('vote', this.movieId, average)

    this.onChange(average)
  }
});
