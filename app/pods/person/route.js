import Route from '@ember/routing/route'
import RouteHistoryMixin from 'ember-route-history/mixins/routes/route-history'

export default Route.extend(RouteHistoryMixin, {
  setupController (controller, model) {
    this._super(controller, model)

    controller.set('personId', this.currentModel.id)
  }
});
