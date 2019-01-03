import Route from '@ember/routing/route';

export default Route.extend({
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
    this.controllerFor('users.lists').fetch.perform(this.modelFor('users').id)

    setTimeout(() => {
      this.controllerFor('users.lists').__checkFiltersValue.perform()
    })
  },

  actions: {
    willTransition ({ targetName }) {
      if (targetName !== 'users.lists') {
        this.controller.set('isLeaving', true)
      }
    }
  }
});
