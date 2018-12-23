import DS from 'ember-data';

const { attr } = DS;

export default DS.Model.extend({
  title: attr('string'),
  overview: attr('string'),
  genres: attr(''),
  credits: attr(''),
  runtime: attr('number'),
  recommendations: attr(''),
  videos: attr(''),
  release_date: attr('string'),
  releases: attr(''),
  popularity: attr('number'),

  vote_average: attr('number'),
  vote_count: attr('number'),

  belongs_to_collection: attr(''),

  backdrop_path: attr('string'),
  poster_path: attr('string'),
});
