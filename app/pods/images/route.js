import Route from '@ember/routing/route'
import { inject as service } from '@ember/service'
import { set } from '@ember/object'

export default Route.extend({
  user: service('current-user'),

  queryParams: {
    'images_type': {
      refreshModel: true
    }
  },

  async model ({ id }, { queryParams }) {
    return await this.store.find(`tmdb-${queryParams.images_type}-images`, id).then(async images => {
      set(images, 'images_type', queryParams.images_type)

      await this.store.find(`tmdb-${queryParams.images_type}`, id).then(_ => {
        if (_.title) {
          set(images, 'name', _.title)
        } else if (_.name) {
          set(images, 'name', _.name)
        }
      })

      this.user.addActivity({
        id: id,
        name: images.name,
        icon: 'image',
        type: 'images',
        query: {
          images_type: queryParams.images_type
        }
      })

      return images
    })
  },

  setupController (controller, model) {
    this._super(controller, model)

    controller.set('showImg', null)
  }
});
