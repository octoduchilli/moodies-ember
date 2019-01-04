import Controller from '@ember/controller'
import preloadImg from 'moodies-ember/mixins/preload-tmdb-img'
import filtersHelper from 'moodies-ember/mixins/filters-helper'
import moment from 'moment'
import genres from 'moodies-ember/data/genres'
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

  scrollY: null,
  isFetchingNextPage: false,
  isLeaving: false,
  page: 1,

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

    this.sort = {
      selected: null,
      key: 'sort_by',
      items: [
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
    }

    this.genres = {
      selected: null,
      multipleSelect: true,
      key: 'with_genres',
      items: genres
    }

    this.releaseGte = {
      selected: null,
      isDate: true,
      key: 'primary_release_date_gte'
    }

    this.releaseLte = {
      selected: null,
      isDate: true,
      key: 'primary_release_date_lte'
    }

    this.vote = {
      selected: null,
      key: 'vote_count_gte',
      items: []
    }

    for (let i = 0; i < 201; i++) {
      this.vote.items.push({
        id: i,
        name: `${i * 50} votes`,
        value: String(i * 50)
      })
    }

    this.queryKeys = ['with_genres', 'sort_by', 'vote_count_gte', 'primary_release_date_gte', 'primary_release_date_lte']

    this.queryFilters.setKeys(this, this.queryKeys)
  },

  actions: {
    dateUpdate (from, date) {
      if (date) {
        this.queryFilters.updateFilter(`primary_release_date_${from.toLowerCase()}`, moment(date).format('YYYY-MM-DD'), true)
      } else {
        this.queryFilters.updateFilter(`primary_release_date_${from.toLowerCase()}`, null, true)
      }
    },
    sortUpdate (sort) {
      if (sort.length === 0) {
        this.queryFilters.updateFilter('sort_by', null, true)
      } else {
        const value = sort.firstObject.value

        if (value !== 'vote_average.desc' && this.queryFilters.filters['vote_count_gte']) {
          this.queryFilters.updateKeys('vote_count_gte', null)
        }

        this.queryFilters.updateFilter('sort_by', value, true)
      }
    },
    voteUpdate (vote) {
      if (vote.length === 0) {
        this.queryFilters.updateFilter('vote_count_gte', null, true)
      } else {
        this.queryFilters.updateFilter('vote_count_gte', vote.firstObject.value, true)
      }
    },
    genresUpdate (genres) {
      let str = ''

      genres.forEach(genre => {
        str += `${genre.value},`
      })

      str = str.substr(0, str.length - 1)

      this.queryFilters.updateFilter('with_genres', str, true)
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

      document.getElementsByClassName('discover')[0].style.paddingTop = `${this.topbarHeight}px`
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

  __fetchData: task(function* () {
    window.scroll({
      top: 0
    })

    this.store.unloadAll('tmdb-discover')

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

  __getPaths (movies) {
    return movies.results.map(result => result.poster_path)
  }
})
