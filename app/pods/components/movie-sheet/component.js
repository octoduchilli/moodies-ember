import Component from '@ember/component';
import preloadImg from 'moodies-ember/mixins/preload-tmdb-img';
import { inject as service } from '@ember/service';
import { task, timeout, all } from 'ember-concurrency';
import { computed } from '@ember/object';
import { set } from '@ember/object'

export default Component.extend(preloadImg, {
  tagName: 'div',

  progress: service('page-progress'),
  store: service(),
  user: service('current-user'),

  movie: null,
  isShowingPoster: false,

  runtime: computed('movie.runtime', function () {
    if (this.movie) {
      const { runtime } = this.movie

      const H = Math.floor(runtime / 60)
      const M = runtime % 60

      return `${H} h ${M}`
    }

    return '0 h 00'
  }),

  didReceiveAttrs() {
    set(this, 'movie', null)

    if (this.movieId) {
      this.__fetchData.perform(this.movieId);
    }
  },

  willDestroyElement () {
    this.progress.reset()
  },

  actions: {
    togglePoster () {
      this.toggleProperty('isShowingPoster')
    },
    scrollTop () {
      window.scroll({
        top: 0
      })
    }
  },

  __fetchData: task(function* (movieId) {
    this.progress.reset()

    yield all([
      timeout(500),
      this.__fetchMovie(movieId)
    ])

    return this.progress.update(100)
  }).restartable(),

  async __fetchMovie (movieId) {
    await this.store.find('tmdb-movie', movieId).then(_ => {
      set(this, 'movie', _)
    })

    const movie = this.movie

    this.user.addActivity({
      id: movie.id,
      name: movie.title,
      icon: 'search',
      type: 'movie'
    })

    if (movie.belongs_to_collection) {
      await this.store.find('tmdb-collection', movie.belongs_to_collection.id).then(collection => {
        set(movie, 'collection', collection)
      })
    }

    // TODO set(movie, 'credits.cast', serialized) not set before __fetchData have finish

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

    await this.preloadTMDBImg(this.__getPaths(movie), true)

    return
  },

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
        movie.credits.cast.forEach(person => {
          if (person.profile_path) {
            paths.push(person.profile_path)
          }
        })
      }

      if (movie.credits.crew) {
        movie.credits.crew.forEach(person => {
          if (person.profile_path) {
            paths.push(person.profile_path)
          }
        })
      }
    }

    movie.recommendations.results.forEach(result => {
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
