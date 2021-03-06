import Service from '@ember/service'
import firebase from 'firebase'
import { inject as service } from '@ember/service'
import { set, get } from '@ember/object'
import { task, all, timeout } from 'ember-concurrency'

export default Service.extend({
  session: service(),
  store: service(),
  ajax: service(),

  reset: null,

  guestSessionId: null,
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

  async updateLastActivity (type, movieId, value) {
    const movie = await this.store.find('tmdb-movie', movieId).then(movie => movie)

    let payload = {
      createdAt: new Date().toString(),
      movie: {
        id: movie.id,
        title: movie.title,
        path: movie.poster_path
      }
    }

    if (value !== undefined && value !== null) {
      payload.value = value
    }

    firebase.database().ref(`users/${get(this.session, 'uid')}/last/${type}`).update(payload)

    payload.user = {
      id: get(this.session, 'uid'),
      pseudo: this.infos.pseudo,
    }

    if (this.infos.profileImg) {
      payload.user = Object.assign(payload.user, {
        path: this.infos.profileImg.path,
        posX: this.infos.profileImg.posX,
        posY: this.infos.profileImg.posY,
        scale: this.infos.profileImg.scale
      })
    }

    firebase.database().ref(`community/last/${type}`).update(payload)
  },

  addActivity (obj) {
    if (this.activities.length > 0) {
      if (['icon', 'id', 'name', 'type'].every(i => String(this.activities.firstObject[i]) === String(obj[i])) === false) {
        this.activities.unshiftObject(obj)
      }
    } else {
      this.activities.unshiftObject(obj)
    }
  },

  addNewList (list) {
    if (!this.lists) {
      set(this, 'lists', [list])
    } else {
      this.lists.pushObject(list)
    }
  },

  removeList (list) {
    this.lists.removeObject(list)
  },

  async signOut () {
    await this.session.close()

    this.resetUser()
  },

  resetUser() {
    this.store.unloadAll('fb-user-lists')

    set(this, 'infos', null)
    set(this, 'lists', null)
    set(this, 'movies', null)
  },

  async createInfos (payload) {
    await firebase.database().ref(`users/${get(this.session, 'uid')}/infos`).update(payload)

    await this.fetchInfos.perform()

    this.__updateUserInfosData()
  },

  async updateInfos (payload) {
    for (const i in payload) {
      set(this.infos, i, payload[i])
    }

    await this.infos.save()

    this.__updateUserInfosData()
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
    let vote = this.votes.findBy('id', id)

    this.ajax.request(`https://api.themoviedb.org/3/movie/${id}/rating?api_key=3836694fa8a7ae3ea69b5ff360b3be0b&guest_session_id=${this.guestSessionId}`, {
      method: 'POST',
      data: {
        value: average || 0.5
      }
    })

    await this.updateMovieData(id)

    let payload = {
      average: average
    }

    if (!vote) {
      payload.createdAt = new Date().toString()
    } else {
      payload.modifiedAt = new Date().toString()
    }

    this.addActivity({
      id: id,
      name: title,
      icon: 'star',
      type: 'movie'
    })

    if (!vote) {
      await firebase.database().ref(`users/${get(this.session, 'uid')}/votes/${id}`).update(payload)

      const vote = await this.store.find('fb-user-vote', id).then(_ => _)

      this.votes.pushObject(vote)
    } else {
      for (let i in payload) {
        set(vote, i, payload[i])
      }

      await vote.save()
    }

    return vote
  },

  async deleteVote (id) {
    const vote = this.votes.findBy('id', id)

    this.votes.removeObject(vote)

    this.store.unloadRecord(vote)

    await firebase.database().ref(`users/${get(this.session, 'uid')}/votes/${id}`).set(null)
  },

  async findVote (id) {
    const snap = await firebase.database().ref(`users/${get(this.session, 'uid')}/votes/${id}`).once('value', snap => snap)

    if (snap.val()) {
      return this.store.find('fb-user-vote', id).then(_ => _)
    }
  },

  fetch: task(function* () {
    yield all([
      this.fetchInfos.perform(),
      this.fetchLists.perform(),
      this.fetchMovies.perform(),
      this.fetchVotes.perform(),
      this.ajax.request('https://api.themoviedb.org/3/authentication/guest_session/new?api_key=3836694fa8a7ae3ea69b5ff360b3be0b').then(({ guest_session_id }) => set(this, 'guestSessionId', guest_session_id))
    ])

    this.__updateUserInfosData()
  }),

  fetchVotes: task(function* () {
    while (this.fetchMovies.isRunning) {
      yield timeout(200)
    }

    yield this.store.findAll('fb-user-vote').then(votes => {
      set(this, 'votes', [])

      votes.forEach(vote => {
        this.votes.pushObject(vote)
      })
    })

    yield this.fetchMoviesData(this.votes)
  }),

  fetchInfos: task(function* () {
    yield this.store.find('fb-user-infos', get(this.session, 'uid')).then(infos => {
      set(this, 'infos', infos)
    })
  }),

  fetchLists: task(function* () {
    yield this.store.findAll('fb-user-lists').then(lists => {
      set(this, 'lists', [])

      lists.forEach(list => {
        this.lists.pushObject(list)
      })
    })
  }),

  fetchMovies: task(function* () {
    yield this.store.find('fb-user-movies', get(this.session, 'uid')).then(({ movies }) => set(this, 'movies', movies))

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
  },

  __updateUserInfosData () {
    this.__updateUserInfosLastConnection()
    this.__updateUserInfosMovies()

    this.__updateCommunityUser()
  },

  __updateUserInfosLastConnection () {
    set(this.infos, 'lastConnection', new Date().getTime())
    set(this.infos, 'lastConnectionInverse', 9999999999999 - Number(new Date().getTime()))

    this.infos.save()
  },

  __updateUserInfosMovies () {
    set(this.infos, 'totalMovies', this.movies ? this.movies.length : 0)
    set(this.infos, 'totalMoviesInverse', this.movies ? 9999999999999 - this.movies.length : 9999999999999 - 0)

    this.infos.save()
  },

  __updateCommunityUser () {
    let payload = {}

    const index = ['createdAt', 'modifiedAt', 'color', 'firstname', 'lastname', 'pseudo', 'pseudoLower', 'pseudoLowerInverse', 'private', 'profileImg', 'coverImg', 'lastConnection', 'lastConnectionInverse', 'totalMovies', 'totalMoviesInverse']

    index.forEach(i => {
      set(payload, i, this.infos[i])
    })

    firebase.database().ref(`community/users/${get(this.session, 'uid')}`).update(payload)
  }
})
