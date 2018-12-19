import Component from '@ember/component'
import { inject as service } from '@ember/service'

export default Component.extend({
  tagName: 'ul',
  classNames: 'flex col',

  session: service(),
  notify: service('notification-messages'),

  actions: {
    notifyNotConnected () {
      this.notify.info(`Vous n'êtes pas connecté...`)
    }
  }
});
