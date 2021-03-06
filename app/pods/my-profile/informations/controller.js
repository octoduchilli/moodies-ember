import Controller from '@ember/controller'
import genres from 'moodies-ember/data/genres'
import { task, timeout, all } from 'ember-concurrency'
import { get, set, computed } from '@ember/object'
import { inject as service } from '@ember/service'
import { htmlSafe } from '@ember/string'

export default Controller.extend({
  firebaseApp: service(),
  session: service(),
  user: service('current-user'),

  genresItems: null,

  imgDataPathToCenter: null,

  errorPseudo: '',
  pseudo: computed('user.infos.pseudo', function () {
    if (this.user.infos) {
      return this.user.infos.pseudo
    }

    return null
  }),

  moviesDataWithListsAndVotes: null,

  totalMovies: null,
  totalMoviesViewed: null,
  totalMoviesFavorite: null,
  likedGenres: null,
  totalVotes: null,

  init () {
    this._super(...arguments)

    this.genresItems = genres
  },

  actions: {
    async updatePrivateSetting (check) {
      await this.user.updateInfos({ private: check })

      this.user.__updateCommunityUser()
    },
    minToMDHM (min) {
      let M = Math.floor(min / (24 * 30 * 60)) % 12
      let D = Math.floor(min / (24 * 60)) % 30
      let H = Math.floor(min / 60) % 24
      let m = min % 60
      return `${M} mois, ${D} jours, ${H} heures, ${m} minutes`
    },
    updateUserColorStyle (color, attr) {
      return htmlSafe(`${attr}: ${color}`)
    },
    async removeUserImg (img) {
      await this.user.updateInfos({ [img]: null })

      set(this.user.infos, img, null)
    },
    updateUserProfileImgPos (x, y, scale) {
      return htmlSafe(`transform: translate(calc(-50% + ${x * (50 / 150)}px), calc(-50% + ${y * (50 / 150)}px)) scale(${scale})`)
    },
    signOut () {
      this.user.signOut()
    },
    openCenterImg (path) {
      set(this, 'imgDataPathToCenter', path)
    },
    closeCenterImg () {
      set(this, 'imgDataPathToCenter', null)
    }
  },

  saveCenterImg: task(function*() {
    yield timeout(750)

    set(this, 'imgDataPathToCenter', null)
  }),

  updateColorSetting: task(function*(color) {
    yield timeout(750)

    yield this.user.updateInfos({ color: color })
  }).restartable(),

  initStatistics: task(function*() {
    while (this.user.fetch.isRunning) {
      yield timeout(300)
    }

    this.__initMoviesDataWithListsAndVotes()

    this.__initAllStats()
  }),

  __initMoviesDataWithListsAndVotes () {
    let moviesDataWithLists = this.user.movies.map(movie => {
      const movieData = this.user.moviesData.findBy('id', movie.id)

      return Object.assign(movie, { runtime: movieData.runtime, genres: movieData.genres })
    })

    this.user.votes.forEach(vote => {
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

    if (totalVotes.average) {
      totalVotes.average = totalVotes.average / totalVotes.total

      totalVotes.average = totalVotes.average.toFixed(1)
    }

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
  },

  savePseudo: task(function*() {
    const pseudoErrors = yield this.__validPseudo(this.pseudo)

    if (!this.pseudo) {
      set(this, 'errorPseudo', 'Ne peut pas être vide')
    } else if (pseudoErrors === 'invalid-pseudo') {
      set(this, 'errorPseudo', 'Lettres et des chiffres uniquement')
    } else if (pseudoErrors === 'used-pseudo') {
      set(this, 'errorPseudo', 'Ce pseudo est déjà utilisé')
    } else if (pseudoErrors === 'current-pseudo') {
      set(this, 'errorPseudo', 'Vous utilisez déjà ce pseudo')
    } else {
      yield this.user.updateInfos({
        pseudo: this.pseudo,
        pseudoLower: this.pseudo.toLowerCase(),
        pseudoInverseLower: this.__inverseCharCode(this.pseudo.toLowerCase()),
        createdAt: new Date().toString(),
        modifiedAt: new Date().toString()
      })

      set(this.user.infos, 'pseudo', this.pseudo)
    }
  }).restartable(),

  async __validPseudo (pseudo) {
    const isValid = pseudo.match(/^[a-z0-9]+$/i)

    if (!isValid) {
      return 'invalid-pseudo'
    }

    let used = false
    let current = false

    await this.firebaseApp.database().ref('users').orderByChild('infos/pseudoLower').equalTo(pseudo.toLowerCase()).once('value', snap => {
      snap = snap.val()

      if (!snap) {
        return
      }

      if (snap[get(this.session, 'uid')]) {
        return current = true
      }

      if (snap) {
        used = true
      }
    })

    if (used) {
      return 'used-pseudo'
    }

    if (current) {
      return 'current-pseudo'
    }
  },

  __inverseCharCode (str) {
    let final = ''

    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) < 58) {
        final += String.fromCharCode(57 - str.charCodeAt(i) + 48)
      } else {
        final += String.fromCharCode(122 - str.charCodeAt(i) + 97)
      }
    }

    return final
  }
})
