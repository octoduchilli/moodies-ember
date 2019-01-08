import Component from '@ember/component'
import { inject as service } from '@ember/service'
import { htmlSafe } from '@ember/string'

export default Component.extend({
  notify: service('notification-messages'),
  media: service(),

  tagName: 'ul',
  classNames: 'flex wrap jus-center work',

  items: null,

  scrollY: 0,

  scroll () {},

  didInsertElement () {
    this._super(...arguments)

    this.__scroll = this.__setScrollY.bind(this)

    window.addEventListener('scroll', this.__scroll, false)

    if (this.scrollY !== null) {
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
    notifyUserPrivate (user) {
      this.notify.error(`${user.pseudo} a mit son profil en privé. Vous ne pouvez pas y accéder`)
    },
    updateUserProfileImgPos (x, y, scale) {
      return htmlSafe(`transform: translate(calc(-50% + ${x * (120 / 150)}px), calc(-50% + ${y * (120 / 150)}px)) scale(${scale})`)
    },
    slicedPseudo (pseudo) {
      if (pseudo !== 'Aucun pseudo') {
        return pseudo[0].toUpperCase()
      } else {
        return '-'
      }
    },
    style (attr, value) {
      if (value) {
        const rgb = this.__hexToRgb(value)

        return htmlSafe(`${attr}: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, .4)`)
      }
    }
  },

  __scroll () {},

  __setScrollY () {
    this.scroll(window.scrollY)
  },

  __hexToRgb (hex) {
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b
    })

    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
});
