import Route from '@ember/routing/route';

export default Route.extend({
  queryParams: {
    'type': {
      refreshModel: true
    }
  },

  model (params) {

  }
});
