import Component from '@ember/component'
import { inject as service } from '@ember/service'

export default Component.extend({
  user: service('current-user'),

  tagName: 'div',
  classNames: 'work',

  searchType: null,

  click () {
    if (this.totalResults === undefined) {
      this.onClick()
    }
  }
});
