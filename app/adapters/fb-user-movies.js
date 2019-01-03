import FirebaseAdapter from 'emberfire/adapters/firebase'
import { set } from '@ember/object'

export default FirebaseAdapter.extend({
  async findRecord (store, typeClass, id) {
    let payload = {
      id: null,
      movies: []
    }

    await this._super(...arguments).then(res => {
      for (const i in res) {
        if (i !== 'id') {
          let lists = []

          for (const j in res[i]) {
            lists.push(j)
          }

          payload.movies.push({
            id: i,
            lists: lists
          })
        }
      }
    })

    set(payload, 'id', id)

    return payload
  },

  _getCollectionRef (typeClass, id) {
    var ref = this._ref

    ref = ref.child(`users/${id}/films`)

    return ref
  }
})
