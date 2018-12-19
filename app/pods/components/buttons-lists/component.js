import Component from '@ember/component'
import { inject as service } from '@ember/service'
import { set, get } from '@ember/object'
import { htmlSafe } from '@ember/string'

export default Component.extend({
  tagName: 'ul',
  classNames: 'flex work',

  firebaseApp: service(),
  session: service(),
  store: service(),
  user: service('current-user'),

  basicLists: null,
  otherLists: null,

  otherListsOpen: true,

  movie: null,

  init () {
    this._super(...arguments)

    this.basicLists = [
      {
        id: 'eye',
        name: 'Visionnés',
        icon: 'eye',
        color: 'lightgreen'
      },
      {
        id: 'heart',
        name: 'Coups de coeurs',
        icon: 'heart',
        color: 'red'
      },
      {
        id: 'plus',
        name: 'Autres listes',
        icon: 'plus',
        color: 'white'
      }
    ]

    this.otherLists = this.user.lists.map(list => {
      return {
        id: list.id,
        name: list.name,
        label: list.label,
        color: list.color
      }
    })

    const movie = this.user.movies.findBy('id', String(this.movie.id))

    if (movie) {
      this.movieLists = movie.lists

      this.movieLists.forEach(listId => {
        if (listId === 'eye') {
          this.basicLists[0].isSelected = true
        } else if (listId === 'heart') {
          this.basicLists[1].isSelected = true
        } else {
          this.otherLists.find(list => list.id === listId).isSelected = true

          this.basicLists[2].isSelected = true
        }
      })
    }
  },

  didInsertElement () {
    this._super(...arguments)

    this.__setOtherListsElPosition()
  },

  actions: {
    async selectOrDeselect (list) {
      if (list.isSelected) {
        await this.firebaseApp.database().ref(`users/${get(this.session, 'uid')}/films/${this.movie.id}`).update({ [list.id]: null })

        this.__updateUserMoviesAndUserMoviesData(list, false)

        set(list, 'isSelected', false)
      } else {
        await this.firebaseApp.database().ref(`users/${get(this.session, 'uid')}/films/${this.movie.id}`).update({ [list.id]: true })

        this.__updateUserMoviesAndUserMoviesData(list, true)

        set(list, 'isSelected', true)
      }

      this.__updatePlusIsSelected()
    },
    openOtherLists () {
      this.toggleProperty('otherListsOpen')
    },
    listColor (isSelected, color) {
      if (!isSelected) {
        return htmlSafe('border: 2px solid rgba(0, 0, 0, 0)')
      } else {
        return htmlSafe(`border: 2px solid ${color}`)
      }
    }
  },

  async __updateUserMoviesAndUserMoviesData (list, value) {
    const movie = this.user.movies.find(movie => String(movie.id) === String(this.movie.id))

    if (movie) {
      if (value) {
        movie.lists.push(list.id)
      } else {
        movie.lists.splice(movie.lists.indexOf(list.id), 1)
      }

      if (movie.lists.length === 0) {
        this.user.movies.removeObject(movie)

        this.user.addActivity({
          id: this.movie.id,
          name: this.movie.title,
          icon: 'trash',
          type: 'movie'
        })
      } else {
        this.user.addActivity({
          id: this.movie.id,
          name: this.movie.title,
          icon: 'pencil',
          type: 'movie'
        })
      }
    } else {
      const movieData = await this.store.find('tmdb-movie', this.movie.id).then(data => data)
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

      await this.firebaseApp.database().ref(`films/added/${this.movie.id}`).set(obj)

      await this.store.find('fb-movies-data', movieData.id)

      this.user.moviesData.pushObject(obj)

      this.user.movies.pushObject({
        id: String(this.movie.id),
        lists: [list.id]
      })

      this.user.addActivity({
        id: this.movie.id,
        name: this.movie.title,
        icon: 'plus-circle',
        type: 'movie'
      })
    }
  },

  __setOtherListsElPosition () {
    const plusButtonEl = document.getElementsByClassName(`${this.movie.id}__button-basic-list`)[2]
    const otherListsEl = document.getElementsByClassName(`${this.movie.id}__other-lists`)[0]

    const { offsetHeight, offsetWidth, offsetTop, offsetLeft } = plusButtonEl

    otherListsEl.style.top = `${offsetHeight + offsetTop + 10}px`
    otherListsEl.style.left = `${offsetWidth / 2 + offsetLeft}px`

    this.toggleProperty('otherListsOpen')
  },

  __updatePlusIsSelected () {
    set(this.basicLists[2], 'isSelected', this.otherLists.every(list => !list.isSelected) === false)
  }
});
