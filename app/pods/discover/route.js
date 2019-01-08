import Route from '@ember/routing/route'
import RouteHistoryMixin from 'ember-route-history/mixins/routes/route-history'
import { inject as service } from '@ember/service'

export default Route.extend(RouteHistoryMixin, {
  user: service('current-user'),
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
      const c = this.controllerFor('discover')

      c.__checkFiltersValue([c.sort, c.genres, c.releaseGte, c.releaseLte, c.vote], this.user.reset === 'discover')
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
