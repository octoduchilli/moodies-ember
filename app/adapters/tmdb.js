import DS from 'ember-data';

const defaultQuery = {
  api_key: '3836694fa8a7ae3ea69b5ff360b3be0b',
  language: 'fr-FR',
  include_adult: false,
  region: 'fr'
}

export default DS.RESTAdapter.extend({
  host: 'https://api.themoviedb.org/3',

  queryRecord (store, type, query) {
    let url = this.buildURL(type.modelName, null, null, 'queryRecord', query)

    query = Object.assign({}, query, defaultQuery)

    return this.ajax(url, 'GET', { data: query })
  },

  findRecord (store, type, id, snapshot) {
    let url = this.buildURL(type.modelName, id, snapshot, 'findRecord');

    return this.ajax(url, 'GET', { data: defaultQuery });
  }
});
