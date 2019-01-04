import Component from '@ember/component'
import { inject as service } from '@ember/service'

export default Component.extend({
  media: service(),

  tagName: 'section',

  resetFilters () {},
  actualiseFilters () {},

  actions: {
    overflowFTPforMobile (open) {
      setTimeout(() => {
        if (this.media.isMobile) {
          const el = document.getElementsByClassName('filters-top-bar')[0].firstChild

          if (open) {
            el.style.overflow = 'visible'
          } else {
            el.style.overflow = 'hidden'
          }
        }
      })
    }
  }
});
