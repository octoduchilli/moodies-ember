import DS from 'ember-data'

const { attr } = DS

export default DS.Model.extend({
  genres: attr(''),

  popularity: attr('number'),

  poster_path: attr('string'),
  release_date: attr('date'),

  runtime: attr('number'),

  title: attr('string'),
  overview: attr('string'),
  vote_count: attr('number'),
  vote_average: attr('number')
})
