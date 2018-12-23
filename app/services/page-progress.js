import Service from '@ember/service'

export default Service.extend({
  reset () {
    const el = document.getElementById('main-progress-bar')

    el.style.transition = 'none'

    el.style.width = '0vw'

    el.style.transition = '500ms ease'
  },

  update (percent) {
    setTimeout(() => {
      const el = document.getElementById('main-progress-bar')

      el.style.width = `${percent}vw`

      if (percent >= 100) {
        el.style.opacity = 0

        setTimeout(() => {
          this.reset()
        }, 1000)
      } else {
        el.style.opacity = 1
      }
    })
  }
})
