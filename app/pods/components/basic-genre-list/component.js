import Component from '@ember/component'
import genres from 'moodies-ember/data/genres'
import { inject as service } from '@ember/service'
import { htmlSafe } from '@ember/string'
import { typeOf } from '@ember/utils'

export default Component.extend({
  user: service('current-user'),

  tagName: 'ul',
  classNames: 'work',

  genres: null,
  genresWithData: null,

  init () {
    this._super(...arguments)

    this.genresWithData = this.genres.map(genre => {
      let id

      if (typeOf(genre) === 'object') {
        id = genre.id
      } else {
        id = genre
      }

      genre = genres.findBy('value', Number(id))

      if (genre) {
        return Object({
          id: id,
          name: genre.name,
          icon: genre.icon
        })
      }
    })
  },

  actions: {
    genreIcon (svgHtml) {
      return htmlSafe(svgHtml)
    }
  }
})
