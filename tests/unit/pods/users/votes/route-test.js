import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | users/votes', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:users/votes');
    assert.ok(route);
  });
});
