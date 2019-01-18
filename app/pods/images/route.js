import Route from '@ember/routing/route'
import RSVP from 'rsvp'
import { inject as service } from '@ember/service'
import { set } from '@ember/object'

export default Route.extend({
  user: service('current-user'),

  queryParams: {
    'images_type': {
      refreshModel: true
    }
  },

  beforeModel () {
    window.scroll({
      top: 0
    })
  },

  async model ({ id }, { queryParams }) {
    const { posters, backdrops, images_type } = await this.store.find(`tmdb-${queryParams.images_type}-images`, id).then(async images => {
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

    return await RSVP.hash({
      id: id,
      posters: posters,
      backdrops: backdrops,
      images_type: images_type,
      title: this.store.find('tmdb-movie', id).then(movie => movie.title)
    })
  },

  setupController (controller, model) {
    this._super(controller, model)

    controller.set('showImg', null)
  }
});
