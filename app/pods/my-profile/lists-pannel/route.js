import Route from '@ember/routing/route'

export default Route.extend({
  redirect(model, transition) {
    if (transition.targetName === 'my-profile.lists-pannel.index'){
      return this.transitionTo('my-profile.lists-pannel.new')
    }
  }
})
