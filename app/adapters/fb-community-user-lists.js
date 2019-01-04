import FirebaseAdapter from 'emberfire/adapters/firebase'

export default FirebaseAdapter.extend({
  async findRecord (store, typeClass, id) {
    var ref = this._getCollectionRef(typeClass, id);

    var log = 'DS: FirebaseAdapter#findRecord ' + typeClass.modelName + ' to ' + ref.toString()

    return await this._fetch(ref, log).then(function (snapshot) {
      let lists = []

      snapshot.forEach(_ => {
        const list = _.val()

        list.id = _.key

        lists.push(list)
      })

      return {
        id: id,
        lists: lists
      }
    })
  },

  _getCollectionRef (typeClass, id) {
    var ref = this._ref

    ref = ref.child(`users/${id}/filters`)

    return ref
  }
})
