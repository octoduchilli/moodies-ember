import Mixin from '@ember/object/mixin'

export default Mixin.create({
  lerpColor (rgb1, rgb2, ratio) {
    let newColor = {}
    let components = ['r', 'g', 'b']

    for (var i = 0; i < components.length; i++) {
        let c = components[i]
        newColor[c] = Math.round(rgb1[c] + (rgb2[c] - rgb1[c]) * ratio)
    }

    return 'rgb(' + newColor.r + ', ' + newColor.g + ', ' + newColor.b + ')'
  }
});
