import tmdb from './tmdb';

const defaultQuery = {
  api_key: '3836694fa8a7ae3ea69b5ff360b3be0b',
  language: 'fr-FR',
  include_image_language: 'fr,en'
}

export default tmdb.extend({
  pathForType() {
    return 'movie'
  },

  findRecord (store, type, id, snapshot) {
    let url = this.buildURL(type.modelName, id, snapshot, 'findRecord');

    url += '/images'

    return this.ajax(url, 'GET', { data: defaultQuery });
  }
});
