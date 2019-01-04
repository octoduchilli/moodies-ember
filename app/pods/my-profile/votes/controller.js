import Controller from '@ember/controller'
import filtersHelper from 'moodies-ember/mixins/filters-helper'
import { inject as service } from '@ember/service'
import { task, timeout } from 'ember-concurrency'
import { set } from '@ember/object'

export default Controller.extend(filtersHelper, {
  queryFilters: service(),
  session: service(),
  user: service('current-user'),

  isFetchingNextPage: false,
  isLeaving: false,
  scrollY: null,
  page: 1,

  votes: null,
  votesSliced: null,

  sort: null,

  init () {
    this._super(...arguments)

    this.votes = []
    this.votesSliced = []

    this.sort = {
      selected: null,
      key: 'sort_by',
      items: [
        {
          id: 0,
          name: 'Par défaut (date de vote ↗)',
          value: 'vote_date.desc'
        },
        {
          id: 1,
          name: 'Date de vote ↘',
          value: 'vote_date.asc'
        },
        {
          id: 2,
          name: 'Date de modification ↗',
          value: 'modification_date.desc'
        },
        {
          id: 3,
          name: 'Date de modification ↘',
          value: 'modification_date.asc'
        },
        {
          id: 4,
          name: 'Titre de A à Z',
          value: 'title.desc'
        },
        {
          id: 5,
          name: 'Titre de Z à A',
          value: 'title.asc'
        }
      ]
    }

    this.queryKeys = ['sort_by']

    this.queryFilters.setKeys(this, this.queryKeys)
  },

  actions: {
    sortUpdate (sort) {
      if (sort.length === 0) {
        this.queryFilters.updateFilter('sort_by', null, true)
      } else {
        this.queryFilters.updateFilter('sort_by', sort.firstObject.value, true)
      }
    },
    setTopbarHeight (height) {
      document.getElementsByClassName('my-profile__votes')[0].style.paddingTop = `${height}px`
    },
    resetFilters () {
      this.queryFilters.resetQuery()
    },
    actualiseFilters () {
      this.__fetchData.perform()
    },
    setScroll (scrollY) {
      set(this, 'scrollY', scrollY)

      this.__nextPage()
    },
    updatedItems () {
      set(this, 'isFetchingNextPage', false)

      this.__nextPage()
    },
    removeVote (vote) {
      this.votes.removeObject(vote)
    }
  },

  __waitUserFetch: task(function* () {
    while (this.user.fetch.isRunning) {
      yield timeout(200)
    }

    this.__checkFiltersValue([this.sort])
  }),

  __nextPage () {
    if (!this.isFetchingNextPage && this.votes) {
      set(this, 'isFetchingNextPage', true)

      const page = this.page
      const totalPages = Math.round(this.votes.length / 20) + 1
      const { offsetTop, offsetHeight } = document.getElementsByClassName('vote-list')[0]
      const bottomPosition = offsetTop + offsetHeight

      if (page < totalPages) {
        if (bottomPosition - window.innerHeight * 3 <= window.innerHeight + window.scrollY) {
          this.incrementProperty('page')

          this.__updateVotesSliced()
        }
      }
    }
  },

  __updateVotesSliced () {
    this.votesSliced.removeObjects(this.votesSliced)

    this.votes.slice(0, this.page * 20).forEach(item => {
      this.votesSliced.pushObject(item)
    })
  },

  __fetchData: task(function*() {
    window.scroll({
      top: 0
    })

    set(this, 'scrollY', 0)
    set(this, 'page', 1)

    yield timeout(750)

    if (this.user.votes) {
      const votes = this.user.votes.map(vote => {
        const movie = this.user.moviesData.findBy('id', vote.id)

        return {
          id: vote.id,
          title: movie.title,
          poster_path: movie.poster_path,
          average: vote.average,
          createdAt: vote.createdAt,
          modifiedAt: vote.modifiedAt
        }
      })

      if (this.sort.selected) {
        if (this.sort.selected.value === 'vote_date.desc') {
          votes.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt) - new Date(a.createdAt)
            }
          })
        } else if (this.sort.selected.value === 'vote_date.asc') {
          votes.sort((b, a) => {
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt) - new Date(a.createdAt)
            }
          })
        } else if (this.sort.selected.value === 'modification_date.desc') {
          votes.sort((a, b) => {
            if (a.modifiedAt && b.modifiedAt) {
              return new Date(b.modifiedAt) - new Date(a.modifiedAt)
            }
          })
        } else if (this.sort.selected.value === 'modification_date.asc') {
          votes.sort((b, a) => {
            if (a.modifiedAt && b.modifiedAt) {
              return new Date(b.modifiedAt) - new Date(a.modifiedAt)
            }
          })
        } else if (this.sort.selected.value === 'title.desc') {
          votes.sort((b, a) => ('' + b.title).localeCompare(a.title))
        } else if (this.sort.selected.value === 'title.asc') {
          votes.sort((a, b) => ('' + b.title).localeCompare(a.title))
        }
      } else {
        votes.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt)
          }
        })
      }

      set(this, 'votes', votes)

      this.__updateVotesSliced()
    }
  })
})
