import Component from '@ember/component'

export default Component.extend({
  tagName: 'ul',
  classNames: 'flex wrap jus-center josefin',

  items: null,
  scrollY: 0,

  scroll () {},

  didInsertElement () {
    this._super(...arguments)

    this.__scroll = this.__setScrollY.bind(this)

    window.addEventListener('scroll', this.__scroll, false)

    window.scroll({
      top: this.scrollY
    })

    this.updatedItems(this.items)
  },

  didUpdateAttrs () {
    this.updatedItems(this.items)
  },

  willDestroyElement () {
    window.removeEventListener('scroll', this.__scroll, false)
  },

  __scroll () {},

  __setScrollY () {
    this.scroll(window.scrollY)
  }
});
