import Route from '@ember/routing/route'
import { inject as service } from '@ember/service'

export default Route.extend({
  user: service('current-user'),

  beforeModel () {
    window.scroll({
      top: 0
    })
  },

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
