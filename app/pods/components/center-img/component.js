import Component from '@ember/component'
import { inject as service } from '@ember/service'
import { task, timeout } from 'ember-concurrency'
import { set, get, computed } from '@ember/object'

export default Component.extend({
  user: service('current-user'),

  classNameBindings: ['frameType'],

  tagName: 'div',

  imgDataPath: null,
  imgPath: null,

  frameType: computed('imgDataPath', function () {
    if (this.imgDataPath === 'profileImg') {
      return 'circle'
    } else {
      return 'rect'
    }
  }),

  mouseIsDown: false,

  initialX: null,
  initialY: null,

  imgX: 0,
  imgY: 0,

  scale: 1,

  save: false,

  init () {
    this._super(...arguments)

    this.imgPath = get(this.user.infos, `${this.imgDataPath}.path`)
    this.imgX = get(this.user.infos, `${this.imgDataPath}.posX`) || 0
    this.imgY = get(this.user.infos, `${this.imgDataPath}.posY`) || 0
    this.scale = get(this.user.infos, `${this.imgDataPath}.scale`) || 1
  },

  didInsertElement () {
    this._super(...arguments)

    this.__updateImgStyle(this.imgX, this.imgY, this.scale)
  },

  didUpdateAttrs () {
    if (this.save) {
      this.user.updateInfos({
        [this.imgDataPath]: {
          posX: this.imgX,
          posY: this.imgY,
          scale: this.scale,
          path: this.imgPath
        }
      })

      set(this.user.infos, this.imgDataPath, {
        posX: this.imgX,
        posY: this.imgY,
        scale: this.scale,
        path: this.imgPath
      })
    }
  },

  actions: {
    changeImgPos () {
      const x = event.offsetX
      const y = event.offsetY

      if (this.mouseIsDown) {
        const xPos = Math.round(this.imgX + (x - this.initialX))
        const yPos = Math.round(this.imgY + (y - this.initialY))

        this.__updateImgStyle(xPos, yPos, this.scale)

        this.saveImgPos.perform(xPos, yPos)
      } else {
        this.__initInitialPos(x, y)
      }
    },
    updateImgLarger (larger) {
      if (larger === 'more') {
        const scale = this.scale + 0.2

        set(this, 'scale', Number(scale.toFixed(1)))
      } else if (this.scale > 1) {
        const scale = this.scale - 0.2

        set(this, 'scale', Number(scale.toFixed(1)))
      }

      this.__updateImgStyle(this.imgX, this.imgY, this.scale)
    }
  },

  saveImgPos: task(function*(x, y) {
    yield timeout(200)

    if (!this.mouseIsDown) {
      set(this, 'imgX', x)
      set(this, 'imgY', y)
    }
  }).restartable(),

  __initInitialPos(x, y) {
    set(this, 'initialX', x)
    set(this, 'initialY', y)
  },

  __updateImgStyle (x, y, scale) {
    document.getElementsByClassName('img-container__img')[0].style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`
    document.getElementsByClassName(`${this.styleNamespace}__bg-img`)[0].style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`
  }
});
