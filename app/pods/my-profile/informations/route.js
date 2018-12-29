import Route from '@ember/routing/route'
import RouteHistoryMixin from 'ember-route-history/mixins/routes/route-history'
import { inject as service } from '@ember/service'

export default Route.extend(RouteHistoryMixin, {
  media: service(),
  user: service('current-user'),

  beforeModel () {
    window.scroll({
      top: 0
    })
  },

  setupController (controller, model) {
    this._super(controller, model)

    if (this.user.fetch.isRunning || this.user.fetch.performCount) {
      controller.initStatistics.perform()
    }
  }
});
