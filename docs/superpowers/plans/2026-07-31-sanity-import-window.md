# Sanity 导入校验 JSDOM 环境修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 Sanity 导入校验在 Node 中提供隔离的临时 JSDOM 浏览器环境，恢复全量测试。

**Architecture:** `validateSanityImportDocuments` 在没有现成浏览器环境时创建 JSDOM；把其 `window`、`document` 和 Sanity 所需的 DOM 构造函数仅在 schema 加载及验证期间安装到全局。`finally` 关闭实例并恢复每一个原始全局值，确保不泄漏。

**Tech Stack:** Node.js、JSDOM、Sanity、Vitest。

## Global Constraints

- 只修改 `scripts/validate-sanity-import.mjs`、必要测试和依赖清单。
- 使用 JSDOM；不能以零散的 `EventTarget` 或 DOM 方法模拟替代。
- JSDOM 安装的每个全局值仅在校验期间有效，结束后必须恢复或删除，并调用 `window.close()`。
- 不修改 Sanity schema、CMS 内容、前台站点或 Cloudflare 配置。

---

### Task 1: 隔离 Sanity schema 加载所需的临时 JSDOM 环境

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tests/routes.test.ts`
- Modify: `scripts/validate-sanity-import.mjs`

**Interfaces:**
- Consumes: `validateSanityImportDocuments(documents)`，它在 Node 中创建 Vite SSR 模块服务器并加载 Sanity schema。
- Produces: 一个不污染校验前后全局状态的临时 `window` 与 `document`，可供 Sanity 的事件与 DOM API 使用。

- [ ] **Step 1: 写入失败测试**

在 `tests/routes.test.ts` 的 Sanity 导出用例旁新增直接调用 `validateSanityImportDocuments` 的测试：记录 `window` 与 `document` 的自有属性和引用，传入最小有效文档，等待校验完成后断言两者恢复为原始状态。保持现有导出脚本测试，以覆盖子进程环境。

- [ ] **Step 2: 运行测试，确认当前实现不能支持完整 DOM**

```powershell
& 'C:\Users\bwgd\.cache\codex-runtimes\node-v22.23.1-win-x64\node.exe' node_modules/vitest/vitest.mjs run tests/routes.test.ts
```

预期：现有 `EventTarget` 临时环境失败，错误表明缺少 DOM API，例如 `document.querySelectorAll`。

- [ ] **Step 3: 安装 JSDOM 并实现最小临时环境**

安装与现有 Vitest 兼容的 `jsdom`，更新锁文件。然后在 `scripts/validate-sanity-import.mjs` 中从 `jsdom` 导入 `JSDOM`，在缺少 `window` 时创建：

```js
const dom = new JSDOM("<!doctype html><html><body></body></html>");
```

将 `dom.window`、`dom.window.document`，以及 Sanity 实际加载所需的 DOM 构造函数以可恢复的方式安装到 `globalThis`。在 `finally` 中关闭 Vite 服务器后恢复所有值并执行 `dom.window.close()`。

- [ ] **Step 4: 运行针对性测试，确认通过**

```powershell
& 'C:\Users\bwgd\.cache\codex-runtimes\node-v22.23.1-win-x64\node.exe' node_modules/vitest/vitest.mjs run tests/routes.test.ts
```

预期：路由测试全部通过，导出文件生成，没有浏览器事件或 DOM 环境错误。

- [ ] **Step 5: 运行完整发布验证**

```powershell
& 'C:\Users\bwgd\.cache\codex-runtimes\node-v22.23.1-win-x64\node.exe' node_modules/vitest/vitest.mjs run
& 'C:\Users\bwgd\.cache\codex-runtimes\node-v22.23.1-win-x64\node.exe' node_modules/next/dist/bin/next build
& 'C:\Users\bwgd\.cache\codex-runtimes\node-v22.23.1-win-x64\node.exe' scripts/audit-static-assets.mjs
```

预期：所有命令以退出码 0 完成。

- [ ] **Step 6: 提交修复**

```powershell
git add -- package.json package-lock.json scripts/validate-sanity-import.mjs tests/routes.test.ts
git commit -m "fix: provide JSDOM for Sanity import validation"
```
