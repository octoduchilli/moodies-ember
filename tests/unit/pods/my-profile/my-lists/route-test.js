import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | my-profile/my-lists', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:my-profile/my-lists');
    assert.ok(route);
  });
});
