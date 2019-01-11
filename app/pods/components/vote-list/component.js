import Component from '@ember/component'
import { inject as service } from '@ember/service'
import { set } from '@ember/object'

export default Component.extend({
  notify: service('notification-messages'),
  media: service(),
  user: service('current-user'),

  tagName: 'ul',
  classNames: 'work',

  hover: null,

  items: null,

  scrollY: null,

  userPseudo: null,

  scroll () {},
  deleteItem () {},

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
    } else {
      set(this, 'scrollY', 0)
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
    async updateVote ({ id, title }, average) {
      await this.user.updateVote(id, title, average).then(vote => {
        const currentVote = this.items.findBy('id', id)

        set(currentVote, 'average', average)
        set(currentVote, 'modifiedAt', vote.modifiedAt)
      })

      const vote = this.items.findBy('id', id)

      set(vote, 'average', average)
    },
    async deleteVote (vote) {
      await this.user.deleteVote(vote.id)

      this.items.removeObject(vote)

      this.notify.success(`Votre vote pour ${vote.title} a bien été supprimé`)

      this.deleteItem(vote)
    }
  },

  __scroll () {},

  __setScrollY () {
    this.scroll(window.scrollY)
  }
});
