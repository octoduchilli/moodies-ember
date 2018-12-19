import Component from '@ember/component'
import { set } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: 'div',
  classNames: 'flex ali-center',

  store: service(),

  searchText: '',
  searchType: 'movie',

  typeOptions: null,

  fetch: null,

  init () {
    this._super(...arguments)

    this.typeOptions = {
      movie: {
        name: 'Films'
      },
      person: {
        name: 'Personnalités'
      }
    }
  },

  mouseLeave () {
    set(this, 'fetch', null)
  },

  actions: {
    search () {
      const text = this.searchText
      const type = this.searchType

      if (text) {
        this.store.queryRecord('tmdb-search', { type: type, query: text }).then(fetch => {
          set(this, 'fetch', fetch)
        })
      } else {
        set(this, 'fetch', null)
      }
    },
    resetFetch () {
      set(this, 'fetch', null)
    }
  }
})
