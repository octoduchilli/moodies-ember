import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('home');

  this.route('movie', { path: 'movie/:id' });
  this.route('person', { path: 'person/:id' });

  this.route('discover');

  this.route('my-profile', function() {
    this.route('my-lists');
    this.route('informations');
    this.route('votes');
    this.route('lists-pannel', function() {
      this.route('new');
      this.route('edit', { path: '/:id'});
    });
  });

  this.route('community');
  this.route('home');
  this.route('search');
  this.route('images', { path: 'images/:id' });
  this.route('videos', { path: 'videos/:id' });
  this.route('users', { path: 'users/:id'}, function() {
    this.route('statistics');
    this.route('lists');
    this.route('votes');
  });
});

export default Router;
