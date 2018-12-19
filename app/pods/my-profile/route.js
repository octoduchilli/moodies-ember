import Route from '@ember/routing/route'
import { inject as service } from '@ember/service'
import { get } from '@ember/object'

export default Route.extend({
  routeHistory: service(),
  session: service(),
  notify: service('notification-messages'),
  user: service('current-user'),

  actions: {
    didTransition () {
      if (!get(this.session, 'isAuthenticated') && !this.user.fetch.isRunning) {
        this.notify.info(`Vous n'êtes pas connecté...`)

        this.transitionTo('index')
      }
    }
  }
});
