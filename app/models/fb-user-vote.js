import DS from 'ember-data'

const { attr } = DS

export default DS.Model.extend({
  createdAt: attr('date'),

  average: attr('number')
})
