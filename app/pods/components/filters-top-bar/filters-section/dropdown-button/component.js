import Component from '@ember/component'
import { set } from '@ember/object'

export default Component.extend({
  tagName: 'div',
  classNames: 'filter flex ali-center',
  classNameBindings: ['isOpen:is--opened:is--closed'],

  isOpen: false,

  type: null,

  value: null,

  label: null,
  smallLabel: null,
  computedLabel: null,

  multipleSelect: false,

  items: null,

  onSelect () {},
  onResize () {},

  mouseLeave () {
    set(this, 'isOpen', false)

    this.__updateMinWidth()
    this.onResize()
  },

  init () {
    this._super(...arguments)

    this.__initIsSelectedAttr()
  },

  didInsertElement () {
    this._super(...arguments)

    this.onResize()
  },

  didUpdateAttrs() {
    this.__initIsSelectedAttr()

    if (this.value !== null) {

      if (this.multipleSelect) {
        this.value.forEach(item => {
          set(item, 'isSelected', true)
        })
      } else {
        set(this, 'value.isSelected', true)
      }
    }

    // Resize is called by this component because the dropdown select label could resize the filters topbar height
    this.onResize()
    this.__initComputedLabel()
  },

  actions: {
    selectOrDeselect (index) {
      let item = this.items[index]

      if (!this.multipleSelect) {
        if (item.isSelected) {
          set(item, 'isSelected', false)
        } else {
          this.__deselectAllItems()

          set(item, 'isSelected', true)
        }
      } else {
        if (item.isSelected) {
          set(item, 'isSelected', false)
        } else {
          set(item, 'isSelected', true)
        }
      }

      this.__sendOnSelect()
    },
    openOrClose () {
      this.toggleProperty('isOpen')

      this.__updateMinWidth()
      this.onResize()
    }
  },

  __sendOnSelect () {
    const selectedItems = this.items.filterBy('isSelected')

    this.onSelect(selectedItems)
  },

  __deselectAllItems () {
    this.items.forEach(item => {
      set(item, 'isSelected', false)
    })
  },

  __initComputedLabel () {
    let label = ''

    this.items.forEach(item => {
      if (item.isSelected) {
        label += `${item.name} - `
      }
    })

    label = label.substr(0, label.length - 3)

    set(this, 'computedLabel', label)
  },

  __initIsSelectedAttr () {
    this.items.forEach(item => {
      set(item, 'isSelected', false)
    })
  },

  __updateMinWidth () {
    let element = this.element
    let list = this.element.getElementsByClassName('item-list')[0]

    if (this.isOpen) {
      if (list.offsetWidth > 300) {
        element.style.minWidth = '300px'
      } else {
        // + 1 is disable the text-overflow when the label is length lower than text items
        element.style.minWidth = `${list.offsetWidth + 1}px`
      }

      list.style.width = '100%'
    } else {
      element.style.minWidth = null

      list.style.width = null
    }
  }
});
