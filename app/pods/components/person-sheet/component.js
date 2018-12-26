import Component from '@ember/component';
import preloadImg from 'moodies-ember/mixins/preload-tmdb-img'
import lerpColor from 'moodies-ember/mixins/lerp-color'
import { inject as service } from '@ember/service';
import { task, timeout, all } from 'ember-concurrency';
import { computed } from '@ember/object'
import { htmlSafe } from '@ember/string'
import { set } from '@ember/object'

export default Component.extend(preloadImg, lerpColor, {
  tagName: 'div',

  progress: service('page-progress'),
  store: service(),
  user: service('current-user'),

  person: null,
  images: null,
  sliceMoviesCast: 10,
  sliceMoviesCrew: 10,

  backgroundPath: computed('person.images', function () {
    const person = this.person

    if (person && person.images) {
      let images = person.images.profiles

      if (images.length > 0) {
        images = images.sort((a, b) => b.width - a.width)

        return images[0].file_path
      }

      return person.profile_path
    }

    return null
  }),

  slicedMoviesCast: computed('person.credits.cast', 'sliceMoviesCast', function () {
    const person = this.person

    if (person && person.credits) {
      let cast = person.credits.cast

      cast.sort((a, b) => b.popularity - a.popularity)

      cast = Array.from(cast.reduce((m, t) => m.set(t.id, t), new Map()).values())

      return cast.slice(0, this.sliceMoviesCast)
    }

    return null
  }),

  slicedMoviesCrew: computed('person.credits.crew', 'sliceMoviesCrew', function () {
    const person = this.person

    if (person && person.credits) {
      let crew = person.credits.crew

      crew.sort((a, b) => b.popularity - a.popularity)

      crew = Array.from(crew.reduce((m, t) => m.set(t.id, t), new Map()).values())

      return crew.slice(0, this.sliceMoviesCrew)
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
    showMoreMovies (array, slice, sliceKey) {
      if (array.length > slice) {
        set(this, sliceKey, slice + 10)
      }
    },
    showAllMovies (array, sliceKey) {
      set(this, sliceKey, array.length)
    },
    resetMovies (sliceKey, className) {
      set(this, sliceKey, 10)

      setTimeout(() => {
        window.scroll({
          top: document.getElementsByClassName(className)[0].offsetTop - 150,
          behavior: 'smooth'
        })
      })
    },
    knownFor (department) {
      let person = this.person

      if (person && department) {
        if (department === 'Costume & Make-Up') {
          return 'Costume et maquillage'
        }

        if (department === 'Acting') {
          if (person.gender === 1) {
            return 'Actrice'
          }

          return 'Acteur'
        }

        if (department === 'Production') {
          if (person.gender === 1) {
            return 'Productrice'
          }

          return 'Producteur'
        }

        if (department === 'Sound') {
          return 'Ingénieur du son'
        }

        if (department === 'Directing') {
          return 'Réalisation'
        }

        if (department === 'Writing') {
          return 'Écriture'
        }

        if (department === 'Editing') {
          return 'Édition'
        }

        if (department === 'Crew') {
          return 'Équipe technique'
        }

        if (department === 'Camera') {
          return 'Image'
        }

        if (department === 'Art') {
          return 'Artistique'
        }

        if (department === 'Visual Effects') {
          return 'Effets visuels'
        }
      }

      return 'Inconnu'
    }
  },

  fetch: task(function* (id) {
    this.progress.reset()

    this.progress.update(40)

    yield all([
      timeout(500),
      this.fetchPerson.perform(id)
    ])

    this.progress.update(80)

    yield this.preloadTMDBImg(this.__getPaths(this.person), true)

    return this.progress.update(100)
  }).restartable(),

  fetchPerson: task(function*(id) {
    yield this.store.find('tmdb-person', id).then(person => {
      set(this, 'person', person)
      set(this, 'images', person.images)
    })

    this.user.addActivity({
      id: this.person.id,
      name: this.person.name,
      icon: 'search',
      type: 'person'
    })
  }),

  __getPaths (person) {
    let paths = []

    if (person.profile_path) {
      paths.push(person.profile_path)
    }

    if (person.backdrop_path) {
      paths.push(person.backdrop_path)
    }

    if (person.credits) {
      person.credits.cast.forEach(movie => {
        paths.push(movie.poster_path)
      })

      person.credits.crew.forEach(movie => {
        paths.push(movie.poster_path)
      })
    }

    return paths
  },
});
