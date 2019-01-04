import Controller from '@ember/controller'
import preloadImg from 'moodies-ember/mixins/preload-tmdb-img'
import filtersHelper from 'moodies-ember/mixins/filters-helper'
import { task, timeout, all } from 'ember-concurrency'
import { inject as service } from '@ember/service'
import { set, computed } from '@ember/object'

export default Controller.extend(preloadImg, filtersHelper, {
  queryFilters: service(),
  notify: service('notification-messages'),
  media: service(),
  view: service(),
  user: service('current-user'),
  queryKeys: null,

  topbarHeight: 0,
  scrollY: null,
  isFetchingNextPage: false,
  isLeaving: false,
  page: 1,

  text: '',
  type: null,

  totalResults: computed('items.total_results', function () {
    const items = this.items

    if (items) {
      return this.items.total_results
    } else {
      return '...'
    }
  }),

  init () {
    this._super(...arguments)

    this.type = {
      selected: {
        id: 0,
        name: 'Films (par défaut)',
        value: 'movie'
      },
      default: {
        id: 0,
        name: 'Films (par défaut)',
        value: 'movie'
      },
      key: 'search_type',
      items: [
        {
          id: 0,
          name: 'Films (par défaut)',
          value: 'movie'
        },
        {
          id: 1,
          name: 'Personnalités',
          value: 'person'
        }
      ]
    }

    this.text = {
      selected: null,
      isString: true,
      key: 'query'
    }

    this.queryKeys = ['query', 'search_type']

    this.queryFilters.setKeys(this, this.queryKeys)
  },

  actions: {
    typeUpdate (type) {
      if (type.length === 0) {
        this.queryFilters.updateFilter('search_type', null, true)
      } else {
        this.queryFilters.updateFilter('search_type', type.firstObject.value, true)
      }
    },
    resetFilters () {
      this.queryFilters.resetQuery()
    },
    actualiseFilters () {
      this.__fetchData.perform()
    },
    setScroll (scrollY) {
      set(this, 'scrollY', scrollY)

      this.__nextPage()
    },
    setTopbarHeight (height) {
      document.getElementsByClassName('search')[0].style.paddingTop = `${height}px`
    },
    updatedItems () {
      this.__nextPage()
    },
    warnViewUserButton (key) {
      if (key === 'visible') {
        this.notify.warning('Attention ! Cette option peut provoquer quelques latences.', { clearDuration: 7000 })
      }
    }
  },

  textUpdate: task(function*(text) {
    yield timeout(800)

    if (!text) {
      this.queryFilters.updateFilter('query', null, true)
    } else {
      this.queryFilters.updateFilter('query', text, true)
    }
  }).restartable(),

  __fetchData: task(function* () {
    window.scroll({
      top: 0
    })

    this.store.unloadAll('tmdb-search')

    set(this, 'scrollY', null)
    set(this, 'items', null)
    set(this, 'page', 1)

    if (!this.text.selected) {
      return
    }

    return yield all([
      timeout(750),
      this.__fetchMovies()
    ])
  }).restartable(),

  async __fetchMovies () {
    const query = this.__getQuery()

    return await this.store.queryRecord('tmdb-search', query).then(async _ => {
      await this.preloadTMDBImg(this.__getPaths(_), false)

      set(this, 'items', _)
    })
  },

  __getQuery () {
    let query = {}

    Object.entries(this.queryFilters.filters).forEach(values => {
      if (values[1]) {
        query[values[0]] = values[1]
      }
    })

    delete query['_super']

    query['page'] = this.page

    if (!query['search_type']) {
      query['type'] = 'movie'
    } else {
      query['type'] = query['search_type']
    }

    return query
  },

  __nextPage () {
    if (!this.isFetchingNextPage && this.items) {
      const page = this.page
      const totalPages = this.items.total_pages
      const { offsetTop, offsetHeight } = document.getElementsByClassName('search-item-list')[0]
      const bottomPosition = offsetTop + offsetHeight

      if (page < totalPages) {
        if (bottomPosition - window.innerHeight * 3 <= window.innerHeight + window.scrollY) {
          this.incrementProperty('page')

          this.__fetchNextPage()
        }
      }
    }
  },

  async __fetchNextPage () {
    set(this, 'isFetchingNextPage', true)

    const query = this.__getQuery()

    await this.store.queryRecord('tmdb-search', query).then(async _ => {
      await this.preloadTMDBImg(this.__getPaths(_), false)

      if (this.items) {
        set(this, 'items.results', this.items.results.concat(_.results))
      }
    })

    return set(this, 'isFetchingNextPage', false)
  },

  __getPaths (items) {
    return items.results.map(result => result.poster_path || result.profile_path)
  }
})
