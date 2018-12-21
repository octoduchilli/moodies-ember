import Component from '@ember/component';

export default Component.extend({
  tagName: 'div',
  classNameBindings: ['check:is--checked'],

  check: false,

  onCheck () {},

  click () {
    this.toggleProperty('check')

    this.onCheck(this.check)
  }
});
