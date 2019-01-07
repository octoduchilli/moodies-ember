import Route from '@ember/routing/route'

export default Route.extend({
  queryParams: {
    'sort_by': {
      refreshModel: true
    }
  },

  model () {
    const c = this.controllerFor('users.votes')

    c.fetch.perform(this.modelFor('users').id)

    setTimeout(() => {
      c.__waitFetch.perform()
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
