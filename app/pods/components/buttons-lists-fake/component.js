import Component from '@ember/component'
import { inject as service } from '@ember/service'
import { htmlSafe } from '@ember/string'

export default Component.extend({
  tagName: 'ul',
  classNames: 'flex work',

  user: service('current-user'),

  basicLists: null,

  movie: null,

  init () {
    this._super(...arguments)

    this.basicLists = [
      {
        id: 'eye',
        name: 'Visionnés',
        icon: 'eye',
        color: 'lightgreen'
      },
      {
        id: 'heart',
        name: 'Coups de coeurs',
        icon: 'heart',
        color: 'red'
      },
      {
        id: 'plus',
        name: 'Autres listes',
        icon: 'plus',
        color: 'white'
      }
    ]

    if (this.user.movies) {
      const movie = this.user.movies.findBy('id', String(this.movie.id))

      if (movie) {
        movie.lists.forEach(listId => {
          if (listId === 'eye') {
            this.basicLists[0].isSelected = true
          } else if (listId === 'heart') {
            this.basicLists[1].isSelected = true
          } else {
            this.basicLists[2].isSelected = true
          }
        })
      }
    }
  },

  actions: {
    listColor (isSelected, color) {
      if (!isSelected) {
        return htmlSafe('border: 2px solid rgba(0, 0, 0, 0)')
      } else {
        return htmlSafe(`border: 2px solid ${color}`)
      }
    }
  }
});
