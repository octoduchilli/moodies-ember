import Route from '@ember/routing/route'
import RouteHistoryMixin from 'ember-route-history/mixins/routes/route-history'
import { set } from '@ember/object'

export default Route.extend(RouteHistoryMixin, {
  model () {
    return this.store.findAll('fb-community-last').then(lasts => {
      let model = {}

      lasts.forEach(last => set(model, last.id, last))

      return model
    })
  },

  setupController (controller, model) {
    this._super(controller, model)

    controller.set('activityList', [])

    controller.get('activityList').pushObject(Object.assign(
      {},
      {
        title: 'Dernier ajout',
        infos: [
          {
            message: 'Dans sa liste',
            value: model.add.value
          }
        ],
        createdAt: model.add.createdAt,
        movie: model.add.movie,
        user: model.add.user
      }
    ))
    controller.get('activityList').pushObject(Object.assign(
      {},
      {
        title: 'Dernier favori',
        createdAt: model.favorite.createdAt,
        movie: model.favorite.movie,
        user: model.favorite.user
      }
    ))
    controller.get('activityList').pushObject(Object.assign(
      {},
      {
        title: 'Dernier vote',
        infos: [
          {
            message: 'A noté',
            value: `${model.vote.value} / 10`
          }
        ],
        createdAt: model.vote.createdAt,
        movie: model.vote.movie,
        user: model.vote.user
      }
    ))
  }
});
