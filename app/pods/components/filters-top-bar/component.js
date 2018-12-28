import Component from '@ember/component';

export default Component.extend({
  tagName: 'div',
  classNames: 'flex wrap work',
  classNameBindings: ['lock:is--locked'],

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

    this.__updateLockPos(true)
  },

  willDestroyElement () {
    window.removeEventListener('resize', this.__resize, false)
  },

  actions: {
    onResize () {
      this.__onResize()
    },
    toggleLock () {
      this.toggleProperty('lock')

      this.__updateLockPos()
    }
  },

  __resize () {},

  __onResize () {
    // waiting element height is updated
    setTimeout(() => {
      this.onResize(this.element.offsetHeight)
    }, 40)
  },

  __updateLockPos(firstInit) {
    const element = document.getElementsByClassName('div-lock-icon')[0]

    if (this.lock) {
      if (!firstInit) {
        element.style.top = `${element.offsetTop + 70}px`
      } else {
        element.style.top = `${element.offsetTop + 6}px`
      }
      element.style.bottom = null
      element.style.position = 'fixed'
    } else {
      element.style.top = null
      element.style.bottom = '10px'
      element.style.position = 'absolute'
    }
  }
});
