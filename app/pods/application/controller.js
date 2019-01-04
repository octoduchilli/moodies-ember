import Controller from '@ember/controller'
import { inject as service } from '@ember/service'

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
  },

  actions: {
    scrollTop () {
      window.scroll({
        top: 0
      })
    },
    closeSideBar () {
      if (this.sideBar.isOpen) {
        this.sideBar.toggle()
      }
    }
  }
})
