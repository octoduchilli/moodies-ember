import DS from 'ember-data';

const { attr } = DS;

export default DS.Model.extend({
  backdrops: attr(''),
  posters: attr('')
});
