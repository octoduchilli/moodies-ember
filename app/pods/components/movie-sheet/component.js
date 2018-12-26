import Component from '@ember/component'
import preloadImg from 'moodies-ember/mixins/preload-tmdb-img'
import lerpColor from 'moodies-ember/mixins/lerp-color'
import { task, all, timeout } from 'ember-concurrency'
import { inject as service } from '@ember/service'
import { computed } from '@ember/object'
import { htmlSafe } from '@ember/string'
import { set, get } from '@ember/object'

export default Component.extend(preloadImg, lerpColor, {
  tagName: 'div',

  firebaseApp: service(),
  progress: service('page-progress'),
  session: service(),
  notify: service('notification-messages'),
  store: service(),
  user: service('current-user'),

  id: null,
  movie: null,
  images: null,
  voteAverage: null,
  newVoteAverage: null,

  sliceCast: 5,
  sliceCrew: 5,

  runtime: computed('movie.runtime', function () {
    if (this.movie) {
      const { runtime } = this.movie

      const H = Math.floor(runtime / 60)
      const M = runtime % 60

      return `${H} h ${M}`
    }

    return '0 h 00'
  }),

  videos: computed('movie.videos.results', function () {
    const videos = this.movie.videos.results

    if (videos) {
      if (videos.length === 0) {
        return []
      } else {
        return videos.filter(video => video.site === 'YouTube')
      }
    }

    return []
  }),

  slicedCast: computed('movie.credits.cast', 'sliceCast', function () {
    if (this.movie.credits && this.movie.credits.cast) {
      return this.movie.credits.cast.slice(0, this.sliceCast)
    }
  }),

  slicedCrew: computed('movie.credits.crew', 'sliceCrew', function () {
    if (this.movie.credits && this.movie.credits.crew) {
      return this.movie.credits.crew.slice(0, this.sliceCrew)
    }
  }),

  collection: computed('movie.collection.parts', function () {
    if (this.movie.collection) {
      return this.movie.collection.parts.sort((a, b) => {
        if (a.release_date && b.release_date) {
          return ('' + a.release_date).localeCompare(b.release_date)
        }
      })
    }

    return null
  }),

  async init () {
    this._super(...arguments)

    this.fetch.perform(this.id)
  },

  didUpdateAttrs () {
    this.fetch.perform(this.id)
  },

  willDestroyElement () {
    this.progress.reset()
  },

  actions: {
    voteAverageBorderColorStyle (average) {
      if (average !== null) {
        return htmlSafe(`border: 2px solid ${this.lerpColor({r: 255, g: 0, b: 0}, {r: 0, g: 255, b: 0}, average / 10)}`)
      }
    },
    voteAverageBgStyle (average) {
      if (!average) {
        return htmlSafe(`width: 0; backgroud: rgba(0, 0, 0, 0)`)
      } else {
        return htmlSafe(`width: ${(average / 10) * 100}%; background: ${this.lerpColor({r: 255, g: 0, b: 0}, {r: 0, g: 255, b: 0}, average / 10)}`)
      }
    },
    updateVoteAverage () {
      set(this, 'newVoteAverage', Math.round((event.offsetX / event.target.offsetWidth) * 10))
    },
    async saveVote (average) {
      let payload = {
        average: average
      }

      if (!this.voteAverage) {
        payload.createdAt = new Date().toString()
      } else {
        payload.modifiedAt = new Date().toString()
      }

      await this.firebaseApp.database().ref(`users/${get(this.session, 'uid')}/vote/${this.movie.id}`).update(payload)

      payload.id = this.movie.id

      const vote = this.user.votes.findBy('id', this.movie.id)

      if (vote) {
        set(vote, 'average', average)
        set(vote, 'modifiedAt', payload.modifiedAt)
      } else {
        this.user.votes.push({
          id: this.movie.id,
          average: payload.average,
          createdAt: payload.createdAt,
          modifiedAt: payload.modifiedAt
        })
      }

      set(this, 'voteAverage', average)
    },
    async deleteVote () {
      await this.firebaseApp.database().ref(`users/${get(this.session, 'uid')}/vote/${this.movie.id}`).set(null)

      const vote = this.user.votes.findBy('id', this.movie.id)

      if (vote) {
        this.user.votes.removeObject(vote)
      }

      set(this, 'voteAverage', null)
    },
    notifyNotConnected () {
      this.notify.info(`Vous n'êtes pas connecté...`)
    },
    showMorePerson (array, slice, sliceKey) {
      if (array.length > slice) {
        set(this, sliceKey, slice + 10)
      }
    },
    showAllPerson (array, sliceKey) {
      set(this, sliceKey, array.length)
    },
    resetPerson (sliceKey, className) {
      set(this, sliceKey, 5)

      setTimeout(() => {
        window.scroll({
          top: document.getElementsByClassName(className)[0].offsetTop - 100,
          behavior: 'smooth'
        })
      })
    }
  },

  fetch: task(function*(id) {
    this.progress.reset()
    this.progress.update(20)

    yield all([
      timeout(500),
      this.__fetch.perform(id)
    ])

    const movie = this.movie

    if (movie.credits) {
      if (movie.credits.cast) {
        const noDuplicates = this.__noDuplicatePersons(movie.credits.cast, 'character')
        const serialized = this.__serializePersons(noDuplicates, 'character')

        set(movie, 'credits.cast', serialized)
      }

      if (movie.credits.crew) {
        const noDuplicates = this.__noDuplicatePersons(movie.credits.crew, 'job')
        const serialized = this.__serializePersons(noDuplicates, 'job')

        set(movie, 'credits.crew', serialized)
      }
    }

    yield this.preloadTMDBImg(this.__getPaths(movie))

    this.user.addActivity({
      id: this.movie.id,
      name: this.movie.title,
      icon: 'search',
      type: 'movie'
    })

    this.progress.update(100)
  }).restartable(),

  __fetch: task(function*(id) {
    yield this.fetchMovie.perform(id)
    yield this.fetchImages.perform(id)
    yield this.fetchVote.perform(id)
  }),

  fetchMovie: task(function*(id) {
    return yield this.store.find('tmdb-movie', id).then(async movie => {
      if (movie.belongs_to_collection) {
        await this.store.find('tmdb-collection', movie.belongs_to_collection.id).then(collection => set(movie, 'collection', collection))
      }

      this.progress.update(40)

      set(this, 'movie', movie)
    })
  }),

  fetchImages: task(function*(id) {
    return yield this.store.find('tmdb-movie-images', id).then(images => {
      this.progress.update(60)

      set(this, 'images', images)
    })
  }),

  fetchVote: task(function*(id) {
    return yield this.store.find('fb-user-vote', id).then(vote => {
      this.progress.update(80)

      set(this, 'voteAverage', vote.average)
    })
  }),

  __getPaths (movie) {
    let paths = []

    if (movie.poster_path) {
      paths.push(movie.poster_path)
    }

    if (movie.backdrop_path) {
      paths.push(movie.backdrop_path)
    }

    if (movie.credits) {
      if (movie.credits.cast) {
        movie.credits.cast.slice(0, 5).forEach(person => {
          if (person.profile_path) {
            paths.push(person.profile_path)
          }
        })
      }

      if (movie.credits.crew) {
        movie.credits.crew.slice(0, 5).forEach(person => {
          if (person.profile_path) {
            paths.push(person.profile_path)
          }
        })
      }
    }

    movie.recommendations.results.slice(0, 5).forEach(result => {
      paths.push(result.poster_path)
    })

    if (movie.collection) {
      movie.collection.parts.forEach(part => {
        paths.push(part.poster_path)
      })
    }

    return paths
  },

  __noDuplicatePersons (array, key) {
    const noDuplicates = array.filter((item, index) => {
      const findIndex = array.findIndex(_ => _.name === item.name)
      const isDuplicate = findIndex !== index

      if (isDuplicate) {
        set(array[findIndex], key, `${array[findIndex][key]}, ${item[key]}`)
      }

      return array.findIndex(_ => _.name === item.name) === index
    })

    return noDuplicates
  },

  __serializePersons (array, key) {
    const serialized = array.map(person => {
      let title = ''

      if (person[key]) {
        title = `${person[key]} - ${person.name}`
      } else {
        title = person.name
      }

      set(person, 'poster_path', person.profile_path)
      set(person, 'title', title)

      return person
    })

    return serialized
  }
});
