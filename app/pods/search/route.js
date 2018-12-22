import Route from '@ember/routing/route'
import RouteHistoryMixin from 'ember-route-history/mixins/routes/route-history'

export default Route.extend(RouteHistoryMixin, {
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
      this.controllerFor('search').__checkFiltersValue()
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