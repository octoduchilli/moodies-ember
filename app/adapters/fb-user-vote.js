import FirebaseAdapter from 'emberfire/adapters/firebase'
import { inject as service } from '@ember/service'
import { get, set } from '@ember/object'

export default FirebaseAdapter.extend({
  session: service(),

  _getCollectionRef (typeClass, id) {
    var ref = this._ref

    ref = ref.child(`users/${get(this.session, 'uid')}/votes/${id}`)

    return ref
  },

  async findRecord (store, typeClass, id) {
    var _this = this

    var ref = this._getCollectionRef(typeClass, id);

    var log = 'DS: FirebaseAdapter#findRecord ' + typeClass.modelName + ' to ' + ref.toString()

    let payload = await this._fetch(ref, log).then(function (snapshot) {
      var payload = _this._assignIdToPayload(snapshot)

      _this._updateRecordCacheForType(typeClass, payload, store)

      return payload
    })

    if (payload) {
      set(payload, 'id', id)
    } else {
      payload = {
        id: id
      }
    }

    return payload
  }
})
