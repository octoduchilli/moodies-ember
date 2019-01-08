import Component from '@ember/component'
import { inject as service } from '@ember/service'

export default Component.extend({
  user: service('current-user'),

  tagName: 'div',
  classNames: 'flex wrap work filters-top-bar',
  classNameBindings: ['user.lockFiltersTopBar:is--locked'],

  lock: null,

  onResize () {},

  click () {
    this.__onResize()
  },

  didInsertElement () {
    this._super(...arguments)

    this.__resize = this.__onResize.bind(this)

    window.addEventListener('resize', this.__resize, false)

    this.__onResize()
  },

  willDestroyElement () {
    window.removeEventListener('resize', this.__resize, false)
  },

  actions: {
    onResize () {
      this.__onResize()
    },
    toggleLock () {
      this.toggleProperty('user.lockFiltersTopBar')
    }
  },

  __resize () {},

  __onResize () {
    // waiting element height is updated
    setTimeout(() => {
      if (this.element) {
        this.onResize(this.element.offsetHeight)
      }
    }, 40)
  }
});
