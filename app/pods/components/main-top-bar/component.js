import Component from '@ember/component'
import { inject as service } from '@ember/service'
import { set, computed } from '@ember/object'

export default Component.extend({
  tagName: 'div',
  classNames: 'flex ali-center',

  sideBar: service(),
  router: service(),
  media: service(),
  store: service(),

  searchText: '',
  searchType: 'movie',

  typeOptions: null,

  fetch: null,

  currentRouteName: computed('router.currentRouteName', function () {
    const name = this.router.currentRouteName
    if (name === 'search') {
      return 'Recherche'
    } else if (name === 'discover') {
      return 'Bibliothèque'
    } else if (name === 'my-profile.my-lists') {
      return 'Mes listes'
    } else if (name === 'my-profile.informations') {
      return 'Mon profil'
    } else if (name === 'community') {
      return 'Communauté'
    } else if (name === 'images') {
      return 'Images'
    } else if (name === 'movie') {
      return 'Fiche de film'
    } else if (name === 'my-profile.votes') {
      return 'Mes votes'
    } else if (name === 'videos') {
      return 'Vidéos'
    } else if (name === 'person') {
      return 'Personnalité'
    } else if (name.indexOf('lists-pannel') !== -1) {
      if (name.indexOf('new') !== -1) {
        return 'Nouvelle liste'
      }

      return 'Édition de liste'
    } else if (name.indexOf('users') !== -1) {
      if (name.indexOf('statistics') !== -1) {
        return `Statistiques d'Utilis.`
      } else if (name.indexOf('lists') !== -1) {
        return `Listes d'Utilisateur`
      } else if (name.indexOf('votes') !== -1) {
        return `Votes d'Utilisateur`
      }

      return 'Utilisateur'
    }

    return ''
  }),

  init () {
    this._super(...arguments)

    this.typeOptions = {
      movie: {
        name: 'Films'
      },
      person: {
        name: 'Personnalités'
      }
    }
  },

  mouseLeave () {
    set(this, 'fetch', null)
  },

  actions: {
    search () {
      const text = this.searchText
      const type = this.searchType

      if (text) {
        this.store.queryRecord('tmdb-search', { type: type, query: text }).then(fetch => {
          set(this, 'fetch', fetch)
        })
      } else {
        set(this, 'fetch', null)
      }
    },
    resetFetch () {
      set(this, 'fetch', null)
    },
    toggleSideBar () {
      this.sideBar.toggle()
    }
  }
})
