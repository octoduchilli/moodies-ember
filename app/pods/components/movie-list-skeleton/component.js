import Component from '@ember/component'
import { inject as service } from '@ember/service'

export default Component.extend({
  media: service(),
  view: service(),

  tagName: 'ul',
  classNames: 'flex wrap jus-center',
});
