import Route from '@ember/routing/route'

export default Route.extend({
  redirect(model, transition) {
    window.scroll({
      top: 0
    })
    if (transition.targetName === 'my-profile.lists-pannel.index'){
      return this.transitionTo('my-profile.lists-pannel.new')
    }
  }
})
