import DS from 'ember-data'

const { attr } = DS

export default DS.Model.extend({
  createdAt: attr('date'),

  movie: attr(''),
  user: attr(''),

  value: attr('string'),
  valueId: attr('string')
})
