import Controller from '@ember/controller'
import { htmlSafe } from '@ember/string'

export default Controller.extend({
  activityList: null,

  actions: {
    updateUserProfileImgPos (x, y, scale) {
      return htmlSafe(`transform: translate(calc(-50% + ${x * (50 / 150)}px), calc(-50% + ${y * (50 / 150)}px)) scale(${scale})`)
    }
  }
})
