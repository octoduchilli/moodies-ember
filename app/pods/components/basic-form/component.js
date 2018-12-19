import Component from '@ember/component';

export default Component.extend({
  tagName: 'form',
  classNames: 'flex col work',

  legend: null,

  onSubmit () {},

  submit () {
    this.onSubmit()
  },

  didInsertElement () {
    this._super(...arguments)

    this.__pressEnter = this.__onPressEnter.bind(this)

    this.element.addEventListener('keypress', this.__pressEnter, false)
  },

  willDestroyElement () {
    this.element.addEventListener('keypress', this.__pressEnter, false)
  },

  __pressEnter () {},

  __onPressEnter ({ code }) {
    if (code === 'Enter') {
      this.onSubmit()
    }
  }
});
