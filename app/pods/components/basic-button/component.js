import Component from '@ember/component';

export default Component.extend({
  tagName: 'button',
  classNames: 'work',

  pending: false,
  icon: 'check',
  label: null
});
