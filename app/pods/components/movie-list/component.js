import Component from '@ember/component'
import lerpColor from 'moodies-ember/mixins/lerp-color'
import genres from 'moodies-ember/data/genres'
import { inject as service } from '@ember/service'
import { htmlSafe } from '@ember/string'

export default Component.extend(lerpColor, {
  session: service(),
  notify: service('notification-messages'),
  media: service(),
  user: service('current-user'),
  view: service(),

  tagName: 'ul',
  classNames: 'flex wrap jus-center josefin',

  hover: null,

  items: null,
  itemsLoaded: 0,

  scrollY: 0,

  scroll () {},

  didInsertElement () {
    this._super(...arguments)

    this.__scroll = this.__setScrollY.bind(this)

    window.addEventListener('scroll', this.__scroll, false)

    if (this.media.isMobile) {
      setTimeout(() => {
        window.scroll({
          top: this.scrollY
        })
      })
    } else {
      window.scroll({
        top: this.scrollY
      })
    }

    this.updatedItems(this.items)
  },

  didUpdateAttrs () {
    this.updatedItems(this.items)
  },

  willDestroyElement () {
    window.removeEventListener('scroll', this.__scroll, false)
  },

  actions: {
    overviewSliced (overview) {
      if (!overview) {
        return 'Aucun synopsis'
      }

      if (overview.length > 150) {
        for (let i = 149; i < overview.length; i++) {
          if (overview[i] === ' ') {
            return overview.slice(0, i) + ' ...'
          }
        }
      }

      return overview
    },
    genreName (id) {
      const genre = genres.findBy('value', id)

      if (genre) {
        return genre.name
      }
    },
    notifyNotConnected () {
      this.notify.info(`Vous n'êtes pas connecté...`)
    },
    initVoteColors (item, vote) {
      if (vote === 'average') {
        return htmlSafe(`border-color: ${this.lerpColor({r: 255, g: 0, b: 0}, {r: 0, g: 255, b: 0}, item.vote_average / 10)}`)
      } else if (vote === 'count') {
        return htmlSafe(`color: ${this.lerpColor({r: 180, g: 180, b: 180}, {r: 255, g: 255, b: 255}, item.vote_count / 500)}`)
      }
    }
  },

  __scroll () {},

  __setScrollY () {
    this.scroll(window.scrollY)
  }
});
