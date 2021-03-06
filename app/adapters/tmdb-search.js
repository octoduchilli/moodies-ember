import tmdb from './tmdb';

const defaultQuery = {
  api_key: '3836694fa8a7ae3ea69b5ff360b3be0b',
  language: 'fr-FR',
  include_adult: false,
  region: 'fr'
}

export default tmdb.extend({
  pathForType () {
    return 'search'
  },

  queryRecord (store, type, query) {
    let url = this.buildURL(type.modelName, null, null, 'queryRecord', query)

    url = `${url}/${query['type']}`

    delete query['type']

    query = Object.assign({}, query, defaultQuery)

    return this.ajax(url, 'GET', { data: query }).then(response => {
      let q = ''

      Object.entries(query).forEach(values => {
        q += `${values[0]}=${values[1]}&`
      })

      q = q.substr(0, q.length - 1)

      response['query'] = q

      return response
    })
  }
});
