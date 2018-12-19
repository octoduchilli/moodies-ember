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
    'show_lists': {
      refreshModel: true
    },
    'refine_by': {
      refreshModel: true
    }
  },

  model () {
    setTimeout(() => {
      this.controllerFor('my-profile.my-lists').__checkFiltersValue.perform()
    })
  },

  actions: {
    willTransition ({ targetName }) {
      if (targetName !== 'my-profile.my-lists') {
        this.controller.set('isLeaving', true)
      }
    }
  }
});
