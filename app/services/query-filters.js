import Service from '@ember/service'
import Obj from '@ember/object'
import { set } from '@ember/object'

export default Service.extend({
  filters: Obj.create(),

  __currentRoute: null,

  setKeys (route, keys) {
    if (this.__currentRoute === route) {
      return
    }

    set(this, '__currentRoute', route)

    this.__cleanFilters()

    keys.forEach(key => {
      this.filters.reopen({[key]: ''})
    })
  },

  updateFilter (key, value, transition) {
    set(this, `filters.${key}`, value)

    if (transition) {
      this.__queryTransition()
    }
  },

  resetQuery() {
    Object.keys(this.filters).forEach(key => {
      set(this, `filters.${key}`, undefined)
    })

    this.__queryTransition()
  },

  __cleanFilters () {
    set(this, 'filters', Obj.create());
  },

  __queryTransition () {
    let filters = {}

    Object.entries(this.filters).forEach(values => {
      filters[values[0]] = values[1] || undefined
    })

    this.__currentRoute.transitionToRoute({ queryParams: filters })
  }
})
