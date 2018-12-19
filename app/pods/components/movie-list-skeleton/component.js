import Component from '@ember/component'
import { inject as service } from '@ember/service'

export default Component.extend({
  view: service(),

  tagName: 'ul',
  classNames: 'flex wrap jus-center',
});
