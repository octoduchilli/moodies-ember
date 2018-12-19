import Controller from '@ember/controller'
import preloadImg from 'moodies-ember/mixins/preload-tmdb-img'
import genres from 'moodies-ember/data/genres'
import { get, set, computed } from '@ember/object'
import { inject as service } from '@ember/service'
import { task, timeout } from 'ember-concurrency'
import { copy } from '@ember/object/internals'

export default Controller.extend(preloadImg, {
  queryFilters: service(),
  notify: service('notification-messages'),
  user: service('current-user'),
  view: service(),
  queryKeys: null,

  filtersBarLock: false,

  topbarHeight: 0,
  isFetchingNextPage: false,
  scrollY: null,
  isLeaving: false,
  page: 1,

  genresItems: null,
  sortItems: null,
  genres: null,
  refine: null,
  lists: null,
  title: null,
  sort: null,

  movies: null,

  moviesContentSliced: null,

  listsItems: computed('user.lists', function () {
    if (this.user.lists) {
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

      return items.concat(copy(this.user.lists.map((list, index) => {
        return {
          id: index + 2,
          name: `${list.label} - ${list.name}`,
          value: list.id
        }
      })))
    }

    return null
  }),

  refineItems: computed('user.lists', function () {
    if (this.user.lists) {
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

      return items.concat(copy(this.user.lists.map((list, index) => {
        return {
          id: index + 2,
          name: `${list.label} - ${list.name}`,
          value: list.id
        }
      })))
    }

    return null
  }),

  init () {
    this._super(...arguments)

    this.genresItems = genres

    this.sortItems = [
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

    this.queryKeys = ['with_genres', 'sort_by', 'show_lists', 'refine_by']

    this.queryFilters.setKeys(this, this.queryKeys)

    this.moviesContentSliced = []
  },

  actions: {
    sortUpdate (sort) {
      if (sort.length === 0) {
        this.__update('sort_by', null)
      } else {
        this.__update('sort_by', sort.firstObject.value)
      }
    },
    listsUpdate (lists) {
      let str = ''

      lists.forEach(list => {
        str += `${list.value},`
      })

      str = str.substr(0, str.length - 1)

      this.__update('show_lists', str)
    },
    refineUpdate (refine) {
      if (refine.length === 0) {
        this.__update('refine_by', null)
      } else {
        this.__update('refine_by', refine.firstObject.value)
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
    titleUpdate () {
      this.__updateMovies()
    },
    resetFilters () {
      window.scroll({
        top: 0
      })

      //title is not a query
      set(this, 'title', null)

      this.queryFilters.resetQuery()

      this.__updateMovies()

      this.__updateMoviesContentSliced(this.page)
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

  __updatePaddingTop () {
    document.getElementsByClassName('my-lists')[0].style.paddingTop = `${this.topbarHeight}px`
  },

  __update (key, value) {
    this.queryFilters.updateKeys(key, value)

    this.queryFilters.transition()
  },

  __checkFiltersValue: task(function* () {
    while (this.user.fetch.isRunning === true) {
      yield timeout(200)
    }
    // Called by the route with refresh queryParams
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

    if (this.show_lists) {
      const listsValue = this.show_lists.split(',')
      const listsItems = listsValue.map(value => this.listsItems.findBy('value', value))

      set(this, 'lists', listsItems)
    } else {
      set(this, 'lists', null)
    }

    if (this.refine_by) {
      const refineItem = this.refineItems.findBy('value', this.refine_by)

      //call didUpdateAttrs in filters-top-bar/filters-section/dropdown-button component
      set(this, 'refine', null)

      set(this, 'refine', refineItem)
    } else {
      set(this, 'refine', null)
    }

    if (!this.isLeaving) {
      this.__checkQueryFilters()
    } else {
      set(this, 'isLeaving', false)
    }
  }),

  __checkQueryFilters () {
    this.queryKeys.forEach(key => {
      const value = get(this, key)

      if (value) {
        this.queryFilters.updateKeys(key, value)
      } else {
        this.queryFilters.updateKeys(key, null)
      }
    })

    this.__updateMovies()
  },

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

  __updateMovies () {
    window.scroll({
      top: 0
    })

    set(this, 'page', 1)

    let movies = copy(this.user.movies)

    const moviesData = this.user.moviesData

    if (this.lists) {
      movies = movies.filter(movie => {
        return movie.lists.every(movieListId => this.lists.findBy('value', movieListId) === undefined) === false
      })
    }

    if (this.refine) {
      movies = movies.filter(movie => {
        return movie.lists.every(movieListId => this.refine.value !== movieListId) === false
      })
    }

    movies = movies.map(movie => moviesData.findBy('id', String(movie.id)))

    if (this.genres) {
      movies = movies.filter(movie => {
        if (movie.genres) {
          return this.genres.every(genre => movie.genres.findBy('id', genre.value) !== undefined) === true
        }
      })
    }

    if (this.sort) {
      if (this.sort.value === 'popularity.desc') {
        movies.sort((b, a) => a.popularity - b.popularity)
      } else if (this.sort.value === 'popularity.asc') {
        movies.sort((a, b) => a.popularity - b.popularity)
      } else if (this.sort.value === 'release_date.desc') {
        movies.sort((a, b) => {
          if (a.release_date && b.release_date) {
            return ('' + b.release_date).localeCompare(a.release_date)
          }
        })
      } else if (this.sort.value === 'release_date.asc') {
        movies.sort((b, a) => {
          if (a.release_date && b.release_date) {
            return ('' + b.release_date).localeCompare(a.release_date)
          }
        })
      } else if (this.sort.value === 'title.desc') {
        movies.sort((b, a) => ('' + b.title).localeCompare(a.title))
      } else if (this.sort.value === 'title.asc') {
        movies.sort((a, b) => ('' + b.title).localeCompare(a.title))
      } else if (this.sort.value === 'runtime.desc') {
        movies.sort((b, a) => a.runtime - b.runtime)
      } else if (this.sort.value === 'runtime.asc') {
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
  },

  __updateMoviesContentSliced () {
    this.moviesContentSliced.removeObjects(this.moviesContentSliced)

    this.movies.content.slice(0, this.page * 20).forEach(item => {
      this.moviesContentSliced.pushObject(item)
    })
  }
})
