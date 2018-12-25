import tmdb from './tmdb';

const defaultQuery = {
  api_key: '3836694fa8a7ae3ea69b5ff360b3be0b',
  include_adult: false,
  language: 'fr-FR',
  region: 'fr',
  append_to_response: 'releases,recommendations,credits,videos'
}

export default tmdb.extend({
  pathForType() {
    return 'movie'
  },

  findRecord (store, type, id, snapshot) {
    let url = this.buildURL(type.modelName, id, snapshot, 'findRecord');

    return this.ajax(url, 'GET', { data: defaultQuery });
  }
});
