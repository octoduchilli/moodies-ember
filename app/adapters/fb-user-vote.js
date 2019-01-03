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
  }
})
