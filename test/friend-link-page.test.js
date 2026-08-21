const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const Hexo = require('hexo');

const root = path.join(__dirname, '..');
const linksTemplatePath = path.join(root, 'themes', 'fluid', 'layout', 'links.ejs');
const rendererEntry = require.resolve('hexo-renderer-ejs');
const renderEjs = require(path.join(path.dirname(rendererEntry), 'lib', 'renderer'));
const cheerio = require(require.resolve('cheerio', {
  paths: [path.dirname(require.resolve('hexo'))]
}));

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

test('renders the friend-link application as one accessible, focused card', async () => {
  const hexo = new Hexo(root, { silent: true });
  try {
    await hexo.init();
    await hexo.load();
    const html = renderEjs({
      path: linksTemplatePath,
      text: fs.readFileSync(linksTemplatePath, 'utf8')
    }, {
      __: key => key,
      inject_point: () => '',
      page: {},
      theme: hexo.theme.config,
      url_for: value => value
    });
    const $ = cheerio.load(html);
    const card = $('section.friend-link-apply');
    const callToAction = card.find('a.friend-link-apply__cta');

    assert.equal(card.length, 1);
    assert.equal(card.attr('aria-labelledby'), 'friend-link-apply-title');
    assert.equal(card.find('#friend-link-apply-title').text().trim(), '交换友链');
    assert.match(card.find('.friend-link-apply__lead').text(), /先在你的站点添加本站/);
    assert.equal(card.find('.friend-link-apply__details dt').length, 4);
    assert.equal(card.find('.friend-link-apply__action-icon').length, 0);
    assert.equal(card.find('.friend-link-apply__action > p').length, 0);
    const callToActionIcon = callToAction.find('svg.friend-link-apply__cta-icon');
    assert.equal(callToActionIcon.length, 1);
    assert.equal(callToActionIcon.attr('aria-hidden'), 'true');
    assert.equal(callToActionIcon.find('path').length, 2);
    assert.equal(
      card.find('.friend-link-apply__site-link').attr('href'),
      'https://blog.phlin.cn'
    );
    const avatar = card.find('img.friend-link-apply__avatar');
    assert.equal(avatar.attr('src'), 'https://qiuniu.phlin.cn/bucket/icon.png');
    assert.equal(avatar.attr('alt'), "phlin's blog 头像");
    assert.equal(
      avatar.closest('a').attr('href'),
      'https://qiuniu.phlin.cn/bucket/icon.png'
    );
    assert.equal(
      callToAction.attr('href'),
      'https://github.com/Penryn/hexo-blog/issues/new?template=friend-link.yml'
    );
    assert.equal(callToAction.text().replace(/\s+/g, ' ').trim(), '提交友链申请');
  } finally {
    await hexo.exit();
  }
});
