import Route from '@ember/routing/route'
import RouteHistoryMixin from 'ember-route-history/mixins/routes/route-history'

export default Route.extend(RouteHistoryMixin, {
  // cannot use primary_release_date.gte as key name, same for primary_release_date.lte
  queryParams: {
    'with_genres': {
      refreshModel: true
    },
    'sort_by': {
      refreshModel: true
    },
    'vote_count_gte': {
      refreshModel: true
    },
    'primary_release_date_gte': {
      refreshModel: true
    },
    'primary_release_date_lte': {
      refreshModel: true
    }
  },

  model () {
    setTimeout(() => {
      this.controllerFor('discover').__checkFiltersValue()
    })
  },

  actions: {
    willTransition ({ targetName }) {
      if (targetName !== 'discover') {
        this.controller.set('isLeaving', true)
      }
    }
  }
});
