import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | my-profile/lists-pannel', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:my-profile/lists-pannel');
    assert.ok(route);
  });
});
