import Route from '@ember/routing/route'
import RouteHistoryMixin from 'ember-route-history/mixins/routes/route-history'
import { inject as service } from '@ember/service'

export default Route.extend(RouteHistoryMixin, {
  user: service('current-user'),

  queryParams: {
    'search_pseudo': {
      refreshModel: true
    },
    'sort_by': {
      refreshModel: true
    }
  },

  beforeModel () {
    const c = this.controllerFor('community')

    if (!c.__fetchData.performCount) {
      window.scroll({
        top: 0
      })
    }
  },

  model () {
    setTimeout(() => {
      const c = this.controllerFor('community')

      c.__checkFiltersValue([c.sort, c.pseudo], this.user.reset === 'community')
    })
  },

  actions: {
    willTransition ({ targetName }) {
      if (targetName !== 'community') {
        this.controller.set('isLeaving', true)
      }
    }
  }
});
