import Controller from '@ember/controller'
import genres from 'moodies-ember/data/genres'
import { inject as service } from '@ember/service'
import { task, timeout } from 'ember-concurrency'
import { get, set, computed } from '@ember/object'
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

  //TODO computed user.movies.@each not actualised in deep when movie.lists is updated

  totalMovies: computed('user.movies.@each', function () {
    let totalRuntime = 0

    if (this.user.movies) {
      this.user.movies.forEach(movie => {
        const { runtime } = this.user.moviesData.findBy('id', movie.id)

        totalRuntime += runtime || 0
      })
    }

    return {
      total: this.user.movies ? this.user.movies.length : 0,
      totalRuntime: totalRuntime,
    }
  }),

  totalViewedMovies: computed('user.movies.@each', function () {
    let total = 0
    let totalRuntime = 0

    if (this.user.movies) {
      this.user.movies.forEach(movie => {
        if (movie.lists.find(list => list === 'eye')) {
          const { runtime } = this.user.moviesData.findBy('id', movie.id)

          totalRuntime += runtime || 0
          total++
        }
      })
    }

    return {
      total: total,
      totalRuntime: totalRuntime,
    }
  }),

  totalFavoriteMovies: computed('user.movies.@each', function () {
    let total = 0
    let totalRuntime = 0

    if (this.user.movies) {
      this.user.movies.forEach(movie => {
        if (movie.lists.find(list => list === 'heart')) {
          const { runtime } = this.user.moviesData.findBy('id', movie.id)

          totalRuntime += runtime || 0
          total++
        }
      })
    }

    return {
      total: total,
      totalRuntime: totalRuntime,
    }
  }),

  likedGenres: computed('user.movies.@each', function () {
    let genresCounter = {}

    if (this.user.movies) {
      this.user.movies.forEach(movie => {
        const { genres } = this.user.moviesData.findBy('id', movie.id)

        if (genres) {
          genres.forEach(genre => {
            if (genresCounter[genre.id]) {
              genresCounter[genre.id] += 1
            } else {
              genresCounter[genre.id] = 1
            }
          })
        }
      })
    }

    return Object.entries(genresCounter).sort((a, b) => b[1] - a[1]).slice(0, 3).map(genre => {
      const g = this.genresItems.find(_ => Number(_.value) === Number(genre[0]))

      return {
        id: g.value,
        name: g.name,
        total: genre[1]
      }
    })
  }),

  totalVotes: computed('user.votes.@each.average', function () {
    let total = 0
    let average = null

    if (this.user.votes) {
      total = this.user.votes.length

      if (total) {
        average = this.user.votes.map(vote => vote.average).reduce((a, b) => a + b) / total
      }
    }

    return {
      total: total,
      average: average
    }
  }),

  init () {
    this._super(...arguments)

    this.genresItems = genres

    this.user.fetchVotes.perform()
  },

  actions: {
    updatePrivateSetting (check) {
      this.user.updateInfos({ private: check })
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
