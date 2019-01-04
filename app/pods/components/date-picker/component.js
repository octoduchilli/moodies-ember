import Component from '@ember/component'
import moment from 'moment';
import { set } from '@ember/object'
import { oneWay } from '@ember/object/computed';

export default Component.extend({
  tagName: 'div',
  classNames: 'flex ali-center',

  isOpen: false,

  min: null,
  max: null,

  value: null,

  uid: oneWay('elementId'),

  __picker: null,

  dateUpdate: () => {},

  onClick () {},

  click () {
    set(this, 'isOpen', true)
  },

  didInsertElement () {
    this._super(...arguments)

    const $input = this.$(`#${this.elementId}-date-picker`).pickadate({
      monthsFull: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
      weekdaysShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
      today: 'Aujourd\'hui',
      clear: '',
      close: 'Fermer',
      format: 'dd mmmm yyyy',
      formatSubmit: 'yyyy-mm-dd',
      selectYears: 150,
      selectMonths: true,
      max: new Date(2025, 1, 1),
      klass: {
        holder: `${this.styleNamespace}__picker-holder picker__holder`
      },
      onSet: ({ select }) => {
        if (select && select !== Number(this.value)) {
          this.dateUpdate(select)
        }
      },
      onOpen: () => {
        this.onClick(true)
      },
      onClose: () => {
        this.onClick(false)
      }
    })

    const picker = $input.pickadate('picker')

    picker.on({
      open: this.isOpen,
      close: this.isOpen
    })

    if (this.value) {
      picker.set('select', Number(this.value))
    }

    set(this, '__picker', picker)

    this.__updateMinMax()
  },

  didUpdateAttrs() {
    const value = this.value
    const picker = this.__picker

    picker.set('select', Number(value))

    if (!value && picker) {
      picker.$node.val('')
    }

    this.__updateMinMax()
  },

  actions: {
    clear () {
      this.dateUpdate(null)
    }
  },

  __updateMinMax() {
    const min = this.min
    const max = this.max
    const picker = this.__picker

    if (max) {
      picker.set('max', moment(Number(max)).toDate())
    } else {
      picker.set('max', false)
    }

    if (min) {
      picker.set('min', moment(Number(min)).toDate())
    } else {
      picker.set('min', false)
    }
  }
});
