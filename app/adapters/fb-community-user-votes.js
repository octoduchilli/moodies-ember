import FirebaseAdapter from 'emberfire/adapters/firebase'

export default FirebaseAdapter.extend({
  async findRecord (store, typeClass, id) {
    var ref = this._getCollectionRef(typeClass, id);

    var log = 'DS: FirebaseAdapter#findRecord ' + typeClass.modelName + ' to ' + ref.toString()

    return await this._fetch(ref, log).then(function (snapshot) {
      let votes = []

      snapshot.forEach(_ => {
        const vote = _.val()

        vote.id = _.key

        votes.push(vote)
      })

      return {
        id: id,
        votes: votes
      }
    })
  },

  _getCollectionRef (typeClass, id) {
    var ref = this._ref

    ref = ref.child(`users/${id}/votes`)

    return ref
  }
})
