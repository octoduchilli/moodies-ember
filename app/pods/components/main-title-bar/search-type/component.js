import Component from '@ember/component';
import { set } from '@ember/object';

export default Component.extend({
  tagName: 'ul',
  classNames: 'work',
  classNameBindings: ['isOpen:is--opened:is--closed'],

  isOpen: false,
  options: null,
  selected: 'movie',

  init () {
    this._super(...arguments)

    this.options = {
      movie: {
        name: 'Films'
      },
      person: {
        name: 'Personnalités'
      }
    }
  },

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
        set(this, 'selected', key)

        this.__orderOptions(key)
      }
    }
  },

  __orderOptions(key) {
    const options = this.options

    const orderedOptions = Object.assign({}, {[key]: options[key]}, options)

    set(this, 'options', orderedOptions)
  }
});
