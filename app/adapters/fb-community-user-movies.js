import FirebaseAdapter from 'emberfire/adapters/firebase'

export default FirebaseAdapter.extend({
  async findRecord (store, typeClass, id) {
    var ref = this._getCollectionRef(typeClass, id);

    var log = 'DS: FirebaseAdapter#findRecord ' + typeClass.modelName + ' to ' + ref.toString()

    return await this._fetch(ref, log).then(function (snapshot) {
      let movies = []

      snapshot.forEach(_ => {
        let lists = []

        for (const i in _.val()) {
          lists.push(i)
        }

        movies.push({
          id: _.key,
          lists: lists
        })
      })

      return {
        id: id,
        movies: movies
      }
    })
  },

  _getCollectionRef (typeClass, id) {
    var ref = this._ref

    ref = ref.child(`users/${id}/films`)

    return ref
  }
})
