import FirebaseAdapter from 'emberfire/adapters/firebase'
import { inject as service } from '@ember/service'
import { get } from '@ember/object'

export default FirebaseAdapter.extend({
  session: service(),

  _getCollectionRef (typeClass, id) {
    var ref = this._ref

    ref = ref.child(`users/${get(this.session, 'uid')}/filters${id ? '/' + id : ''}`)

    return ref
  }
})
