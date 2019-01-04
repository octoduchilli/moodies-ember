import Component from '@ember/component'
import { htmlSafe } from '@ember/string'
import { set } from '@ember/object'

export default Component.extend({
  tagName: 'div',
  attributeBindings: ['style'],

  value: null,
  style: null,

  onChange () {},

  didInsertElement () {
    this._super(...arguments)

    this.__setBorderColor(this.value)
  },

  didUpdateAttrs () {
    this.__setBorderColor(this.value)
  },

  actions: {
    onChange (value) {
      this.__setBorderColor(value)

      this.onChange(value)
    }
  },

  __setBorderColor (value) {
    set(this, 'style', htmlSafe(`border-color: ${value}`))
  }
})
