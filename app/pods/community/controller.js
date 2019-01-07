import Controller from '@ember/controller'
import preloadImg from 'moodies-ember/mixins/preload-tmdb-img'
import filtersHelper from 'moodies-ember/mixins/filters-helper'
import { task, timeout, all } from 'ember-concurrency'
import { inject as service } from '@ember/service'
import { set } from '@ember/object'

export default Controller.extend(filtersHelper, preloadImg, {
  queryFilters: service(),

  isLeaving: false,
  isFetchingNextPage: false,

  activityList: null,

  sort: null,
  pseudo: null,

  page: 1,
  scrollY: null,

  init () {
    this._super(...arguments)

    this.sort = {
      selected: null,
      key: 'sort_by',
      items: [
        {
          id: 0,
          name: 'Dernière apparition ↗ (par défaut)',
          value: 'lastConnectionInverse'
        },
        {
          id: 1,
          name: 'Dernière apparition ↘',
          value: 'lastConnection'
        },
        {
          id: 2,
          name: 'Pseudo de A à Z',
          value: 'pseudoLower'
        },
        {
          id: 3,
          name: 'Pseudo de Z à A',
          value: 'pseudoLowerInverse'
        },
        {
          id: 4,
          name: 'Nombre de films ↗',
          value: 'totalMoviesInverse'
        },
        {
          id: 5,
          name: 'Nombre de films ↘',
          value: 'totalMovies'
        }
      ]
    }

    this.pseudo = {
      selected: null,
      isString: true,
      key: 'search_pseudo'
    }

    this.queryKeys = ['sort_by', 'search_pseudo']

    this.queryFilters.setKeys(this, this.queryKeys)
  },

  actions: {
    sortUpdate (sort) {
      if (sort.length === 0) {
        this.queryFilters.updateFilter('sort_by', null, true)
      } else {
        this.queryFilters.updateFilter('sort_by', sort.firstObject.value, true)
      }
    },
    resetFilters () {
      this.queryFilters.resetQuery()
    },
    actualiseFilters () {
      this.store.unloadAll('fb-community-user')

      this.__fetchData.perform()
    },
    setScroll (scrollY) {
      set(this, 'scrollY', scrollY)

      this.__nextPage()
    },
    updatedItems () {
      this.__nextPage()
    }
  },

  pseudoUpdate: task(function*(pseudo) {
    yield timeout(800)

    if (!pseudo) {
      this.queryFilters.updateFilter('search_pseudo', null, true)
    } else {
      this.queryFilters.updateFilter('search_pseudo', pseudo, true)
    }
  }).restartable(),

  __fetchData: task(function* () {
    set(this, 'users', null)
    set(this, 'page', 1)

    return yield all([
      timeout(750),
      this.__fetchUsers()
    ])
  }).restartable(),

  async __fetchUsers () {
    const query = this.__getQuery()

    return await this.store.query('fb-community-user', query).then(async users => {
      await this.preloadTMDBImg(this.__getPaths(users), false)

      set(this, 'users', users)
    })
  },

  __getQuery () {
    let query = {
      limitToFirst: 10 * this.page
    }

    if (this.pseudo.selected) {
      query.orderBy = 'pseudoLower'
      query.startAt = this.pseudo.selected
      query.endAt = this.pseudo.selected + '\uf8ff'

      return query
    }

    if (this.sort.selected) {
      query.orderBy = this.sort.selected.value
    } else {
      query.orderBy = 'lastConnectionInverse'
    }

    return query
  },

  __nextPage () {
    if (!this.isFetchingNextPage && this.users) {
      const { offsetTop, offsetHeight } = document.getElementsByClassName('user-list')[0]
      const bottomPosition = offsetTop + offsetHeight

      if (bottomPosition - window.innerHeight * 3 <= window.innerHeight + window.scrollY) {
        this.incrementProperty('page')

        this.__fetchNextPage()
      }
    }
  },

  async __fetchNextPage () {
    set(this, 'isFetchingNextPage', true)

    await this.__fetchUsers()

    return set(this, 'isFetchingNextPage', false)
  },

  __getPaths (items) {
    return items.map(item => {
      if (item.profileImg && item.profileImg.path) {
        return item.profileImg.path
      }
    })
  }
})
