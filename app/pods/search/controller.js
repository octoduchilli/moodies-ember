import Controller from '@ember/controller'
import preloadImg from 'moodies-ember/mixins/preload-tmdb-img'
import { task, timeout, all } from 'ember-concurrency'
import { inject as service } from '@ember/service'
import { get, set, computed } from '@ember/object'

export default Controller.extend(preloadImg, {
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
  typeItems: null,

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

    this.typeItems = [
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

    this.type = this.typeItems[0]

    this.queryKeys = ['query', 'search_type']

    this.queryFilters.setKeys(this, this.queryKeys)
  },

  actions: {
    typeUpdate (type) {
      if (type.length === 0) {
        this.__update('search_type', null)
      } else {
        this.__update('search_type', type.firstObject.value)
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
      set(this, 'topbarHeight', height)

      this.__updatePaddingTop()
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
      this.__update('query', null)
    } else {
      this.__update('query', text)
    }
  }).restartable(),

  __updatePaddingTop () {
    document.getElementsByClassName('search')[0].style.paddingTop = `${this.topbarHeight}px`
  },

  __update (key, value) {
    this.queryFilters.updateKeys(key, value)

    this.queryFilters.transition()
  },

  __checkQueryFilters () {
    this.queryKeys.forEach(key => {
      const value = get(this, key)

      if (value) {
        this.queryFilters.updateKeys(key, value)
      } else {
        this.queryFilters.updateKeys(key, null)
      }
    })

    this.__fetchData.perform()
  },

  __checkFiltersValue () {
    // Called by the route with refresh queryParams
    if (this.query) {
      set(this, 'text', null)

      set(this, 'text', this.query)
    } else {
      set(this, 'text', null)
    }

    if (this.search_type) {
      const typeItem = this.typeItems.findBy('value', this.search_type)

      set(this, 'type', null)

      if (typeItem) {
        set(this, 'type', typeItem)
      }
    } else {
      set(this, 'type', this.typeItems.firstObject)
    }

    if (this.user.reset === 'search') {
      set(this.user, 'reset', null)

      set(this, 'isLeaving', false)
    }

    if (!this.isLeaving) {
      this.__checkQueryFilters()
    } else {
      set(this, 'isLeaving', false)
    }
  },

  __fetchData: task(function* () {
    window.scroll({
      top: 0
    })

    this.__destroyRecords()

    set(this, 'scrollY', null)
    set(this, 'items', null)
    set(this, 'page', 1)

    if (!this.text) {
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

  __destroyRecords () {
    this.store.unloadAll('tmdb-search')
  },

  __getPaths (items) {
    return items.results.map(result => result.poster_path || result.profile_path)
  }
})
