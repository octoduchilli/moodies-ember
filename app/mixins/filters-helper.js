import Mixin from '@ember/object/mixin'
import moment from 'moment'
import { set, get } from '@ember/object'

export default Mixin.create({
  __checkFiltersValue (array) {
    array.forEach(filter => {
      const value = get(this, filter.key)

      set(filter, 'selected', null)

      if (value) {
        if (filter.isString) {
          set(filter, 'selected', value)
        } else if (filter.isDate) {
          const date = moment(value).format('x')

          if (Number(filter.selected) !== Number(date)) {
            set(filter, 'selected', date)
          }
        } else if (filter.multipleSelect) {
          const items = value.split(',').map(value => {
            if (filter.itemsKey) {
              return get(this, filter.itemsKey).findBy('value', Number(value) || value)
            } else {
              return filter.items.findBy('value', Number(value) || value)
            }
          }).filter(value => value)

          set(filter, 'selected', items)
        } else {
          let item

          if (filter.itemsKey) {
            item = get(this, filter.itemsKey).findBy('value', value)
          } else {
            item = filter.items.findBy('value', value)
          }

          if (item) {
            set(filter, 'selected', item)
          }
        }
      }

      if (filter.default) {
        set(filter, 'selected', filter.default)
      }
    })

    if (!this.isLeaving) {
      this.__checkQueryFilters()
    } else {
      set(this, 'isLeaving', false)
    }
  },

  __checkQueryFilters () {
    this.queryKeys.forEach(key => {
      const value = get(this, key)

      if (value) {
        this.queryFilters.updateFilter(key, value)
      } else {
        this.queryFilters.updateFilter(key, null)
      }
    })

    this.__fetchData.perform()
  },
});
