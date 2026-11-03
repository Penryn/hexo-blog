'use strict';

const FIELD_BY_HEADING = new Map([
  ['站点名称', 'title'],
  ['站点简介', 'intro'],
  ['站点地址', 'link'],
  ['头像地址', 'avatar'],
  ['申请确认', 'confirmation']
]);

const TEXT_LIMITS = {
  title: { label: '站点名称', max: 80 },
  intro: { label: '站点简介', max: 160 }
};

const URL_FIELDS = {
  link: '站点地址',
  avatar: '头像地址'
};

const FRIEND_LINKS_PATH = 'source/_data/fluid_config.json';
const COMMENT_MARKER = '<!-- friend-link-automation -->';

class InputError extends Error {}

function normalizeResponse(value) {
  const normalized = String(value || '').replace(/\r\n/g, '\n').trim();
  return /^_?(?:No response|未提供响应)_?$/i.test(normalized)
    ? ''
    : normalized;
}

function parseIssueBody(body) {
  const source = String(body || '');
  const headings = [...source.matchAll(/^###\s+(.+?)\s*$/gm)].map(match => ({
    heading: match[1].trim(),
    start: match.index,
    valueStart: match.index + match[0].length
  }));
  const fields = {};

  for (let index = 0; index < headings.length; index += 1) {
    const current = headings[index];
    const fieldName = FIELD_BY_HEADING.get(current.heading);
    if (!fieldName) continue;
    if (Object.hasOwn(fields, fieldName)) {
      throw new InputError(`检测到重复字段“${current.heading}”`);
    }

    const next = headings[index + 1];
    fields[fieldName] = normalizeResponse(source.slice(
      current.valueStart,
      next ? next.start : undefined
    ));
  }

  return fields;
}

function validateText(fieldName, value) {
  const { label, max } = TEXT_LIMITS[fieldName];
  const text = String(value || '').trim();
  if (!text) throw new InputError(`缺少“${label}”`);
  if (/\r|\n/.test(text)) {
    throw new InputError(`“${label}”必须是单行文本`);
  }
  if (/\p{Cc}/u.test(text)) {
    throw new InputError(`“${label}”不能包含控制字符`);
  }
  if ([...text].length > max) {
    throw new InputError(`“${label}”不能超过 ${max} 个字符`);
  }
  return text;
}

function validateUrl(fieldName, value) {
  const label = URL_FIELDS[fieldName];
  const text = String(value || '').trim();
  if (!text) throw new InputError(`缺少“${label}”`);
  if (text.length > 2048) {
    throw new InputError(`“${label}”不能超过 2048 个字符`);
  }
  if (/\p{Cc}/u.test(text)) {
    throw new InputError(`“${label}”不能包含控制字符`);
  }

  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw new InputError(`“${label}”必须是完整的 HTTP(S) URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new InputError(`“${label}”只支持 HTTP(S) URL`);
  }
  if (parsed.username || parsed.password) {
    throw new InputError(`“${label}”不能包含用户名或密码`);
  }
  return text;
}

function validateFields(fields) {
  const title = validateText('title', fields.title);
  const intro = validateText('intro', fields.intro);
  const link = validateUrl('link', fields.link);
  const avatar = validateUrl('avatar', fields.avatar);
  if (!/\[[xX]\]/.test(String(fields.confirmation || ''))) {
    throw new InputError('请勾选“申请确认”');
  }
  return { title, intro, link, avatar };
}

function normalizeUrl(value) {
  const parsed = new URL(value);
  parsed.hash = '';
  if (parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  }
  return parsed.toString().replace(/\/$/, '');
}

function appendFriendLink(config, entry) {
  if (!config || !config.links || !Array.isArray(config.links.items)) {
    throw new Error('友链配置缺少 links.items 数组');
  }
  const expectedUrl = normalizeUrl(entry.link);
  const duplicate = config.links.items.some(item => {
    try {
      return normalizeUrl(item.link) === expectedUrl;
    } catch {
      return false;
    }
  });
  if (duplicate) {
    throw new InputError('已经存在相同的站点地址');
  }

  const updated = structuredClone(config);
  updated.links.items.push(structuredClone(entry));
  return updated;
}

async function readFluidConfig(github, repo, ref) {
  const response = await github.rest.repos.getContent({
    ...repo,
    path: FRIEND_LINKS_PATH,
    ref
  });
  if (Array.isArray(response.data) || response.data.type !== 'file') {
    throw new Error(`${FRIEND_LINKS_PATH} 不是文件`);
  }
  const source = Buffer.from(
    response.data.content.replace(/\n/g, ''),
    'base64'
  ).toString('utf8');
  return {
    config: JSON.parse(source),
    sha: response.data.sha,
    source
  };
}

async function ensureBranch(github, repo, branch, baseSha) {
  try {
    await github.rest.git.getRef({ ...repo, ref: `heads/${branch}` });
    return;
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  try {
    await github.rest.git.createRef({
      ...repo,
      ref: `refs/heads/${branch}`,
      sha: baseSha
    });
  } catch (error) {
    if (error.status !== 422) throw error;
  }
}

async function findOpenPullRequest(github, repo, branch, base) {
  const response = await github.rest.pulls.list({
    ...repo,
    state: 'open',
    head: `${repo.owner}:${branch}`,
    base,
    per_page: 1
  });
  return response.data[0];
}

async function upsertIssueComment(github, repo, issueNumber, message) {
  const body = `${COMMENT_MARKER}\n${message}`;
  const response = await github.rest.issues.listComments({
    ...repo,
    issue_number: issueNumber,
    per_page: 100
  });
  const existing = response.data.find(comment =>
    comment.user?.type === 'Bot' && comment.body?.includes(COMMENT_MARKER)
  );

  if (existing) {
    await github.rest.issues.updateComment({
      ...repo,
      comment_id: existing.id,
      body
    });
    return;
  }
  await github.rest.issues.createComment({
    ...repo,
    issue_number: issueNumber,
    body
  });
}

function pullRequestBody(issueNumber) {
  return [
    '此 PR 由友链申请 Issue 自动生成，只更新 Fluid 的友链数据。',
    '',
    `Closes #${issueNumber}`
  ].join('\n');
}

async function createFriendLinkPullRequest({ github, context, core }) {
  const repo = context.repo;
  const issue = context.payload.issue;
  const issueNumber = issue.number;
  const defaultBranch = context.payload.repository.default_branch;
  const branch = `automation/friend-link-${issueNumber}`;
  let entry;

  try {
    entry = validateFields(parseIssueBody(issue.body));
  } catch (error) {
    if (!(error instanceof InputError)) throw error;
    await upsertIssueComment(
      github,
      repo,
      issueNumber,
      `无法生成友链 PR：${error.message}。请修改 Issue 后重试。`
    );
    core.setFailed(error.message);
    return;
  }

  const baseRef = await github.rest.git.getRef({
    ...repo,
    ref: `heads/${defaultBranch}`
  });
  const baseFile = await readFluidConfig(github, repo, defaultBranch);
  let desiredConfig;

  try {
    desiredConfig = appendFriendLink(baseFile.config, entry);
  } catch (error) {
    if (!(error instanceof InputError)) throw error;
    await upsertIssueComment(github, repo, issueNumber, error.message);
    return;
  }

  await ensureBranch(
    github,
    repo,
    branch,
    baseRef.data.object.sha
  );

  const branchFile = await readFluidConfig(github, repo, branch);
  const desiredSource = `${JSON.stringify(desiredConfig, null, 2)}\n`;
  if (branchFile.source !== desiredSource) {
    await github.rest.repos.createOrUpdateFileContents({
      ...repo,
      path: FRIEND_LINKS_PATH,
      branch,
      sha: branchFile.sha,
      message: `feat: add friend link from #${issueNumber}`,
      content: Buffer.from(desiredSource, 'utf8').toString('base64')
    });
  }

  const title = `feat: 添加友链 ${entry.title}`;
  const body = pullRequestBody(issueNumber);
  const existingPullRequest = await findOpenPullRequest(
    github,
    repo,
    branch,
    defaultBranch
  );

  if (existingPullRequest) {
    await github.rest.pulls.update({
      ...repo,
      pull_number: existingPullRequest.number,
      title,
      body
    });
    await upsertIssueComment(
      github,
      repo,
      issueNumber,
      `已更新友链 PR：[#${existingPullRequest.number}](${existingPullRequest.html_url})。`
    );
    return;
  }

  const pullRequest = await github.rest.pulls.create({
    ...repo,
    title,
    head: branch,
    base: defaultBranch,
    body,
    maintainer_can_modify: true
  });
  await upsertIssueComment(
    github,
    repo,
    issueNumber,
    `已创建友链 PR：[#${pullRequest.data.number}](${pullRequest.data.html_url})。合并后本 Issue 会自动关闭。`
  );
}

module.exports = {
  InputError,
  appendFriendLink,
  createFriendLinkPullRequest,
  normalizeUrl,
  parseIssueBody,
  validateFields
};
