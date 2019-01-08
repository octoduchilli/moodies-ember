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
    const c = this.controllerFor('users.lists')

    c.fetch.perform(this.modelFor('users').id)

    setTimeout(() => {
      c.__waitFetch.perform()
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
