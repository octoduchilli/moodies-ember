import Route from '@ember/routing/route'
import RouteHistoryMixin from 'ember-route-history/mixins/routes/route-history'

export default Route.extend(RouteHistoryMixin, {
  // model () {
  //   this.store.query('fb-user-infos', {
  //     orderBy: 'infos/pseudoLower',
  //     limitToLast: 10
  //   }).then(data => {debugger})
  // }
});
