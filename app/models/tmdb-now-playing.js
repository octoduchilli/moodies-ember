import DS from 'ember-data';

const { attr } = DS;

export default DS.Model.extend({
  page: attr('number'),
  total_pages: attr('number'),

  results: attr(''),
  total_results: attr('number')
});
