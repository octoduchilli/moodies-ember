import Controller from '@ember/controller'
import { inject as service } from '@ember/service'
import { set } from '@ember/object'

export default Controller.extend({
  sideBar: service(),
  notify: service('notification-messages'),
  media: service(),
  view: service(),

  init () {
    this._super(...arguments)

    this.notify.setDefaultAutoClear(true)
    this.notify.setDefaultClearDuration(4000)

    this.view.userButtonOptions = {
      basic: {
        name: 'Boutons classiques'
      },
      visible: {
        name: 'Boutons visibles'
      }
    }

    this.view.listOptions = {
      basic: {
        name: 'Liste classique'
      },
      details: {
        name: 'Liste détaillée'
      }
    }

    setTimeout(() => {
      this.__click = this.__onClick.bind(this)
      this.__resize = this.__onResize.bind(this)

      document.getElementById('app').addEventListener('click', this.__click, false)
      document.getElementById('app').addEventListener('resize', this.__resize, false)

      this.__resize()
    }, 300)
  },

  actions: {
    scrollTop () {
      window.scroll({
        top: 0
      })
    }
  },

  __click () {},
  __resize() {},

  __onClick () {
    if (this.sideBar.isOpen) {
      this.sideBar.toggle()
    }
  },

  __onResize () {
    if (this.media.isMobile) {
      set(this.view, 'userButton', 'visible')
    }
  }
})
