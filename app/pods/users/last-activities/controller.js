import Controller from '@ember/controller'
import { inject as service } from '@ember/service'
import { task, timeout, all } from 'ember-concurrency'
import { set } from '@ember/object'

export default Controller.extend({
  progress: service('page-progress'),
  media: service(),

  id: null,

  lastActivities: null,

  init () {
    this._super(...arguments)

    this.lastActivities = []
  },

  fetch: task(function*(id) {
    if (id === this.id) {
      return
    }

    set(this, 'id', id)
    set(this, 'lastActivities', [])

    this.progress.reset()

    this.progress.update(40)

    yield all([
      timeout(500),
      this.fetchActivities.perform(id)
    ])

    this.progress.update(100)
  }),

  fetchActivities: task(function* (id) {
    yield this.store.find('fb-community-user-last', id).then(({ lasts }) => {
      for (const i in lasts) {
        const last = lasts[i]

        if (i === 'add') {
          this.lastActivities.pushObject({
            title: 'Dernier ajout',
            infos: [
              {
                message: 'Dans sa liste',
                value: last.value
              }
            ],
            createdAt: last.createdAt,
            movie: last.movie
          })
        } else if (i === 'favorite') {
          this.lastActivities.pushObject({
            title: 'Dernier favori',
            createdAt: last.createdAt,
            movie: last.movie
          })
        } else if (i === 'vote') {
          this.lastActivities.pushObject({
            title: 'Dernier vote',
            infos: [
              {
                message: 'A noté',
                value: `${last.value} / 10`
              }
            ],
            createdAt: last.createdAt,
            movie: last.movie
          })
        }
      }
    })
  })
});
