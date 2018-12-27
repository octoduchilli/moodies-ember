import Controller from '@ember/controller'
import { inject as service } from '@ember/service'
import { computed, set } from '@ember/object'
import { htmlSafe } from '@ember/string'

export default Controller.extend({
  session: service(),
  notify: service('notification-messages'),
  user: service('current-user'),

  showImg: null,

  imageSections: computed('model', function () {
    if (this.model.images_type === 'movie') {
      return [
        {
          title: 'Affiches',
          images: this.model.posters
        },
        {
          title: `Fonds d'écran`,
          images: this.model.backdrops
        }
      ]
    } else if (this.model.images_type === 'person') {
      return [
        {
          title: 'Photos',
          images: this.model.profiles
        }
      ]
    }
  }),

  actions: {
    setPosterLarger (width, height) {
      const ratio = 300 / width

      return htmlSafe(`width: 300px; height: ${height * ratio}px`)
    },
    notifyNotConnected () {
      this.notify.info(`Vous n'êtes pas connecté...`)
    },
    updateUserImg (imgPath, dataPath) {
      this.user.updateInfos({
        [dataPath]: {
          path: imgPath
        }
      })

      set(this.user.infos, dataPath, {
        path: imgPath
      })

      this.notify.info(`Centrez votre image de ${dataPath === 'profileImg' ? 'profil' : 'couverture'} sur votre page de profile`, {
        htmlContent: true
      })
    }
  }
});
