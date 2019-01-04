import Controller from '@ember/controller'
import { inject as service } from '@ember/service'
import { htmlSafe } from '@ember/string'

export default Controller.extend({
  media: service(),
  user: service('current-user'),

  actions: {
    style (value, attr) {
      return htmlSafe(`${attr}: ${value}`)
    }
  }
})
