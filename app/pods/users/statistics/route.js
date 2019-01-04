import Route from '@ember/routing/route';

export default Route.extend({
  setupController (controller, model) {
    this._super(controller, model)

    controller.fetch.perform(model.id)

    setTimeout(() => {
      window.scroll({
        top: document.getElementsByClassName('users__statistics')[0] ? document.getElementsByClassName('users__statistics')[0].offsetTop - 70 : 0,
        behavior: 'smooth'
      })
    })
  }
});
