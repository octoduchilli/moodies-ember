import DS from 'ember-data'

const { attr } = DS

export default DS.Model.extend({
  createdAt: attr('date'),
  modifiedAt: attr('date'),

  color: attr('string'),

  firstname: attr('string'),
  lastname: attr('string'),

  pseudo: attr('string'),

  private: attr('boolean')
})
