import Controller from '@ember/controller'
import { inject as service } from '@ember/service'
import { task, timeout, all } from 'ember-concurrency'
import { set } from '@ember/object'

export default Controller.extend({
  notify: service('notification-messages'),
  media: service(),
  user: service('current-user'),

  created: false,

  label: null,
  name: null,
  color: '#551A8B',

  errorLabel: '',
  errorName: '',

  save: task(function*() {
    if (!this.label) {
      return set(this, 'errorLabel', 'Ne peut pas être vite')
    } else if (!this.name) {
      return set(this, 'errorName', 'Ne peut pas être vite')
    }

    yield all([
      timeout(750),
      this.__save()
    ])

    set(this, 'created', true)

    set(this, 'label', null)
    set(this, 'name', null)
    set(this, 'color', '#551A8B')

    this.notify.success('Votre nouvelle liste a été créé avec succès')
  }),

  async __save () {
    const payload = {
      color: this.color,
      createdAt: new Date().toString(),
      label: this.label,
      name: this.name,
      position: this.user.lists ? this.user.lists.length + 1 : 1
    }

    const list = await this.store.createRecord('fb-user-lists', payload)

    await list.save()

    this.user.addNewList(list)
  }
})
