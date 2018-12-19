import Component from '@ember/component'
import { set } from '@ember/object'

export default Component.extend({
  tagName: 'div',

  classNameBindings: ['isFocusing:is--focusing', 'error:have--error'],

  type: 'text',
  placeholder: null,

  value: null,
  error: null,

  label: null,
  dasherizedLabel: null,

  isFocusing: false,

  maxlength: null,

  init () {
    this._super(...arguments)

    this.dasherizedLabel = this.label.dasherize()
  },

  keyPress ({ key }) {
    if (key !== 'Enter') {
      set(this, 'error', null)
    }
  },

  focusIn () {
    set(this, 'isFocusing', true)
  },

  focusOut () {
    set(this, 'isFocusing', false)
  }
});
