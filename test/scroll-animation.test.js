const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { parse } = require('@adobe/css-tools');

const root = path.join(__dirname, '..');

function indexCardScaleAtState(relativePath, state) {
  const css = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const ast = parse(css);
  const rule = ast.stylesheet.rules.find(candidate =>
    candidate.type === 'rule' && candidate.selectors.includes('.index-card')
  );
  const transform = rule?.declarations.find(declaration =>
    declaration.type === 'declaration' && declaration.property === 'transform'
  )?.value;
  const expression = transform?.match(/^scale\(calc\((.*)\)\)$/)?.[1]
    .replaceAll('var(--state)', String(state));

  assert.ok(expression, `expected a state-driven scale transform in ${relativePath}`);
  assert.match(expression, /^[\d\s.+*/()-]+$/, `unsupported scale expression: ${expression}`);

  return Function(`"use strict"; return (${expression});`)();
}

test('index card animation never scales cards wider than their layout box', () => {
  const stylesheets = [
    'source/css/custom-effects.css',
    'themes/fluid/source/css/scrollAnimation.css'
  ];

  for (const stylesheet of stylesheets) {
    const scales = [0, 0.25, 0.5, 0.75, 1]
      .map(state => indexCardScaleAtState(stylesheet, state));

    assert.ok(scales[0] < 1, `${stylesheet} should start with a subtle inset scale`);
    assert.equal(scales.at(-1), 1, `${stylesheet} should finish at its layout size`);
    assert.ok(
      scales.every(scale => scale > 0 && scale <= 1),
      `${stylesheet} produced an overflowing scale: ${scales.join(', ')}`
    );
  }
});

test('scroll animation leaves unrelated layout rows unchanged', () => {
  const card = {
    getBoundingClientRect: () => ({ height: 200, top: 100 }),
    style: { setProperty() {} }
  };
  const unrelatedRow = { style: {} };
  const document = {
    addEventListener() {},
    documentElement: { clientHeight: 720, clientWidth: 1280 },
    querySelector: selector => selector === '.row' ? unrelatedRow : null,
    querySelectorAll: selector => selector === '.index-card' ? [card] : []
  };
  const window = {
    addEventListener() {},
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame(callback) {
      callback();
      return 1;
    }
  };

  vm.runInNewContext(
    fs.readFileSync(path.join(root, 'themes/fluid/source/js/scrollAnimation.js'), 'utf8'),
    { document, window }
  );

  assert.deepEqual(unrelatedRow.style, {});
});
