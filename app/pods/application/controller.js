import Controller from '@ember/controller'
import { inject as service } from '@ember/service'

export default Controller.extend({
  notify: service('notification-messages'),
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
    }
  }
})
