import FirebaseAdapter from 'emberfire/adapters/firebase'
import { set } from '@ember/object'

export default FirebaseAdapter.extend({
  async findRecord (store, typeClass, id) {
    let payload

    await this._super(...arguments).then(res => payload = res)

    set(payload, 'id', id)

    return payload
  },

  _getCollectionRef (typeClass, id) {
    var ref = this._ref

    ref = ref.child(`users/${id}/infos`)

    return ref
  }
})
