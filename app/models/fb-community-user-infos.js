import DS from 'ember-data'

const { attr } = DS

export default DS.Model.extend({
  createdAt: attr('date'),
  modifiedAt: attr('date'),

  color: attr('string'),

  firstname: attr('string'),
  lastname: attr('string'),

  pseudo: attr('string'),
  pseudoLower: attr('string'),
  pseudoLowerInverse: attr('string'),

  private: attr('boolean'),

  profileImg: attr(''),
  coverImg: attr(''),

  lastConnection: attr('number'),
  lastConnectionInverse: attr('number'),

  totalMovies: attr('number'),
  totalMoviesInverse: attr('number')
})
