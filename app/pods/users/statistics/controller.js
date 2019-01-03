import Controller from '@ember/controller'
import genres from 'moodies-ember/data/genres'
import { inject as service } from '@ember/service'
import { task, timeout, all } from 'ember-concurrency'
import { set } from '@ember/object'

export default Controller.extend({
  progress: service('page-progress'),
  media: service(),

  lists: null,
  movies: null,
  votes: null,
  moviesData: null,

  totalMovies: null,
  totalViewedMovies: null,
  totalFavoriteMovies: null,
  likedGenres: null,
  totalVotes: null,

  init () {
    this._super(...arguments)

    this.moviesData = []

    this.genresItems = genres
  },

  actions: {
    minToMDHM (min) {
      let M = Math.floor(min / (24 * 30 * 60)) % 12
      let D = Math.floor(min / (24 * 60)) % 30
      let H = Math.floor(min / 60) % 24
      let m = min % 60
      return `${M} mois, ${D} jours, ${H} heures, ${m} minutes`
    }
  },

  fetch: task(function*(id) {
    this.progress.reset()

    this.progress.update(40)

    yield all([
      timeout(1000),
      this.__fetch.perform(id)
    ])

    this.progress.update(100)
  }),

  __fetch: task(function*(id) {

    yield this.fetchLists.perform(id)

    this.progress.update(60)

    yield this.fetchMovies.perform(id)

    this.progress.update(80)

    yield this.fetchVotes.perform(id)

    yield all([
      this.__initTotalMovies(),
      this.__initTotalViewedMovies(),
      this.__initTotalFavoriteMovies(),
      this.__initLikedGenres(),
      this.__initTotalVotes()
    ])
  }),

  fetchLists: task(function* (id) {
    yield this.store.find('fb-community-user-lists', id).then(({ lists }) => {
      set(this, 'lists', lists)
    })
  }),

  fetchMovies: task(function*(id) {
    yield this.store.find('fb-community-user-movies', id).then(({ movies }) => {
      set(this, 'movies', movies)
    })

    yield this.fetchMoviesData(this.movies)
  }),

  fetchVotes: task(function*(id) {
    yield this.store.find('fb-community-user-votes', id).then(({ votes }) => {
      set(this, 'votes', votes)
    })

    yield this.fetchMoviesData(this.votes)
  }),

  async fetchMoviesData (items) {
    if (this.moviesData.length === 0) {
      const promises = await items.map(item => this.store.find('fb-movies-data', item.id).then(_ => _))

      return await Promise.all(promises).then(moviesData => set(this, 'moviesData', moviesData))
    } else {
      let promises = await items.map(item => {
        const movie = this.moviesData.findBy('id', item.id)

        if (!movie) {
          return this.store.find('fb-movies-data', item.id).then(_ => _)
        }
      })

      promises = promises.filter(promise => promise)

      return await Promise.all(promises).then(moviesData => set(this, 'moviesData', moviesData.concat(this.moviesData)))
    }
  },

  __initTotalMovies () {
    let totalRuntime = 0

    if (this.movies) {
      this.movies.forEach(movie => {
        const { runtime } = this.moviesData.findBy('id', movie.id)

        totalRuntime += runtime || 0
      })
    }

    set(this, 'totalMovies', {
      total: this.movies ? this.movies.length : 0,
      totalRuntime: totalRuntime,
    })
  },

  __initTotalViewedMovies () {
    let total = 0
    let totalRuntime = 0

    if (this.movies) {
      this.movies.forEach(movie => {

        if (movie.lists.find(list => list === 'eye')) {
          const { runtime } = this.moviesData.findBy('id', movie.id)

          totalRuntime += runtime || 0
          total++
        }
      })
    }

    set(this, 'totalViewedMovies', {
      total: total,
      totalRuntime: totalRuntime,
    })
  },

  __initTotalFavoriteMovies () {
    let total = 0
    let totalRuntime = 0

    if (this.movies) {
      this.movies.forEach(movie => {
        if (movie.lists.find(list => list === 'heart')) {
          const { runtime } = this.moviesData.findBy('id', movie.id)

          totalRuntime += runtime || 0
          total++
        }
      })
    }

    set(this, 'totalFavoriteMovies', {
      total: total,
      totalRuntime: totalRuntime,
    })
  },

  __initLikedGenres () {
    let genresCounter = {}

    if (this.movies) {
      this.movies.forEach(movie => {
        const { genres } = this.moviesData.findBy('id', movie.id)

        if (genres) {
          genres.forEach(genre => {
            if (genresCounter[genre.id]) {
              genresCounter[genre.id] += 1
            } else {
              genresCounter[genre.id] = 1
            }
          })
        }
      })
    }

    const likedGenres = Object.entries(genresCounter).sort((a, b) => b[1] - a[1]).slice(0, 3).map(genre => {
      const g = this.genresItems.find(_ => Number(_.value) === Number(genre[0]))

      return {
        id: g.value,
        name: g.name,
        total: genre[1]
      }
    })

    set(this, 'likedGenres', likedGenres)
  },

  __initTotalVotes () {
    let total = 0
    let average = null

    if (this.votes) {
      total = this.votes.length

      if (total) {
        average = this.votes.map(vote => vote.average).reduce((a, b) => a + b) / total
      }
    }

    set(this, 'totalVotes', {
      total: total,
      average: average ? Number(average.toFixed(1)) : null
    })
  },
});
