import FirebaseAdapter from 'emberfire/adapters/firebase'
import { inject as service } from '@ember/service'
import { get } from '@ember/object'

export default FirebaseAdapter.extend({
  session: service(),

  _getCollectionRef () {
    var ref = this._ref

    ref = ref.child(`users/${get(this.session, 'uid')}/filters`)

    return ref
  }
})
