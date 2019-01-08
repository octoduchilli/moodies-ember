import FirebaseAdapter from 'emberfire/adapters/firebase'

export default FirebaseAdapter.extend({
  _getCollectionRef (typeClass, id) {
    var ref = this._ref

    if (id) {
      ref = ref.child(`community/last/${id}`)
    } else {
      ref = ref.child(`community/last`)
    }

    return ref
  }
})
