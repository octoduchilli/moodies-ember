import Component from '@ember/component';

export default Component.extend({
  tagName: 'div',

  classNames: 'close--on-click work',

  title: null,

  pending: null,

  close () {},

  confirm () {},

  click (e) {
    if (e.target.className.indexOf('close--on-click') !== -1 && !this.pending) {
      this.close()
    }
  }
});
