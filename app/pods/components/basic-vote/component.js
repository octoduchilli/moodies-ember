import Component from '@ember/component'
import lerpColor from 'moodies-ember/mixins/lerp-color'
import { inject as service } from '@ember/service'
import { htmlSafe } from '@ember/string'
import { set } from '@ember/object'

export default Component.extend(lerpColor, {
  media: service(),
  user: service('current-user'),

  tagName: 'div',
  classNames: 'work',

  movieId: null,

  average: null,
  newAverage: null,

  userPseudo: null,

  onChange () {},

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
    },
    updateVoteAverage () {
      set(this, 'newAverage', Math.round((event.offsetX / event.target.offsetWidth) * 10))
    },
    onChange (average) {
      this.user.updateLastActivity('vote', this.movieId, average)

      this.onChange(average)
    }
  }
});
