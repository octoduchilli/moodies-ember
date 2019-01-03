import Route from '@ember/routing/route'

export default Route.extend({
  queryParams: {
    'sort_by': {
      refreshModel: true
    }
  },

  model () {
    this.controllerFor('users.votes').fetch.perform(this.modelFor('users').id)

    setTimeout(() => {
      this.controllerFor('users.votes').__checkFiltersValue.perform()
    })
  },

  actions: {
    willTransition ({ targetName }) {
      if (targetName !== 'users.votes') {
        this.controller.set('isLeaving', true)
      }
    }
  }
});
