import Component from '@ember/component'
import { task, timeout } from 'ember-concurrency'
import { inject as service } from '@ember/service'
import { set } from '@ember/object'
import { htmlSafe } from '@ember/string'

export default Component.extend({
  tagName: 'div',
  classNames: 'flex ali-center work',

  firebaseApp: service(),
  session: service(),
  notify: service('notification-messages'),
  router: service(),
  store: service(),
  user: service('current-user'),

  isShowingSignInPopup: false,
  emailSignIn: '',
  passwordSignIn: '',
  errorEmailSignIn: '',
  errorPasswordSignIn: '',
  manyRequestsSignIn: false,

  isShowingSignUpPopup: false,
  firstnameSignUp: '',
  lastnameSignUp: '',
  pseudoSignUp: '',
  emailSignUp: '',
  passwordSignUp: '',
  errorFirstnameSignUp: '',
  errorLastnameSignUp: '',
  errorPseudoSignUp: '',
  errorEmailSignUp: '',
  errorPasswordSignUp: '',

  actions: {
    async signOut () {
      await this.session.close()

      this.user.resetUser()
    },
    styleUserColor (color, attr) {
      if (!color) {
        color = '#fbfcff'
      }

      let c = color.substring(1)
      let rgb = parseInt(c, 16)
      let r = (rgb >> 16) & 0xff
      let g = (rgb >>  8) & 0xff
      let b = (rgb >>  0) & 0xff

      let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b

      let str = `${attr}: ${color};`

      if (luma > 255 / 2) {
        str += 'color: black'
      } else {
        str += 'color: white'
      }

      return htmlSafe(str)
    }
  },

  signIn: task(function* () {
    if (!this.emailSignIn) {
      set(this, 'errorEmailSignIn', 'Renseignez votre email')
    } else if (!this.passwordSignIn) {
      set(this, 'errorPasswordSignIn', 'Renseignez votre mot de passe')
    } else {
      yield this.session.open('firebase', { provider: 'password', email: this.emailSignIn, password: this.passwordSignIn }).then(async () => {
        await this.user.fetch.perform()

        this.router.transitionTo('my-profile.informations')

        set(this, 'isShowingSignInPopup', false)
      }).catch(errors => {
        if (errors.code === 'auth/user-not-found' || errors.code === 'auth/invalid-email') {
          return set(this, 'errorEmailSignIn', 'Vérifiez votre email')
        }

        if (errors.code === 'auth/wrong-password') {
          return set(this, 'errorPasswordSignIn', 'Vérifiez votre mot de passe')
        }

        if (errors.code === 'auth/too-many-requests') {
          set(this, 'manyRequestsSignIn', true)
        }
      })
    }
  }),

  signUp: task(function* () {
    if (!this.firstnameSignUp) {
      set(this, 'errorFirstnameSignUp', 'Renseignez votre nom')
    } else if (!this.lastnameSignUp) {
      set(this, 'errorLastnameSignUp', 'Renseignez votre prénom')
    } else if (!this.pseudoSignUp) {
      set(this, 'errorPseudoSignUp', 'Renseignez votre pseudo')
    } else if (!this.emailSignUp) {
      set(this, 'errorEmailSignUp', 'Renseignez votre email')
    } else if (!this.passwordSignUp) {
      set(this, 'errorPasswordSignUp', 'Renseignez votre mot de passe')
    } else {
      const pseudoErrors = yield this.__validPseudo(this.pseudoSignUp)

      if (pseudoErrors === 'invalid-pseudo') {
        set(this, 'errorPseudoSignUp', 'Lettres et des chiffres uniquement')
      } else if (pseudoErrors === 'used-pseudo') {
        set(this, 'errorPseudoSignUp', 'Ce pseudo est déjà utilisé')
      } else {
        const userCreated = yield this.firebaseApp.auth().createUserWithEmailAndPassword(this.emailSignUp, this.passwordSignUp).then(() => true).catch(error => {
          if (error.code === 'auth/invalid-email') {
            set(this, 'errorEmailSignUp', 'Vérifiez votre email')
          }

          if (error.code === 'auth/weak-password') {
            set(this, 'errorPasswordSignUp', 'Minimum 6 caractères')
          }

          if (error.code === 'auth/email-already-in-use') {
            set(this, 'errorEmailSignUp', 'Cet email à déjà été utilisé')
          }

          return false
        })

        if (!userCreated) {
          return
        }

        yield timeout(1000)

        yield this.session.open('firebase', { provider: 'password', email: this.emailSignUp, password: this.passwordSignUp })

        yield this.user.createInfos({
          firstname: this.firstnameSignUp,
          lastname: this.lastnameSignUp,
          pseudo: this.pseudoSignUp,
          pseudoLower: this.pseudoSignUp.toLowerCase(),
          pseudoLowerInverse: this.__inverseCharCode(this.pseudoSignUp.toLowerCase()),
          createdAt: new Date().toString(),
          modifiedAt: new Date().toString()
        })

        set(this, 'isShowingSignUpPopup', false)

        this.router.transitionTo('my-profile.informations')

        this.notify.success(`Bienvenue à toi ${this.pseudoSignUp} !`)
      }
    }
  }),

  async __validPseudo (pseudo) {
    const isValid = pseudo.match(/^[a-z0-9]+$/i)

    if (!isValid) {
      return 'invalid-pseudo'
    }

    let used = false

    await this.firebaseApp.database().ref('users').orderByChild('infos/pseudoLower').equalTo(pseudo.toLowerCase()).once('value', snap => {
      snap = snap.val()

      if (snap) {
        used = true
      }
    })

    if (used) {
      return 'used-pseudo'
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
