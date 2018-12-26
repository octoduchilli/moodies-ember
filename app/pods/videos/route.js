import Route from '@ember/routing/route'
import { inject as service } from '@ember/service'

export default Route.extend({
  user: service('current-user'),

  async model ({ id }) {
    return await this.store.find('tmdb-movie', id).then(movie => {
      this.user.addActivity({
        id: id,
        name: movie.title,
        icon: 'youtube',
        type: 'videos'
      })

      return { videos: movie.videos.results}
    })
  }
});
