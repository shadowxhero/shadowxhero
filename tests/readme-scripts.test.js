// README 脚本列表校验
//
// 用途：确保 README 的「安装」表格与仓库中真实存在的脚本一一对应。
// 新增脚本后若忘记更新 README（或链接写错），运行本测试会失败。
// 在仓库根目录执行：
//
//   node tests/readme-scripts.test.js
//
// 什么算「可安装脚本」：文件名以 .user.js 结尾，且头部含 @match。
// 只有 UserScript 头、没有 @match 的文件属于依赖资源（例如 K4G/K4G_CN.js，
// 它由主脚本通过 @require 加载），不能单独安装，因此不占表格一行。

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 本文件位于 tests/ 下，仓库根是它的上一级
const ROOT = path.join(__dirname, '..');
const README = path.join(ROOT, 'README.md');

// 安装链接的固定前缀：仓库 raw 地址的 main 分支
const REPO = 'shadowxhero/shadowxhero';
const BRANCH = 'main';
const RAW_PREFIX = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;

/** 递归收集仓库内的文件（跳过 .git 与 node_modules） */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** 转成相对仓库根、以 / 分隔的路径 */
const toPosix = (full) => path.relative(ROOT, full).split(path.sep).join('/');

/** 按 URL 规则编码路径：逐段编码，保留分隔符 / */
const encodeRepoPath = (relPath) => relPath.split('/').map(encodeURIComponent).join('/');

/** 是否可安装脚本：.user.js 且头部含 @match */
function isInstallableScript(full) {
  if (!full.endsWith('.user.js')) return false;

  const text = fs.readFileSync(full, 'utf8');
  const end = text.indexOf('==/UserScript==');
  const head = end === -1 ? text.slice(0, 2000) : text.slice(0, end);

  return /^\/\/\s*@match\s+\S+/m.test(head);
}

const readme = fs.readFileSync(README, 'utf8');

// ===== 1. 仓库里每个可安装脚本都必须在 README 中列出 =====
const installable = walk(ROOT).filter(isInstallableScript).map(toPosix).sort();

assert.ok(installable.length > 0, '仓库中至少应有一个可安装脚本');

for (const rel of installable) {
  const url = RAW_PREFIX + encodeRepoPath(rel);
  assert.ok(
    readme.includes(url),
    `脚本未在 README 中列出，或链接编码不正确：${rel}\n  期望链接：${url}`
  );
}

// ===== 2. README 中的每个安装链接都必须指向真实的可安装脚本 =====
const escapedPrefix = RAW_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const links = [...readme.matchAll(new RegExp(`${escapedPrefix}([^"'\\s>)]+)`, 'g'))]
  .map((m) => m[1]);

assert.ok(links.length > 0, 'README 的安装表格中至少应有一个安装链接');

for (const encoded of links) {
  const rel = encoded.split('/').map(decodeURIComponent).join('/');
  const full = path.join(ROOT, rel);

  assert.ok(fs.existsSync(full), `README 中的安装链接指向不存在的文件：${rel}`);
  assert.ok(
    isInstallableScript(full),
    `README 中的安装链接指向的不是可安装脚本（缺少 @match）：${rel}`
  );
}

// ===== 3. 双向一一对应：两边数量必须一致（防重复行、防漏行）=====
assert.strictEqual(
  links.length,
  installable.length,
  `README 安装链接数（${links.length}）与仓库可安装脚本数（${installable.length}）不一致`
);

console.log(`README 脚本列表校验通过（${installable.length} 个脚本：${installable.join('、')}）`);
