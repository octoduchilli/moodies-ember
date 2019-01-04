import Component from '@ember/component';
import { set } from '@ember/object';

export default Component.extend({
  tagName: 'ul',
  classNames: 'work',
  classNameBindings: ['isOpen:is--opened:is--closed'],

  isOpen: false,
  options: null,

  selected: null,

  onChange () {},

  click () {
    this.toggleProperty('isOpen')
  },

  mouseLeave () {
    set(this, 'isOpen', false)
  },

  actions: {
    selectOption (key) {
      const isOpen = this.isOpen

      if (isOpen) {
        if (key !== this.selected) {
          set(this, 'selected', key)

          this.onChange(key)

          this.__orderOptions(key)
        }
      }
    }
  },

  __orderOptions(key) {
    const options = this.options

    const orderedOptions = Object.assign({}, {[key]: options[key]}, options)

    set(this, 'options', orderedOptions)
  }
});
