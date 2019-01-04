import Route from '@ember/routing/route'
import { inject as service } from '@ember/service'

export default Route.extend({
  user: service('current-user'),

  queryParams: {
    'sort_by': {
      refreshModel: true
    }
  },

  model () {
    setTimeout(() => {
      const c = this.controllerFor('my-profile.votes')

      c.__waitUserFetch.perform()
    })
  },

  actions: {
    willTransition ({ targetName }) {
      if (targetName !== 'my-profile.votes') {
        this.controller.set('isLeaving', true)
      }
    }
  }
});
