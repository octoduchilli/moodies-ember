import FirebaseAdapter from 'emberfire/adapters/firebase'
import { inject as service } from '@ember/service'
import { get } from '@ember/object'

export default FirebaseAdapter.extend({
  session: service(),

  _getCollectionRef (typeClass, id) {
    var ref = this._ref

    ref = ref.child(`users/${get(this.session, 'uid')}/votes/${id}`)

    return ref
  },

  async findRecord (store, typeClass, id) {
    var ref = this._getCollectionRef(typeClass, id);

    var log = 'DS: FirebaseAdapter#findRecord ' + typeClass.modelName + ' to ' + ref.toString()

    return await this._fetch(ref, log).then(function (snapshot) {
      return Object.assign({}, { id: id }, snapshot.val())
    })
  },

  findAll(store, typeClass) {
    var ref = this._ref

    ref = ref.child(`users/${get(this.session, 'uid')}/votes`)

    var log = `DS: FirebaseAdapter#findAll ${typeClass.modelName} to ${ref.toString()}`;

    return this._fetch(ref, log).then((snapshot) => {
      if (!this._findAllHasEventsForType(typeClass)) {
        this._findAllAddEventListeners(store, typeClass, ref);
      }

      var results = [];
      snapshot.forEach((childSnapshot) => {
        var payload = this._assignIdToPayload(childSnapshot);
        this._updateRecordCacheForType(typeClass, payload, store);
        results.push(payload);
      });

      return results;
    });
  }
})
