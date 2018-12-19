import tmdb from './tmdb';

export default tmdb.extend({
  namespace: 'movie',

  pathForType() {
    return 'now_playing'
  }
});
