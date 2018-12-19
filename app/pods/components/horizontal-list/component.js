import Component from '@ember/component';

export default Component.extend({
  classNames: 'flex work',

  init () {
    this._super(...arguments)
  },

  onClick () {},

  actions: {
    sendClickAction () {
      this.onClick()
    }
  }
});
