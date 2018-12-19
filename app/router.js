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
  });

  this.route('community');
  this.route('home');
});

export default Router;
