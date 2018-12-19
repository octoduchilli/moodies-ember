import Component from '@ember/component';

export default Component.extend({
  tagName: 'div',
  classNames: 'work',

  click () {
    if (this.totalResults === undefined) {
      this.onClick()
    }
  }
});
