import DS from 'ember-data'

const { attr } = DS

export default DS.Model.extend({
  createdAt: attr('date'),
  modifiedAt: attr('date'),

  color: attr('string'),

  name: attr('string'),
  label: attr('string'),

  position: attr('number')
})
