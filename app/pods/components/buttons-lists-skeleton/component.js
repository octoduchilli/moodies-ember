import Component from '@ember/component'

export default Component.extend({
  tagName: 'ul',
  classNames: 'flex',

  basicLists: null,

  init () {
    this._super(...arguments)

    this.basicLists = ['eye', 'heart', 'plus']
  }
});
