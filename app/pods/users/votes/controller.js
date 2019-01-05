import Controller from '@ember/controller'
import filtersHelper from 'moodies-ember/mixins/filters-helper'
import { task, timeout, all } from 'ember-concurrency'
import { inject as service } from '@ember/service'
import { set } from '@ember/object'

export default Controller.extend(filtersHelper, {
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

  userInfos: null,
  userVotes: null,
  moviesData: null,

  init () {
    this._super(...arguments)

    this.votes = []
    this.votesSliced = []
    this.moviesData = []

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
    resetFilters () {
      this.queryFilters.resetQuery()
    },
    async actualiseFilters () {
      this.store.unloadRecord(await this.store.find('fb-community-user-votes', this.id).then(_ => _))

      await this.fetchVotes.perform(this.id)

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

  __waitFetch: task(function* () {
    while (this.fetch.isRunning) {
      yield timeout(300)
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
