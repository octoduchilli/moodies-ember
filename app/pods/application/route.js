import Route from '@ember/routing/route'
import RouteHistoryMixin from 'ember-route-history/mixins/routes/route-history'
import { inject as service } from '@ember/service'
import { get } from '@ember/object'

export default Route.extend(RouteHistoryMixin, {
  session: service(),
  moment: service(),
  user: service('current-user'),

  async beforeModel () {
    this.moment.setLocale('fr')

    await this.session.fetch().catch(function () {})

    if (get(this.session, 'isAuthenticated')) {
      this.user.fetch.perform()
    }
  },

  redirect(model, transition) {
    if (transition.targetName === 'index'){
      return this.transitionTo('discover')
    }
  }
});
