const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Hexo = require('hexo');

const root = path.join(__dirname, '..');
const linksTemplatePath = path.join(root, 'themes', 'fluid', 'layout', 'links.ejs');
const rendererEntry = require.resolve('hexo-renderer-ejs');
const renderEjs = require(path.join(path.dirname(rendererEntry), 'lib', 'renderer'));

test('Fluid escapes applicant-controlled friend-link names and descriptions', () => {
  const html = renderEjs({
    path: linksTemplatePath,
    text: fs.readFileSync(linksTemplatePath, 'utf8')
  }, {
    __: key => key,
    inject_point: () => '',
    page: {},
    theme: {
      links: {
        items: [{
          title: '<img src=x onerror=alert(1)>',
          intro: '<script>alert(2)</script>',
          link: 'https://example.com/',
          avatar: 'https://example.com/avatar.png'
        }],
        onerror_avatar: '/img/avatar.png',
        custom: { enable: false, content: '' },
        comments: { type: 'disqus' }
      }
    },
    url_for: value => value
  });

  assert.doesNotMatch(html, /<img src=x onerror=alert\(1\)>/);
  assert.doesNotMatch(html, /<script>alert\(2\)<\/script>/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /&lt;script&gt;alert\(2\)&lt;\/script&gt;/);
});

test('Hexo loads canonical friend links and the GitHub application entry', async () => {
  const hexo = new Hexo(root, { silent: true });
  try {
    await hexo.init();
    await hexo.load();

    assert.equal(hexo.theme.config.links.items.length, 13);
    assert.equal(hexo.theme.config.links.custom.enable, true);
    assert.match(
      hexo.theme.config.links.custom.content,
      /github\.com\/Penryn\/hexo-blog\/issues\/new\?template=friend-link\.yml/
    );
    assert.match(hexo.theme.config.links.custom.content, /申请友链/);
  } finally {
    await hexo.exit();
  }
});
