import Service from '@ember/service'

export default Service.extend({
  updateBar () {
    setTimeout(() => {
      const linksEl = document.getElementsByClassName(`side-bar__link`)
      const barEl = document.getElementById('active-link-bar')

      for (let i = 0; i < linksEl.length; i++) {
        if (linksEl[i].className.indexOf('active') !== -1) {
          barEl.style.top = `${linksEl[i].offsetTop + 24}px`

          return
        }
      }
    })
  }
})
