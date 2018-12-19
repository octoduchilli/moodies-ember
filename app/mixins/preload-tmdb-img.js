import Mixin from '@ember/object/mixin'
import { inject as service } from '@ember/service'
import { set } from '@ember/object'

export default Mixin.create({
  progress: service('page-progress'),

  paths: null,

  tick (promise, index) {
    const progress = Math.round((index / this.paths.length) * 90)

    this.progress.update(progress)

    return promise
  },

  preloadTMDBImg(paths, progress) {
    set(this, 'paths', paths)

    let promises = paths.map(path => {
      if (path) {
        return new Promise((resolve, reject) => {
          let image = new Image()

          image.onload = resolve
          image.onerror = reject
          image.src = `https://image.tmdb.org/t/p/w500${path}`
        })
      }
    })

    if (progress) {
      return Promise.all(promises.map((promise, index) => this.tick(promise, index)))
    }

    return Promise.all(promises)
  }
});
