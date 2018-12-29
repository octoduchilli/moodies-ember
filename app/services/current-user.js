import Service from '@ember/service'
import firebase from 'firebase'
import { inject as service } from '@ember/service'
import { set, get } from '@ember/object'
import { task, all, timeout } from 'ember-concurrency'

export default Service.extend({
  session: service(),
  store: service(),

  reset: null,

  infos: null,
  lists: null,
  movies: null,
  votes: null,
  moviesData: null,

  activities: null,

  lockFiltersTopBar: true,

  init () {
    this._super(...arguments)

    this.activities = []
    this.moviesData = []
    this.votes = []
  },

  addActivity (obj) {
    if (this.activities.length > 0) {
      if (JSON.stringify(this.activities.firstObject) !== JSON.stringify(obj)) {
        this.activities.unshiftObject(obj)
      }
    } else {
      this.activities.unshiftObject(obj)
    }
  },

  resetUser() {
    this.store.unloadAll('fb-user-lists')

    set(this, 'infos', null)
    set(this, 'lists', null)
    set(this, 'movies', null)
  },

  async updateInfos (payload) {
    await firebase.database().ref(`users/${get(this.session, 'uid')}/infos`).update(payload)

    return this.fetchInfos.perform()
  },

  async updateMovieData (id) {
    const movieData = await this.store.find('tmdb-movie', id).then(data => data)
    const frenchRelease = movieData.releases.countries.find(_ => String(_.iso_3166_1) === 'FR')

    let releaseDate

    if (frenchRelease) {
      releaseDate = frenchRelease.release_date
    } else {
      releaseDate = movieData.release_date
    }

    const obj = {
      id: movieData.id,
      title: movieData.title,
      poster_path: movieData.poster_path,
      runtime: movieData.runtime,
      popularity: movieData.popularity,
      genres: movieData.genres,
      release_date: releaseDate,
      overview: movieData.overview,
      vote_count: movieData.vote_count,
      vote_average: movieData.vote_average
    }

    await firebase.database().ref(`films/added/${id}`).set(obj)

    await this.fetchMoviesData([obj])
  },

  async updateVote (id, title, average) {
    const vote = this.votes.findBy('id', id)

    let payload = {
      average: average
    }

    if (!vote) {
      payload.createdAt = new Date().toString()
    } else {
      payload.modifiedAt = new Date().toString()
    }

    await firebase.database().ref(`users/${get(this.session, 'uid')}/vote/${id}`).update(payload)

    this.addActivity({
      id: id,
      name: title,
      icon: 'star',
      type: 'movie'
    })

    if (vote) {
      set(vote, 'average', average)
      set(vote, 'modifiedAt', payload.modifiedAt)

      return vote
    } else {
      await this.updateMovieData(id)

      const obj = {
        id: id,
        average: payload.average,
        createdAt: payload.createdAt,
        modifiedAt: payload.modifiedAt
      }

      this.votes.push(obj)

      return obj
    }
  },

  async deleteVote (id) {
    await firebase.database().ref(`users/${get(this.session, 'uid')}/vote/${id}`).set(null)

    const vote = this.votes.findBy('id', id)

    if (vote) {
      this.votes.removeObject(vote)
    }
  },

  fetch: task(function* () {
    yield all([
      this.fetchInfos.perform(),
      this.fetchLists.perform(),
      this.fetchMovies.perform(),
      this.fetchVotes.perform()
    ])
  }),

  fetchVotes: task(function* () {
    while (this.fetchMovies.isRunning) {
      yield timeout(200)
    }

    yield firebase.database().ref(`users/${get(this.session, 'uid')}/vote`).once('value', snap => {
      let votes = []

      snap.forEach(vote => {
        votes.push({
          id: vote.key,
          average: vote.val().average,
          createdAt: vote.val().createdAt,
          modifiedAt: vote.val().modifiedAt
        })
      })

      set(this, 'votes', votes)
    })

    yield this.fetchMoviesData(this.votes)
  }),

  fetchInfos: task(function* () {
    yield this.store.find('fb-user-infos', `${get(this.session, 'uid')}/infos`).then(infos => {
      set(this, 'infos', infos)
    })
  }),

  fetchLists: task(function* () {
    yield this.store.findAll('fb-user-lists').then(lists => {
      set(this, 'lists', lists)
    })
  }),

  fetchMovies: task(function* () {
    yield firebase.database().ref(`users/${get(this.session, 'uid')}/films`).once('value', snap => {
      let movies = []

      snap.forEach(movie => {
        let lists = []

        movie.forEach(list => {
          lists.push(list.key)
        })

        movies.push({
          id: movie.key,
          lists: lists
        })
      })

      set(this, 'movies', movies)
    })

    yield this.fetchMoviesData(this.movies)
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
  }
})
