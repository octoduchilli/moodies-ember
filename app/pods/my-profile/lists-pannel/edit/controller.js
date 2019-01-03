import Controller from '@ember/controller'
import { inject as service } from '@ember/service'
import { task, timeout, all } from 'ember-concurrency'
import { set, computed } from '@ember/object'
import { copy } from '@ember/object/internals'

export default Controller.extend({
  router: service (),
  notify: service('notification-messages'),
  media: service(),
  user: service('current-user'),

  list: null,

  props: null,
  propsToCheck: null,

  errorLabel: '',
  errorName: '',

  willDeleteList: false,
  deleted: false,

  haveChanges: computed('propsToCheck', 'props.color', 'props.name', 'props.label', 'props.position', function () {
    if (this.props) {
      return Object.entries(this.propsToCheck).every(values => String(this.props[values[0]]) === String(values[1])) === false
    }
  }),

  save: task(function*() {
    if (this.haveChanges) {

      if (!this.props.label) {
        return set(this, 'errorLabel', 'Ne peut pas être vite')
      } else if (!this.props.name) {
        return set(this, 'errorName', 'Ne peut pas être vite')
      } else if (this.props.position < 1) {
        set(this.props, 'position', 1)
      } else if (this.props.position > this.user.lists.length) {
        set(this.props, 'position', this.user.lists.length)
      }

      yield all([
        timeout(750),
        this.__save()
      ])

      this.notify.success('Les modifications ont bien été sauvegardées')
    }
  }),

  async __save () {
    const payload = Object.assign({}, this.props, {
      modifiedAt: new Date().toString()
    })

    set(payload, 'position', Number(payload.position))

    if (Number(payload.position) !== Number(this.propsToCheck)) {
      const list = this.user.lists.findBy('position', Number(payload.position))

      set(list, 'position', Number(this.propsToCheck.position))

      await list.save()
    }

    for (const i in payload) {
      set(this.list, i, payload[i])
    }

    await this.list.save()

    set(this, 'propsToCheck', copy(this.props))
  },

  delete: task(function*() {
    yield all([
      timeout(750),
      this.__delete()
    ])

    set(this, 'deleted', true)
    set(this, 'willDeleteList', false)

    this.notify.success('Votre liste a bien été supprimé')
  }),

  async __delete () {
    this.user.removeList(this.list)

    await this.list.destroyRecord()
  },

  fetchList: task(function*(id) {
    while (this.user.fetch.isRunning) {
      yield timeout(300)
    }

    const list = this.user.lists.findBy('id', id)

    if (!list) {
      return this.router.transitionTo('my-profile.lists-pannel.new')
    }

    const obj = {
      label: list.label,
      name: list.name,
      color: list.color,
      position: list.position
    }

    set(this, 'list', list)
    set(this, 'props', copy(obj))
    set(this, 'propsToCheck', copy(obj))
  })
})
