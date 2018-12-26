import Route from '@ember/routing/route'
import RouteHistoryMixin from 'ember-route-history/mixins/routes/route-history'

export default Route.extend(RouteHistoryMixin, {
  beforeModel () {
    window.scroll({
      top: 0
    })
  }
});
