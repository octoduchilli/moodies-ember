import Service from '@ember/service'

export default Service.extend({
  isOpen: false,

  toggle () {
    const appEl = document.getElementById('app')
    const mainSideBarEl = document.getElementsByClassName('main-side-bar')[0]

    if (!this.isOpen) {
      appEl.classList.add('side--bar-is-open')
      mainSideBarEl.classList.add('is--open')
    } else {
      appEl.classList.remove('side--bar-is-open')
      mainSideBarEl.classList.remove('is--open')
    }

    this.toggleProperty('isOpen')
  }
})
