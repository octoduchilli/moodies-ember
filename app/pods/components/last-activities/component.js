import Component from '@ember/component'
import preloadImg from 'moodies-ember/mixins/preload-tmdb-img'
import { task, timeout, all } from 'ember-concurrency'
import { inject as service } from '@ember/service'
import { htmlSafe } from '@ember/string'

export default Component.extend(preloadImg, {
  notify: service('notification-messages'),
  store: service(),
  user: service('current-user'),

  tagName: 'ul',
  classNames: 'work',

  activities: null,

  init () {
    this._super(...arguments)

    this.activities = []

    this.fetch.perform()
  },

  actions: {
    updateUserProfileImgPos (x, y, scale) {
      return htmlSafe(`transform: translate(calc(-50% + ${x * (50 / 150)}px), calc(-50% + ${y * (50 / 150)}px)) scale(${scale})`)
    },
    slicedPseudo (pseudo) {
      return pseudo[0].toUpperCase()
    },
    notifyUserPrivate (user) {
      this.notify.error(`${user.pseudo} a mit son profil en privé. Vous ne pouvez pas y accéder`)
    }
  },

  fetch: task(function*() {
    yield all([
      timeout(500),
      this.store.findAll('fb-community-last').then(async lasts => {
        await this.preloadTMDBImg(this.__getPaths(lasts), false)

        lasts.forEach(async last => {
          const user = await this.store.find('fb-community-user', last.user.id).then(user => {
            if (user.profileImg) {
              return {
                id: user.id,
                pseudo: user.pseudo,
                path: user.profileImg.path,
                posX: user.profileImg.posX,
                posY: user.profileImg.posY,
                scale: user.profileImg.scale,
                private: user.private
              }
            } else {
              return last.user
            }
          })

          if (last.id === 'add') {
            this.activities.pushObject({
              title: 'Dernier ajout',
              infos: [
                {
                  message: 'Dans sa liste',
                  value: last.value,
                  valueId: last.valueId,
                  valueLink: 'users.lists'
                }
              ],
              createdAt: last.createdAt,
              movie: last.movie,
              user: user
            })
          } else if (last.id === 'favorite') {
            this.activities.pushObject({
              title: 'Dernier favori',
              createdAt: last.createdAt,
              movie: last.movie,
              user: user
            })
          } else if (last.id === 'vote') {
            this.activities.pushObject({
              title: 'Dernier vote',
              infos: [
                {
                  message: 'A noté',
                  value: `${last.value} / 10`
                }
              ],
              createdAt: last.createdAt,
              movie: last.movie,
              user: user
            })
          }
        })
      })
    ])
  }),

  __getPaths (items) {
    let paths = []

    items.forEach(item => {
      if (item.movie.path) {
        paths.push(item.movie.path)
      }

      if (item.user.path) {
        paths.push(item.user.path)
      }
    })

    return paths
  }
})
