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
  moviesDataWithListsAndVotes: null,

  totalMovies: null,
  totalMoviesViewed: null,
  totalMoviesFavorite: null,
  likedGenres: null,
  totalVotes: null,

  init () {
    this._super(...arguments)

    this.moviesData = []
    this.moviesDataWithListsAndVotes = []

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
    if (id === this.id) {
      return
    }

    set(this, 'id', id)

    this.progress.reset()

    this.progress.update(40)

    yield all([
      timeout(500),
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

    this.__initMoviesDataWithListsAndVotes()

    this.__initAllStats()
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

  __initMoviesDataWithListsAndVotes () {
    let moviesDataWithLists = this.movies.map(movie => {
      const movieData = this.moviesData.findBy('id', movie.id)

      return Object.assign(movie, { runtime: movieData.runtime, genres: movieData.genres })
    })

    this.votes.forEach(vote => {
      let movieDataWithLists = moviesDataWithLists.findBy('id', vote.id)

      if (movieDataWithLists) {
        movieDataWithLists = Object.assign(movieDataWithLists, { vote: vote })
      } else {
        moviesDataWithLists.push({ vote: vote })
      }
    })

    set(this, 'moviesDataWithListsAndVotes', moviesDataWithLists)
  },

  __initAllStats () {
    let totalMovies = {
      total: 0,
      totalRuntime: 0
    }

    let totalMoviesViewed = {
      total: 0,
      totalRuntime: 0
    }

    let totalMoviesFavorite = {
      total: 0,
      totalRuntime: 0
    }

    let totalVotes = {
      total: 0,
      average: 0
    }

    let genresCounter = {}

    this.moviesDataWithListsAndVotes.forEach(movie => {
      totalMovies.total++
      totalMovies.totalRuntime += movie.runtime || 0

      if (movie.lists) {
        if (movie.lists.find(list => list === 'eye')) {
          totalMoviesViewed.total++
          totalMoviesViewed.totalRuntime += movie.runtime || 0
        }

        if (movie.lists.find(list => list === 'heart')) {
          totalMoviesFavorite.total++
          totalMoviesFavorite.totalRuntime += movie.runtime || 0
        }
      }

      if (movie.genres) {
        movie.genres.forEach(genre => {
          if (genresCounter[genre.id]) {
            genresCounter[genre.id] += 1
          } else {
            genresCounter[genre.id] = 1
          }
        })
      }

      if (movie.vote) {
        totalVotes.total++
        totalVotes.average += movie.vote.average
      }
    })

    totalVotes.average = totalVotes.average / totalVotes.total

    totalVotes.average = totalVotes.average.toFixed(1)

    const likedGenres = Object.entries(genresCounter).sort((a, b) => b[1] - a[1]).slice(0, 3).map(genre => {
      const g = this.genresItems.find(_ => Number(_.value) === Number(genre[0]))

      return {
        id: g.value,
        name: g.name,
        total: genre[1]
      }
    })

    set(this, 'totalMovies', totalMovies)
    set(this, 'totalMoviesViewed', totalMoviesViewed)
    set(this, 'totalMoviesFavorite', totalMoviesFavorite)
    set(this, 'likedGenres', likedGenres)
    set(this, 'totalVotes', totalVotes)
  }
});
