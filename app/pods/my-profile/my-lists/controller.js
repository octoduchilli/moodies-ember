import Controller from '@ember/controller'
import preloadImg from 'moodies-ember/mixins/preload-tmdb-img'
import filtersHelper from 'moodies-ember/mixins/filters-helper'
import genres from 'moodies-ember/data/genres'
import { set, computed } from '@ember/object'
import { inject as service } from '@ember/service'
import { task, timeout } from 'ember-concurrency'
import { copy } from '@ember/object/internals'

export default Controller.extend(preloadImg, filtersHelper, {
  queryFilters: service(),
  notify: service('notification-messages'),
  media: service(),
  user: service('current-user'),
  view: service(),
  queryKeys: null,

  topbarHeight: 0,
  isFetchingNextPage: false,
  scrollY: null,
  isLeaving: false,
  page: 1,

  genres: null,
  refine: null,
  lists: null,
  title: null,
  sort: null,

  movies: null,
  moviesContentSliced: null,

  refineItems: computed('user.{lists,lists.length}', function () {
    let items = [
      {
        id: 0,
        name: 'Visionnés',
        value: 'eye'
      },
      {
        id: 1,
        name: 'Coups de coeurs',
        value: 'heart'
      }
    ]

    if (this.user.lists) {
      return items.concat(copy(this.user.lists.map((list, index) => {
        return {
          id: index + 2,
          name: `${list.label} - ${list.name}`,
          value: list.id
        }
      })))
    }

    return items
  }),

  listsItems: computed('user.{lists,lists.length}', function () {
    let items = [
      {
        id: 0,
        name: 'Visionnés',
        value: 'eye'
      },
      {
        id: 1,
        name: 'Coups de coeurs',
        value: 'heart'
      }
    ]

    if (this.user.lists) {
      return items.concat(copy(this.user.lists.map((list, index) => {
        return {
          id: index + 2,
          name: `${list.label} - ${list.name}`,
          value: list.id
        }
      })))
    }

    return items
  }),

  init () {
    this._super(...arguments)

    this.moviesContentSliced = []

    this.genres = {
      selected: null,
      multipleSelect: true,
      key: 'with_genres',
      items: genres
    }

    this.sort = {
      selected: null,
      key: 'sort_by',
      items: [
        {
          id: 0,
          name: 'Par défaut (popularité ↗)',
          value: 'popularity.desc'
        },
        {
          id: 1,
          name: 'Popularité ↘',
          value: 'popularity.asc'
        },
        {
          id: 2,
          name: 'Date de réalisation ↗',
          value: 'release_date.desc'
        },
        {
          id: 3,
          name: 'Date de réalisation ↘',
          value: 'release_date.asc'
        },
        {
          id: 4,
          name: 'Titre de A à Z',
          value: 'title.desc'
        },
        {
          id: 5,
          name: 'Titre de Z à A',
          value: 'title.asc'
        },
        {
          id: 6,
          name: 'Durée du film ↗',
          value: 'runtime.desc'
        },
        {
          id: 7,
          name: 'Durée du film ↘',
          value: 'runtime.asc'
        }
      ]
    }

    this.lists = {
      selected: null,
      multipleSelect: true,
      key: 'show_lists',
      itemsKey: 'listsItems'
    }

    this.refine = {
      selected: null,
      key: 'refine_by',
      itemsKey: 'refineItems'
    }

    this.genresItems = genres

    this.queryKeys = ['with_genres', 'sort_by', 'show_lists', 'refine_by']
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
    listsUpdate (lists) {
      let str = ''

      lists.forEach(list => {
        str += `${list.value},`
      })

      str = str.substr(0, str.length - 1)

      this.queryFilters.updateFilter('show_lists', str, true)
    },
    refineUpdate (refine) {
      if (refine.length === 0) {
        this.queryFilters.updateFilter('refine_by', null, true)
      } else {
        this.queryFilters.updateFilter('refine_by', refine.firstObject.value, true)
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
    titleUpdate () {
      this.__fetchData.perform()
    },
    resetFilters () {
      window.scroll({
        top: 0
      })

      //title is not a query
      set(this, 'title', null)

      this.queryFilters.resetQuery()

      this.queryFilters.__queryTransition()

      this.__fetchData.perform()

      this.__updateMoviesContentSliced(this.page)
    },
    actualiseFilters () {
      this.__fetchData.perform()
    },
    setScroll (scrollY) {
      set(this, 'scrollY', scrollY)

      this.__nextPage()
    },
    setTopbarHeight (height) {
      document.getElementsByClassName('my-profile__my-lists')[0].style.paddingTop = `${height}px`
    },
    updatedItems () {
      set(this, 'isFetchingNextPage', false)

      this.__nextPage()
    },
    warnViewUserButton (key) {
      if (key === 'visible') {
        this.notify.warning('Attention ! Cette option peut provoquer quelques latences.', { clearDuration: 7000 })
      }
    },
    minToMDHM (min) {
      let M = Math.floor(min / (24 * 30 * 60)) % 12
      let D = Math.floor(min / (24 * 60)) % 30
      let H = Math.floor(min / 60) % 24
      let m = min % 60
      return `${M} mois, ${D} jours, ${H} heures, ${m} minutes`
    }
  },

  __waitUserFetch: task(function* () {
    while (this.user.fetch.isRunning === true) {
      yield timeout(200)
    }

    this.__checkFiltersValue([this.sort, this.genres, this.lists, this.refine], this.user.reset === 'my-lists')
  }),

  __nextPage () {
    if (!this.isFetchingNextPage && this.movies) {
      set(this, 'isFetchingNextPage', true)

      const page = this.page
      const totalPages = Math.round(this.movies.total / 20) + 1
      const { offsetTop, offsetHeight } = document.getElementsByClassName('movie-list')[0]
      const bottomPosition = offsetTop + offsetHeight

      if (page < totalPages) {
        if (bottomPosition - window.innerHeight * 3 <= window.innerHeight + window.scrollY) {
          this.incrementProperty('page')

          this.__updateMoviesContentSliced()
        }
      }
    }
  },

  __fetchData: task(function* () {
    yield timeout(750)

    window.scroll({
      top: 0
    })

    set(this, 'page', 1)

    let movies = copy(this.user.movies) || []

    const moviesData = this.user.moviesData

    if (this.lists.selected) {
      movies = movies.filter(movie => {
        return movie.lists.every(movieListId => this.lists.selected.findBy('value', movieListId) === undefined) === false
      })
    }

    if (this.refine.selected) {
      movies = movies.filter(movie => {
        return movie.lists.every(movieListId => this.refine.selected.value !== movieListId) === false
      })
    }

    movies = movies.map(movie => moviesData.findBy('id', String(movie.id)))

    if (this.genres.selected) {
      movies = movies.filter(movie => {
        if (movie.genres) {
          return this.genres.selected.every(genre => movie.genres.findBy('id', genre.value) !== undefined) === true
        }
      })
    }

    if (this.sort.selected) {
      if (this.sort.selected.value === 'popularity.desc') {
        movies.sort((b, a) => a.popularity - b.popularity)
      } else if (this.sort.selected.value === 'popularity.asc') {
        movies.sort((a, b) => a.popularity - b.popularity)
      } else if (this.sort.selected.value === 'release_date.desc') {
        movies.sort((a, b) => {
          if (a.release_date && b.release_date) {
            return ('' + b.release_date).localeCompare(a.release_date)
          }
        })
      } else if (this.sort.selected.value === 'release_date.asc') {
        movies.sort((b, a) => {
          if (a.release_date && b.release_date) {
            return ('' + b.release_date).localeCompare(a.release_date)
          }
        })
      } else if (this.sort.selected.value === 'title.desc') {
        movies.sort((b, a) => ('' + b.title).localeCompare(a.title))
      } else if (this.sort.selected.value === 'title.asc') {
        movies.sort((a, b) => ('' + b.title).localeCompare(a.title))
      } else if (this.sort.selected.value === 'runtime.desc') {
        movies.sort((b, a) => a.runtime - b.runtime)
      } else if (this.sort.selected.value === 'runtime.asc') {
        movies.sort((a, b) => a.runtime - b.runtime)
      }
    } else {
      movies.sort((b, a) => a.popularity - b.popularity)
    }

    if (this.title) {
      movies = movies.filter(movie => movie.title.toLowerCase().indexOf(this.title.toLowerCase()) !== -1)
    }

    const total = movies.length
    const runtimes = movies.map(_ => _.runtime || 0)
    const totalRuntime = runtimes.length > 0 ? runtimes.reduce((total, runtime) => total + runtime) : 0

    set(this, 'movies', {
      total: total,
      content: movies,
      totalRuntime: totalRuntime
    })

    this.__updateMoviesContentSliced()
  }),

  __updateMoviesContentSliced () {
    this.moviesContentSliced.removeObjects(this.moviesContentSliced)

    this.movies.content.slice(0, this.page * 20).forEach(item => {
      this.moviesContentSliced.pushObject(item)
    })
  }
})
