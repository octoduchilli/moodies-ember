import Controller from '@ember/controller'
import { inject as service } from '@ember/service'
import { computed } from '@ember/object'
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
          title: `Affiches du film <span class="bold">${this.model.title}</span>`,
          secondTitle: `Actuellement ${this.model.posters.length} disponible${this.model.posters.length > 1 ? 's' : ''}`,
          images: this.model.posters
        },
        {
          title: `Fonds d'écran du film <span class="bold">${this.model.title}</span>`,
          secondTitle: `Actuellement ${this.model.backdrops.length} disponible${this.model.backdrops.length > 1 ? 's' : ''}`,
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
      const ratio = 270 / width

      return htmlSafe(`width: 270px; height: ${height * ratio}px`)
    },
    notifyNotConnected () {
      this.notify.info(`Vous n'êtes pas connecté...`)
    },
    updateUserImg (imgPath, dataPath) {
      this.user.updateInfos({
        [dataPath]: {
          id: this.model.id,
          path: imgPath,
          posX: 0,
          posY: 0,
          scale: 1
        }
      })

      this.notify.info(`Recadrez votre image de ${dataPath === 'profileImg' ? 'profil' : 'couverture'} sur votre page de profil`, {
        htmlContent: true
      })
    },
    html (html) {
      return htmlSafe(html)
    }
  }
});
