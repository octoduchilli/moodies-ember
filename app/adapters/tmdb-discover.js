import tmdb from './tmdb'

const defaultQuery = {
  api_key: '3836694fa8a7ae3ea69b5ff360b3be0b',
  language: 'fr-FR',
  include_adult: false
}

export default tmdb.extend({
  pathForType() {
    return 'discover/movie'
  },

  queryRecord (store, type, query) {
    let url = this.buildURL(type.modelName, null, null, 'queryRecord', query)

    return this.ajax(url, 'GET', { data: Object.assign({}, query, defaultQuery) }).then(response => {
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
