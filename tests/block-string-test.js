let test = require('tape');

let blockString = require('..');

test('blockString trims and removes leading indents', function(assert) {
  assert.equal(
    blockString`
    1
    2
      3
    4
  `,
  `1\n2\n  3\n4`
  );
  assert.end();
});
