'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

const nodeSass = require('node-sass');

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    sassOptions: {
      implementation: nodeSass
    }
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  app.import('node_modules/pickadate/lib/legacy.js');
  app.import('node_modules/pickadate/lib/picker.js');
  app.import('node_modules/pickadate/lib/picker.time.js');
  app.import('node_modules/pickadate/lib/picker.date.js');

  app.import('node_modules/pickadate/lib/themes/classic.css');
  app.import('node_modules/pickadate/lib/themes/classic.time.css');
  app.import('node_modules/pickadate/lib/themes/classic.date.css');

  return app.toTree();
};
