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

  fetch: task(function* () {
    yield all([
      this.fetchInfos.perform(),
      this.fetchLists.perform(),
      this.fetchMovies.perform()
    ])
  }),

  fetchVotes: task(function* () {
    while (!get(this.session, 'isAuthenticated')) {
      yield timeout(500)
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

    const promises = yield this.movies.map(movie => this.store.find('fb-movies-data', movie.id).then(_ => _))

    yield Promise.all(promises).then(moviesData => set(this, 'moviesData', moviesData))
  })
})
