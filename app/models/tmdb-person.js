import DS from 'ember-data';

const { attr } = DS;

export default DS.Model.extend({
  name: attr('string'),
  biography: attr('string'),
  birthday: attr('string'),
  place_of_birth: attr('string'),
  deathday: attr('string'),
  images: attr(''),
  known_for_department: attr('string'),
  credits: attr(''),
  profile_path: attr('string'),
  gender: attr('number')
});
