import Controller from '@ember/controller'
import preloadImg from 'moodies-ember/mixins/preload-tmdb-img'
import moment from 'moment'
import genres from 'moodies-ember/data/genres'
import { task, timeout, all } from 'ember-concurrency'
import { inject as service } from '@ember/service'
import { get, set, computed } from '@ember/object'

export default Controller.extend(preloadImg, {
  queryFilters: service(),
  notify: service('notification-messages'),
  view: service(),
  user: service('current-user'),
  queryKeys: null,

  filtersBarLock: false,

  topbarHeight: 0,
  scrollY: null,
  isFetchingNextPage: false,
  isLeaving: false,
  page: 1,

  genresItems: null,
  sortItems: null,
  voteItems: null,
  releaseGte: null,
  releaseLte: null,
  genres: null,
  sort: null,
  vote: null,
  movies: null,

  totalResults: computed('movies.total_results', function () {
    const movies = this.movies

    if (movies) {
      return this.movies.total_results
    } else {
      return '...'
    }
  }),

  init () {
    this._super(...arguments)

    this.genresItems = genres

    this.sortItems = [
      {
        id: 0,
        name: 'Par défaut (popularité)',
        value: 'popularity.desc'
      },
      {
        id: 1,
        name: 'Notes',
        value: 'vote_average.desc'
      },
      {
        id: 2,
        name: 'Nombre de votes',
        value: 'vote_count.desc'
      },
      {
        id: 3,
        name: 'Recettes',
        value: 'revenue.desc'
      },
      {
        id: 4,
        name: 'Date de réalisation ↗',
        value: 'release_date.desc'
      },
      {
        id: 5,
        name: 'Date de réalisation ↘',
        value: 'release_date.asc'
      }
    ]

    this.voteItems = []

    for (let i = 0; i < 201; i++) {
      this.voteItems.push({
        id: i,
        name: `${i * 50} votes`,
        value: i * 50
      })
    }

    this.queryKeys = ['with_genres', 'sort_by', 'vote_count_gte', 'primary_release_date_gte', 'primary_release_date_lte']

    this.queryFilters.setKeys(this, this.queryKeys)
  },

  actions: {
    dateUpdate (from, date) {
      if (date) {
        this.__update(`primary_release_date_${from.toLowerCase()}`, moment(date).format('YYYY-MM-DD'))
      } else {
        this.__update(`primary_release_date_${from.toLowerCase()}`, null)
      }
    },
    sortUpdate (sort) {
      if (sort.length === 0) {
        this.__update('sort_by', null)
      } else {
        const value = sort.firstObject.value

        if (value !== 'vote_average.desc' && this.queryFilters.filters['vote_count_gte']) {
          this.queryFilters.updateKeys('vote_count_gte', null)
        }

        this.__update('sort_by', value)
      }
    },
    voteUpdate (vote) {
      if (vote.length === 0) {
        this.__update('vote_count_gte', null)
      } else {
        this.__update('vote_count_gte', vote.firstObject.value)
      }
    },
    genresUpdate (genres) {
      let str = ''

      genres.forEach(genre => {
        str += `${genre.value},`
      })

      str = str.substr(0, str.length - 1)

      this.__update('with_genres', str)
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

  __updatePaddingTop () {
    document.getElementsByClassName('discover')[0].style.paddingTop = `${this.topbarHeight}px`
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
    // needed settimeout or this.xxx will be undefined
    setTimeout(() => {
      if (this.primary_release_date_gte) {
        const release = moment(this.primary_release_date_gte).format('x')

        if (Number(this.releaseGte) !== Number(release)) {
          set(this, 'releaseGte', release)
        }
      } else {
        set(this, 'releaseGte', null)
      }

      if (this.primary_release_date_lte) {
        const release = moment(this.primary_release_date_lte).format('x')

        if (Number(this.releaseLte) !== Number(release)) {
          set(this, 'releaseLte', release)
        }
      } else {
        set(this, 'releaseLte', null)
      }

      if (this.with_genres) {
        const genresValue = this.with_genres.split(',')
        const genresItems = genresValue.map(value => this.genresItems.findBy('value', Number(value)))

        set(this, 'genres', genresItems)
      } else {
        set(this, 'genres', null)
      }

      if (this.sort_by) {
        const sortItem = this.sortItems.findBy('value', this.sort_by)

        //call didUpdateAttrs in filters-top-bar/filters-section/dropdown-button component
        set(this, 'sort', null)

        set(this, 'sort', sortItem)
      } else {
        set(this, 'sort', null)
      }

      if (this.vote_count_gte) {
        const voteItem = this.voteItems.findBy('value', Number(this.vote_count_gte))

        //call didUpdateAttrs in filters-top-bar/filters-section/dropdown-button component
        set(this, 'vote', null)

        set(this, 'vote', voteItem)
      } else {
        set(this, 'vote', null)
      }

      if (this.user.reset === 'discover') {
        set(this.user, 'reset', null)

        set(this, 'isLeaving', false)
      }

      if (!this.isLeaving) {
        this.__checkQueryFilters()
      } else {
        set(this, 'isLeaving', false)
      }
    })
  },

  __fetchData: task(function* () {
    window.scroll({
      top: 0
    })

    this.__destroyRecords()

    set(this, 'scrollY', null)
    set(this, 'movies', null)
    set(this, 'page', 1)

    return yield all([
      timeout(750),
      this.__fetchMovies()
    ])
  }).restartable(),

  async __fetchMovies () {
    const query = this.__getQuery()

    return await this.store.queryRecord('tmdb-discover', query).then(async _ => {
      await this.preloadTMDBImg(this.__getPaths(_), false)

      set(this, 'movies', _)
    })
  },

  __getQuery () {
    let query = {}

    // transform ...date_gte to ...date.gte and ...date_lte to ...date.lte and etc.
    Object.entries(this.queryFilters.filters).forEach(values => {
      if (values[0] === 'primary_release_date_gte' && values[1]) {
        query['primary_release_date.gte'] = values[1]
      } else if (values[0] === 'primary_release_date_lte' && values[1]) {
        query['primary_release_date.lte'] = values[1]
      } else if (values[0] === 'vote_count_gte' && values[1]) {
        query['vote_count.gte'] = values[1]
      } else if (values[1]) {
        query[values[0]] = values[1]
      }
    })

    delete query['_super']

    query['page'] = this.page

    return query
  },

  __nextPage () {
    if (!this.isFetchingNextPage && this.movies) {
      const page = this.page
      const totalPages = this.movies.total_pages
      const { offsetTop, offsetHeight } = document.getElementsByClassName('movie-list')[0]
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

    await this.store.queryRecord('tmdb-discover', query).then(async _ => {
      await this.preloadTMDBImg(this.__getPaths(_), false)

      if (this.movies) {
        set(this, 'movies.results', this.movies.results.concat(_.results))
      }
    })

    return set(this, 'isFetchingNextPage', false)
  },

  __destroyRecords () {
    this.store.unloadAll('tmdb-discover')
  },

  __getPaths (movies) {
    return movies.results.map(result => result.poster_path)
  }
})
