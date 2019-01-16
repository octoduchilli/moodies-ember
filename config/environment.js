'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'moodies-ember',
    podModulePrefix: 'moodies-ember/pods',
    environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    // firebase: {
    //   apiKey: 'AIzaSyCoEI1RieubL2z_TIwD4R5FHokpgGMvngs',
    //   authDomain: 'app-film-bd1b7.firebaseapp.com',
    //   databaseURL: 'https://app-film-bd1b7.firebaseio.com',
    //   projectId: 'app-film-bd1b7',
    //   storageBucket: 'app-film-bd1b7.appspot.com',
    //   messagingSenderId: '796383962142'
    // },

    firebase : {
      apiKey: 'AIzaSyDNZiZQTmoc3yd0qaOrGqjvvK9zpv9FebA',
      authDomain: 'moodies-fr.firebaseapp.com',
      databaseURL: 'https://moodies-fr.firebaseio.com',
      projectId: 'moodies-fr',
      storageBucket: 'moodies-fr.appspot.com',
      messagingSenderId: '297594988637'
    },

    torii: {
      sessionServiceName: 'session'
    },

    moment: {
      includeLocales: true
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    // here you can enable a production-specific feature
  }

  return ENV;
};
