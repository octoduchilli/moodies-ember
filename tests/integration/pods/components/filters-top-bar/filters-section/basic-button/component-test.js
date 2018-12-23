import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | filters-top-bar/filters-section/basic-button', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`{{filters-top-bar/filters-section/basic-button}}`);

    assert.equal(this.element.textContent.trim(), '');

    // Template block usage:
    await render(hbs`
      {{#filters-top-bar/filters-section/basic-button}}
        template block text
      {{/filters-top-bar/filters-section/basic-button}}
    `);

    assert.equal(this.element.textContent.trim(), 'template block text');
  });
});
