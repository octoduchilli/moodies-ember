import FirebaseAdapter from 'emberfire/adapters/firebase'
import { set } from '@ember/object'

export default FirebaseAdapter.extend({
  pathForType() {
    return 'users'
  },

  async findRecord (store, typeClass, id) {
    let payload

    await this._super(...arguments).then(res => payload = res)

    set(payload, 'id', id)

    return payload
  }
})
