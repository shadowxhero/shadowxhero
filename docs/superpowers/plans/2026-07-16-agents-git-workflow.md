# AGENTS.md Git Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在仓库根目录固化 K4G 翻译版本规范，以及测试通过后自动独立提交并推送的 Git 工作流。

**Architecture:** 根目录 `AGENTS.md` 作为整个仓库的持久工作约定，不修改脚本运行逻辑。先验证规则文本完整，再运行当前 K4G 翻译改动的词典测试、语法检查与差异检查；所有验证成功后才提交并推送。

**Tech Stack:** Markdown、Git、Node.js

---

### Task 1: 创建仓库工作约定

**Files:**
- Create: `AGENTS.md`

- [ ] **Step 1: 创建规则文件**

```markdown
# 项目工作约定

默认使用中文回答，除非用户明确要求使用其他语言。
解释代码时默认使用中文。

## K4G 翻译版本更新规范

- 每次新增或修改词条后，必须同步更新 `K4G/K4G_CN.js` 文件头部的 `@version` 与 `@updateTime`。
- `@version` 按小版本递增，例如 `2.0`、`2.1`、`2.2`。
- `@updateTime` 使用当前时间，格式为 `YYYY/M/D HH:mm:ss`。
- 同时更新主脚本 `K4G/K4G 汉化.user.js` 的 `@version`，以便浏览器扩展检测更新。

## Git 工作流

- 每完成并测试通过一个脚本后，自动创建一次独立 Git 提交，无需用户再次提醒。
- 测试未通过时不得提交或推送。
- 提交成功后，自动将当前分支推送到其对应的远端分支，无需用户再次提醒。
- 推送失败时保留本地提交，并明确报告失败原因。
```

- [ ] **Step 2: 验证规则文本**

Run: `rg -n "@version|@updateTime|测试未通过|自动.*推送|推送失败" AGENTS.md`

Expected: 输出覆盖版本、时间、测试门禁、自动推送和失败处理五类规则。

### Task 2: 验证、提交并推送当前改动

**Files:**
- Modify: `K4G/K4G_CN.js`
- Modify: `K4G/K4G 汉化.user.js`
- Modify: `K4G/k4g-cn-dict.test.js`
- Create: `AGENTS.md`

- [ ] **Step 1: 运行词典测试**

Run: `node K4G/k4g-cn-dict.test.js`

Expected: 退出码为 `0`，无断言失败。

- [ ] **Step 2: 检查脚本语法**

Run: `node --check K4G/K4G_CN.js`

Expected: 退出码为 `0`。

Run: `node --check "K4G/K4G 汉化.user.js"`

Expected: 退出码为 `0`。

- [ ] **Step 3: 检查 Git 差异**

Run: `git diff --check`

Expected: 退出码为 `0`，无空白错误。

- [ ] **Step 4: 创建独立提交**

```bash
git add AGENTS.md K4G/K4G_CN.js "K4G/K4G 汉化.user.js" K4G/k4g-cn-dict.test.js
git commit -m "Add account notice translation and repository workflow"
```

Expected: 新提交仅包含 `AGENTS.md` 和三个 K4G 文件。

- [ ] **Step 5: 推送当前分支**

Run: `git push origin main`

Expected: `main` 成功更新到 `origin/main`；若失败，保留本地提交并报告错误。
