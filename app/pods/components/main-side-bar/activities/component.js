import Component from '@ember/component'
import { inject as service } from '@ember/service'

export default Component.extend({
  tagName: 'ul',

  router: service(),
  user: service('current-user'),

  actions: {
    transitionToActivity (activity) {
      this.router.transitionTo(activity.type, activity.id, { queryParams: activity.query})
    }
  }
})
