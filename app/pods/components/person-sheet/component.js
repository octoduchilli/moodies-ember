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

  person: null,
  isShowingPoster: false,

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

  knownFor: computed('person.known_for_department', function () {
    let person = this.person

    if (person && person.known_for_department) {
      const knownFor = person.known_for_department

      if (knownFor === 'Costume & Make-Up') {
        return 'Création de costume et maquillage'
      }

      if (knownFor === 'Acting') {
        if (person.gender === 1) {
          return 'Actrice'
        }

        return 'Acteur'
      }

      if (knownFor === 'Production') {
        return 'Producteur'
      }

      if (knownFor === 'Sound') {
        return 'Ingénieur du son'
      }

      if (knownFor === 'Directing') {
        return 'Réalisation'
      }

      if (knownFor === 'Writing') {
        return 'Écriture'
      }

      if (knownFor === 'Editing') {
        return 'Édition'
      }

      if (knownFor === 'Crew') {
        return 'Équipe technique'
      }

      if (knownFor === 'Camera') {
        return 'Image'
      }

      if (knownFor === 'Art') {
        return 'Artistique'
      }

      if (knownFor === 'Visual Effects') {
        return 'Effets visuels'
      }
    }

    return null
  }),

  moviesCast: computed('person.credits.cast', function () {
    const person = this.person

    if (person && person.credits) {
      let cast = person.credits.cast

      cast.sort((a, b) => b.popularity - a.popularity)

      cast = Array.from(cast.reduce((m, t) => m.set(t.id, t), new Map()).values())

      return cast
    }

    return null
  }),

  moviesCrew: computed('person.credits.crew', function () {
    const person = this.person

    if (person && person.credits) {
      let crew = person.credits.crew

      crew.sort((a, b) => b.popularity - a.popularity)

      crew = Array.from(crew.reduce((m, t) => m.set(t.id, t), new Map()).values())

      return crew
    }

    return null
  }),

  didReceiveAttrs() {
    set(this, 'person', null)

    if (this.personId) {
      this.__fetchData.perform(this.personId);
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

  __fetchData: task(function* (personId) {
    this.progress.reset()

    yield all([
      timeout(500),
      this.__fetchPerson(personId)
    ])

    return this.progress.update(100)
  }).restartable(),

  async __fetchPerson (personId) {
    let person = null

    await this.store.find('tmdb-person', personId).then(_ => {
      person = _
    })

    this.user.addActivity({
      id: person.id,
      name: person.name,
      icon: 'search',
      type: 'person'
    })

    await this.preloadTMDBImg(this.__getPaths(person), true)

    return set(this, 'person', person)
  },

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
