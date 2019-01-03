import Controller from '@ember/controller'
import { task, timeout, all } from 'ember-concurrency'
import { inject as service } from '@ember/service'
import { set, get } from '@ember/object'

export default Controller.extend({
  queryFilters: service(),
  progress: service('page-progress'),
  session: service(),

  isFetchingNextPage: false,
  isLeaving: false,
  scrollY: null,
  page: 1,

  id: null,

  votes: null,
  votesSliced: null,

  sort: null,
  sortItems: null,

  userInfos: null,
  userVotes: null,
  moviesData: null,

  init () {
    this._super(...arguments)

    this.votes = []
    this.votesSliced = []
    this.moviesData = []

    this.sortItems = [
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

    this.queryKeys = ['sort_by']

    this.queryFilters.setKeys(this, this.queryKeys)
  },

  actions: {
    sortUpdate (sort) {
      if (sort.length === 0) {
        this.__update('sort_by', null)
      } else {
        this.__update('sort_by', sort.firstObject.value)
      }
    },
    resetFilters () {
      this.queryFilters.resetQuery()
    },
    actualiseFilters () {
      this.initVotes.perform()
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

  __update (key, value) {
    this.queryFilters.updateKeys(key, value)

    this.queryFilters.transition()
  },

  __checkFiltersValue: task(function* () {
    while (this.fetch.isRunning) {
      yield timeout(300)
    }

    if (this.sort_by) {
      const sortItem = this.sortItems.findBy('value', this.sort_by)

      //call didUpdateAttrs in filters-top-bar/filters-section/dropdown-button component
      set(this, 'sort', null)

      set(this, 'sort', sortItem)
    } else {
      set(this, 'sort', null)
    }

    if (!this.isLeaving) {
      this.__checkQueryFilters()
    } else {
      set(this, 'isLeaving', false)
    }
  }),

  __checkQueryFilters () {
    this.queryKeys.forEach(key => {
      const value = get(this, key)

      if (value) {
        this.queryFilters.updateKeys(key, value)
      } else {
        this.queryFilters.updateKeys(key, null)
      }
    })

    this.initVotes.perform()
  },

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

  initVotes: task(function*() {
    window.scroll({
      top: 0
    })

    set(this, 'scrollY', 0)
    set(this, 'page', 1)

    yield timeout(750)

    if (this.userVotes) {
      const votes = this.userVotes.map(vote => {
        const movie = this.moviesData.findBy('id', vote.id)

        return {
          id: vote.id,
          title: movie.title,
          poster_path: movie.poster_path,
          average: vote.average,
          createdAt: vote.createdAt,
          modifiedAt: vote.modifiedAt
        }
      })

      if (this.sort) {
        if (this.sort.value === 'vote_date.desc') {
          votes.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt) - new Date(a.createdAt)
            }
          })
        } else if (this.sort.value === 'vote_date.asc') {
          votes.sort((b, a) => {
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt) - new Date(a.createdAt)
            }
          })
        } else if (this.sort.value === 'modification_date.desc') {
          votes.sort((a, b) => {
            if (a.modifiedAt && b.modifiedAt) {
              return new Date(b.modifiedAt) - new Date(a.modifiedAt)
            }
          })
        } else if (this.sort.value === 'modification_date.asc') {
          votes.sort((b, a) => {
            if (a.modifiedAt && b.modifiedAt) {
              return new Date(b.modifiedAt) - new Date(a.modifiedAt)
            }
          })
        } else if (this.sort.value === 'title.desc') {
          votes.sort((b, a) => ('' + b.title).localeCompare(a.title))
        } else if (this.sort.value === 'title.asc') {
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
  }),

  fetch: task(function*(id) {
    if (id === this.id) {
      return
    }

    set(this, 'id', id)

    this.progress.reset()

    this.progress.update(40)

    yield all([
      timeout(500),
      this.__fetch.perform(id)
    ])

    this.progress.update(100)
  }),

  __fetch: task(function*(id) {
    yield this.fetchInfos.perform(id)

    this.progress.update(60)

    yield this.fetchVotes.perform(id)
  }),

  fetchInfos: task(function* (id) {
    yield this.store.find('fb-community-user-infos', id).then(infos => {
      set(this, 'userInfos', infos)
    })
  }),

  fetchVotes: task(function*(id) {
    yield this.store.find('fb-community-user-votes', id).then(({ votes }) => {
      set(this, 'userVotes', votes)
    })

    yield this.fetchMoviesData(this.userVotes)
  }),

  async fetchMoviesData (items) {
    if (this.moviesData.length === 0) {
      const promises = await items.map(item => this.store.find('fb-movies-data', item.id).then(_ => _))

      return await Promise.all(promises).then(moviesData => set(this, 'moviesData', moviesData))
    } else {
      let promises = await items.map(item => {
        const movie = this.moviesData.findBy('id', item.id)

        if (!movie) {
          return this.store.find('fb-movies-data', item.id).then(_ => _)
        }
      })

      promises = promises.filter(promise => promise)

      return await Promise.all(promises).then(moviesData => set(this, 'moviesData', moviesData.concat(this.moviesData)))
    }
  }
})
