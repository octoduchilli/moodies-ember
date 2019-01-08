import Controller from '@ember/controller'
import { inject as service } from '@ember/service'
import { task, timeout, all } from 'ember-concurrency'
import { htmlSafe } from '@ember/string'
import { get, set, computed } from '@ember/object'

export default Controller.extend({
  progress: service('page-progress'),
  session: service(),
  notify: service('notification-messages'),
  router: service(),
  media: service(),
  user: service('current-user'),

  id: null,

  infos: null,

  bannerIsVisible: true,

  currentRouteName: computed('router.currentRouteName', function () {
    return this.router.currentRouteName
  }),

  actions: {
    styleCoverImg (x, y, scale) {
      let style = ''

      const ratio = this.media.isMobile ? window.innerWidth * 0.55970149253 / 150 : (window.innerWidth - 200) * 0.55970149253 / 150

      x = x * ratio
      y = y * ratio

      style += `transform: translate(calc(-50% + ${x || 0}px), calc(-50% + ${y || 0}px)) scale(${scale || 1})`

      return htmlSafe(style)
    },
    styleProfileImg (x, y, scale) {
      let style = ''

      const ratio = 200 / 150

      x = x * ratio
      y = y * ratio

      style += `transform: translate(calc(-50% + ${x || 0}px), calc(-50% + ${y || 0}px)) scale(${scale || 1})`

      return htmlSafe(style)
    },
    slicedPseudo (pseudo) {
      return pseudo[0].toUpperCase()
    }
  },

  fetch: task(function*(id) {
    this.progress.reset()

    this.progress.update(80)

    if (id !== this.id) {
      yield all([
        timeout(500),
        this.fetchInfos.perform(id)
      ])

      set(this, 'id', id)
    } else {
      yield this.fetchInfos.perform(id)
    }

    this.user.addActivity({
      id: id,
      name: this.infos.pseudo,
      icon: 'user',
      type: 'users.lists'
    })

    this.progress.update(100)
  }),

  fetchInfos: task(function* (id) {
    yield this.store.find('fb-community-user-infos', id).then(infos => {
      if (infos.private && get(this.session, 'uid') !== id) {
        this.notify.error(`${infos.pseudo} a mit son profil en privé. Vous ne pouvez pas y accéder`)

        this.router.transitionTo('community')
      }

      set(this, 'infos', infos)
    })
  })
});
