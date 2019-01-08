import Route from '@ember/routing/route'
import RouteHistoryMixin from 'ember-route-history/mixins/routes/route-history'
import { inject as service } from '@ember/service'

export default Route.extend(RouteHistoryMixin, {
  user: service('current-user'),

  queryParams: {
    'query': {
      refreshModel: true
    },
    'search_type': {
      refreshModel: true
    }
  },

  model () {
    setTimeout(() => {
      const c = this.controllerFor('search')

      c.__checkFiltersValue([c.text, c.type], this.user.reset === 'search')
    })
  },

  actions: {
    willTransition ({ targetName }) {
      if (targetName !== 'search') {
        this.controller.set('isLeaving', true)
      }
    }
  }
});
