import FirebaseAdapter from 'emberfire/adapters/firebase'

export default FirebaseAdapter.extend({
  async findRecord (store, typeClass, id) {
    var ref = this._getCollectionRef(typeClass, id);

    var log = 'DS: FirebaseAdapter#findRecord ' + typeClass.modelName + ' to ' + ref.toString()

    return await this._fetch(ref, log).then(snap => {
      return {
        id: id,
        lasts: snap.val()
      }
    })
  },

  _getCollectionRef (typeClass, id) {
    var ref = this._ref

    ref = ref.child(`users/${id}/last`)

    return ref
  }
})
