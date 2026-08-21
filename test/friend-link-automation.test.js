const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const hexoEntry = require.resolve('hexo');
const yaml = require(require.resolve('js-yaml', {
  paths: [path.dirname(hexoEntry)]
}));

const root = path.join(__dirname, '..');

const automationPath = path.join(
  __dirname,
  '..',
  '.github',
  'scripts',
  'create-friend-link-pr.cjs'
);

let automation = {};
try {
  automation = require(automationPath);
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

const validIssueBody = `### 站点名称

Alice's Blog

### 站点简介

记录学习与生活

### 站点地址

https://example.com/blog/

### 头像地址

https://example.com/avatar.png

### 申请确认

- [x] 我已阅读申请说明，并确认以上信息真实有效
`;

function getExport(name) {
  assert.equal(
    typeof automation[name],
    'function',
    `automation must export ${name}()`
  );
  return automation[name];
}

test('parses the exact fields emitted by the friend-link Issue Form', () => {
  const parseIssueBody = getExport('parseIssueBody');

  assert.deepEqual(parseIssueBody(validIssueBody), {
    title: "Alice's Blog",
    intro: '记录学习与生活',
    link: 'https://example.com/blog/',
    avatar: 'https://example.com/avatar.png',
    confirmation: '- [x] 我已阅读申请说明，并确认以上信息真实有效'
  });
});

test('rejects a duplicate recognized Issue Form heading', () => {
  const parseIssueBody = getExport('parseIssueBody');
  const body = `${validIssueBody}\n### 站点地址\n\nhttps://attacker.example/\n`;

  assert.throws(() => parseIssueBody(body), /重复字段.*站点地址/);
});

test('validates and trims a complete friend-link application', () => {
  const validateFields = getExport('validateFields');

  assert.deepEqual(validateFields({
    title: '  Alice  ',
    intro: '  记录学习  ',
    link: '  https://example.com/  ',
    avatar: '  https://example.com/avatar.png  ',
    confirmation: '- [X] 同意'
  }), {
    title: 'Alice',
    intro: '记录学习',
    link: 'https://example.com/',
    avatar: 'https://example.com/avatar.png'
  });
});

test('rejects missing fields and an unchecked confirmation', () => {
  const validateFields = getExport('validateFields');

  assert.throws(() => validateFields({}), /缺少“站点名称”/);
  assert.throws(() => validateFields({
    title: 'Alice',
    intro: '记录学习',
    link: 'https://example.com/',
    avatar: 'https://example.com/avatar.png',
    confirmation: '- [ ] 尚未确认'
  }), /请勾选“申请确认”/);
});

test('rejects multiline text, control characters, and excessive lengths', () => {
  const validateFields = getExport('validateFields');
  const base = {
    title: 'Alice',
    intro: '记录学习',
    link: 'https://example.com/',
    avatar: 'https://example.com/avatar.png',
    confirmation: '- [x] 同意'
  };

  assert.throws(
    () => validateFields({ ...base, title: 'Alice\nAdmin' }),
    /站点名称.*单行文本/
  );
  assert.throws(
    () => validateFields({ ...base, intro: 'hello\u0000world' }),
    /站点简介.*控制字符/
  );
  assert.throws(
    () => validateFields({ ...base, title: 'x'.repeat(81) }),
    /站点名称.*80/
  );
  assert.throws(
    () => validateFields({ ...base, intro: 'x'.repeat(161) }),
    /站点简介.*160/
  );
});

test('accepts only HTTP URLs without embedded credentials', () => {
  const validateFields = getExport('validateFields');
  const base = {
    title: 'Alice',
    intro: '记录学习',
    link: 'https://example.com/',
    avatar: 'https://example.com/avatar.png',
    confirmation: '- [x] 同意'
  };

  assert.throws(
    () => validateFields({ ...base, link: 'javascript:alert(1)' }),
    /站点地址.*HTTP/
  );
  assert.throws(
    () => validateFields({ ...base, avatar: 'file:///etc/passwd' }),
    /头像地址.*HTTP/
  );
  assert.throws(
    () => validateFields({ ...base, link: 'https://user:pass@example.com/' }),
    /站点地址.*用户名或密码/
  );
  assert.throws(
    () => validateFields({ ...base, avatar: `https://example.com/${'x'.repeat(2049)}` }),
    /头像地址.*2048/
  );
  assert.throws(
    () => validateFields({ ...base, link: 'https://example.com/\nadmin' }),
    /站点地址.*控制字符/
  );
});

test('normalizes fragments and trailing slashes for duplicate detection', () => {
  const normalizeUrl = getExport('normalizeUrl');

  assert.equal(
    normalizeUrl('https://example.com/blog/#about'),
    'https://example.com/blog'
  );
  assert.equal(normalizeUrl('https://example.com/'), 'https://example.com');
});

test('appends a friend link without mutating other Fluid configuration', () => {
  const appendFriendLink = getExport('appendFriendLink');
  const original = {
    links: {
      custom: { enable: true, content: '<a>申请</a>' },
      items: [{
        title: 'Existing',
        intro: '已有站点',
        link: 'https://existing.example/',
        avatar: 'https://existing.example/avatar.png'
      }]
    },
    post: { mermaid: { enable: true } }
  };
  const entry = {
    title: 'Alice',
    intro: '记录学习',
    link: 'https://example.com/',
    avatar: 'https://example.com/avatar.png'
  };

  const updated = appendFriendLink(original, entry);

  assert.notEqual(updated, original);
  assert.deepEqual(original.links.items.map(item => item.title), ['Existing']);
  assert.deepEqual(updated.links.items.map(item => item.title), ['Existing', 'Alice']);
  assert.deepEqual(updated.links.custom, original.links.custom);
  assert.deepEqual(updated.post, original.post);
});

test('rejects a friend link whose normalized URL is already present', () => {
  const appendFriendLink = getExport('appendFriendLink');
  const config = {
    links: {
      items: [{
        title: 'Existing',
        intro: '已有站点',
        link: 'https://example.com/blog/',
        avatar: 'https://example.com/avatar.png'
      }]
    }
  };

  assert.throws(() => appendFriendLink(config, {
    title: 'Duplicate',
    intro: '重复站点',
    link: 'https://example.com/blog#home',
    avatar: 'https://example.com/other.png'
  }), /已经存在相同的站点地址/);
});

function createGitHubFake(initialConfig) {
  const state = {
    comments: [],
    files: new Map([['main', JSON.stringify(initialConfig, null, 2) + '\n']]),
    pullRequests: [],
    refs: new Map([['main', 'base-sha']]),
    updateCount: 0
  };

  function missing() {
    const error = new Error('Not Found');
    error.status = 404;
    return error;
  }

  const github = {
    rest: {
      git: {
        async getRef({ ref }) {
          const branch = ref.replace(/^heads\//, '');
          const sha = state.refs.get(branch);
          if (!sha) throw missing();
          return { data: { ref: `refs/heads/${branch}`, object: { sha } } };
        },
        async createRef({ ref, sha }) {
          const branch = ref.replace(/^refs\/heads\//, '');
          state.refs.set(branch, sha);
          state.files.set(branch, state.files.get('main'));
          return { data: { ref, object: { sha } } };
        }
      },
      repos: {
        async getContent({ path: filePath, ref }) {
          assert.equal(filePath, 'source/_data/fluid_config.json');
          const source = state.files.get(ref);
          if (source === undefined) throw missing();
          return {
            data: {
              type: 'file',
              path: filePath,
              content: Buffer.from(source).toString('base64'),
              encoding: 'base64',
              sha: `file-${ref}-${state.updateCount}`
            }
          };
        },
        async createOrUpdateFileContents({ path: filePath, branch, content }) {
          assert.equal(filePath, 'source/_data/fluid_config.json');
          state.files.set(branch, Buffer.from(content, 'base64').toString('utf8'));
          state.updateCount += 1;
          return { data: { content: { sha: `updated-${state.updateCount}` } } };
        }
      },
      pulls: {
        async list({ head, base }) {
          return {
            data: state.pullRequests.filter(pr =>
              pr.state === 'open' && pr.head.label === head && pr.base.ref === base
            )
          };
        },
        async create(payload) {
          const pr = {
            number: state.pullRequests.length + 1,
            html_url: `https://github.com/Penryn/hexo-blog/pull/${state.pullRequests.length + 1}`,
            state: 'open',
            title: payload.title,
            body: payload.body,
            head: { label: `Penryn:${payload.head}`, ref: payload.head },
            base: { ref: payload.base }
          };
          state.pullRequests.push(pr);
          return { data: pr };
        },
        async update({ pull_number: pullNumber, title, body }) {
          const pr = state.pullRequests.find(item => item.number === pullNumber);
          Object.assign(pr, { title, body });
          return { data: pr };
        }
      },
      issues: {
        async listComments() {
          return { data: state.comments };
        },
        async createComment({ body }) {
          const comment = {
            id: state.comments.length + 1,
            body,
            user: { type: 'Bot', login: 'github-actions[bot]' }
          };
          state.comments.push(comment);
          return { data: comment };
        },
        async updateComment({ comment_id: commentId, body }) {
          const comment = state.comments.find(item => item.id === commentId);
          comment.body = body;
          return { data: comment };
        }
      }
    }
  };

  return { github, state };
}

function createActionContext(body = validIssueBody) {
  return {
    repo: { owner: 'Penryn', repo: 'hexo-blog' },
    payload: {
      issue: { number: 42, title: '[友链申请] Alice', body },
      repository: { default_branch: 'main' }
    }
  };
}

function createCoreFake() {
  return {
    failures: [],
    setFailed(message) {
      this.failures.push(message);
    }
  };
}

const emptyFluidConfig = {
  links: {
    custom: { enable: true, content: '<a>申请</a>' },
    items: []
  }
};

test('creates one branch and PR that changes only the canonical friend-link data', async () => {
  const createFriendLinkPullRequest = getExport('createFriendLinkPullRequest');
  const { github, state } = createGitHubFake(emptyFluidConfig);
  const core = createCoreFake();

  await createFriendLinkPullRequest({
    github,
    context: createActionContext(),
    core
  });

  assert.deepEqual(core.failures, []);
  assert.equal(state.refs.has('automation/friend-link-42'), true);
  assert.deepEqual(JSON.parse(state.files.get('main')), emptyFluidConfig);
  assert.deepEqual(
    JSON.parse(state.files.get('automation/friend-link-42')).links.items,
    [{
      title: "Alice's Blog",
      intro: '记录学习与生活',
      link: 'https://example.com/blog/',
      avatar: 'https://example.com/avatar.png'
    }]
  );
  assert.equal(state.pullRequests.length, 1);
  assert.equal(state.pullRequests[0].title, "feat: 添加友链 Alice's Blog");
  assert.match(state.pullRequests[0].body, /Closes #42/);
  assert.match(state.comments[0].body, /pull\/1/);
});

test('updates the existing branch, PR, and bot comment after an Issue edit', async () => {
  const createFriendLinkPullRequest = getExport('createFriendLinkPullRequest');
  const { github, state } = createGitHubFake(emptyFluidConfig);
  const core = createCoreFake();
  const firstContext = createActionContext();

  await createFriendLinkPullRequest({ github, context: firstContext, core });
  const editedBody = validIssueBody
    .replace("Alice's Blog", 'Alice Notes')
    .replace('https://example.com/blog/', 'https://notes.example.com/');
  await createFriendLinkPullRequest({
    github,
    context: createActionContext(editedBody),
    core
  });

  const branchConfig = JSON.parse(state.files.get('automation/friend-link-42'));
  assert.deepEqual(branchConfig.links.items.map(item => item.title), ['Alice Notes']);
  assert.equal(state.pullRequests.length, 1);
  assert.equal(state.pullRequests[0].title, 'feat: 添加友链 Alice Notes');
  assert.equal(state.comments.length, 1);
  assert.match(state.comments[0].body, /已更新友链 PR/);
});

test('does not create a branch or PR when the site already exists on main', async () => {
  const createFriendLinkPullRequest = getExport('createFriendLinkPullRequest');
  const config = structuredClone(emptyFluidConfig);
  config.links.items.push({
    title: 'Existing',
    intro: '已有站点',
    link: 'https://example.com/blog#home',
    avatar: 'https://example.com/avatar.png'
  });
  const { github, state } = createGitHubFake(config);
  const core = createCoreFake();

  await createFriendLinkPullRequest({
    github,
    context: createActionContext(),
    core
  });

  assert.equal(state.refs.size, 1);
  assert.equal(state.pullRequests.length, 0);
  assert.match(state.comments[0].body, /已经存在相同的站点地址/);
});

test('reports invalid Issue input without creating repository state', async () => {
  const createFriendLinkPullRequest = getExport('createFriendLinkPullRequest');
  const { github, state } = createGitHubFake(emptyFluidConfig);
  const core = createCoreFake();
  const invalidBody = validIssueBody.replace('https://example.com/blog/', 'javascript:alert(1)');

  await createFriendLinkPullRequest({
    github,
    context: createActionContext(invalidBody),
    core
  });

  assert.equal(state.refs.size, 1);
  assert.equal(state.pullRequests.length, 0);
  assert.equal(core.failures.length, 1);
  assert.match(core.failures[0], /站点地址.*HTTP/);
  assert.match(state.comments[0].body, /无法生成友链 PR/);
});

test('Issue Form fields produce an application accepted by the automation parser', () => {
  const issueFormPath = path.join(
    root,
    '.github',
    'ISSUE_TEMPLATE',
    'friend-link.yml'
  );
  assert.equal(fs.existsSync(issueFormPath), true, 'friend-link Issue Form must exist');
  const form = yaml.load(fs.readFileSync(issueFormPath, 'utf8'));

  assert.equal(form.title, '[友链申请] ');
  const controls = form.body.filter(item => item.type !== 'markdown');
  const fixtureById = {
    title: 'Alice',
    intro: '记录学习',
    link: 'https://example.com/',
    avatar: 'https://example.com/avatar.png',
    confirmation: '- [x] 我已阅读申请说明，并确认以上信息真实有效'
  };
  assert.deepEqual(controls.map(item => item.id), Object.keys(fixtureById));
  for (const control of controls) {
    if (control.type === 'checkboxes') {
      assert.equal(control.attributes.options[0].required, true);
    } else {
      assert.equal(control.validations.required, true);
    }
  }

  const generatedBody = controls.map(control => [
    `### ${control.attributes.label}`,
    '',
    fixtureById[control.id]
  ].join('\n')).join('\n\n');
  const entry = automation.validateFields(automation.parseIssueBody(generatedBody));
  assert.deepEqual(entry, {
    title: 'Alice',
    intro: '记录学习',
    link: 'https://example.com/',
    avatar: 'https://example.com/avatar.png'
  });
});

test('friend-link workflow uses the trusted Issue event with least write permissions', () => {
  const workflowPath = path.join(
    root,
    '.github',
    'workflows',
    'friend-link-pr.yml'
  );
  assert.equal(fs.existsSync(workflowPath), true, 'friend-link workflow must exist');
  const workflow = yaml.load(fs.readFileSync(workflowPath, 'utf8'));

  assert.deepEqual(workflow.on.issues.types, ['opened', 'edited', 'reopened']);
  assert.equal(Object.hasOwn(workflow.on, 'pull_request_target'), false);
  const job = workflow.jobs['create-friend-link-pr'];
  assert.match(job.if, /\[友链申请\]/);
  assert.deepEqual(job.permissions, {
    contents: 'write',
    issues: 'write',
    'pull-requests': 'write'
  });
  assert.equal(job['timeout-minutes'], 5);
  assert.equal(job.steps[0].uses, 'actions/checkout@v4');
  assert.equal(job.steps[1].uses, 'actions/github-script@v7');
  assert.match(job.steps[1].with.script, /createFriendLinkPullRequest/);
});
