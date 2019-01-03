import Controller from '@ember/controller'
import { inject as service } from '@ember/service'
import { task, timeout, all } from 'ember-concurrency'
import { htmlSafe } from '@ember/string'
import { set } from '@ember/object'

export default Controller.extend({
  progress: service('page-progress'),
  router: service(),
  media: service(),
  user: service('current-user'),

  id: null,

  infos: null,
  lists: null,
  movies: null,
  votes: null,

  bannerIsVisible: true,

  actions: {
    styleCoverImg (x, y, scale) {
      let style = ''

      const ratio = this.media.isMobile ? window.innerWidth * 0.55970149253 / 150 : (window.innerWidth - 200) * 0.55970149253 / 150

      x = x * ratio
      y = y * ratio

      style += `transform: translate(calc(-50% + ${x || 0}px), calc(-50% + ${y || 0}px)) scale(${scale || 1})`

      return htmlSafe(style)
    },
    styleProfileImg (x, y, scale) {
      let style = ''

      const ratio = 200 / 150

      x = x * ratio
      y = y * ratio

      style += `transform: translate(calc(-50% + ${x || 0}px), calc(-50% + ${y || 0}px)) scale(${scale || 1})`

      return htmlSafe(style)
    }
  },

  fetch: task(function*(id) {
    this.progress.reset()

    this.progress.update(80)

    if (id !== this.id) {
      yield all([
        timeout(500),
        this.fetchInfos.perform(id)
      ])

      set(this, 'id', id)
    } else {
      yield this.fetchInfos.perform(id)
    }

    this.user.addActivity({
      id: id,
      name: this.infos.pseudo,
      icon: 'user',
      type: 'users'
    })

    this.progress.update(100)
  }),

  fetchInfos: task(function* (id) {
    yield this.store.find('fb-community-user-infos', id).then(infos => {
      set(this, 'infos', infos)
    })
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
  }
});
