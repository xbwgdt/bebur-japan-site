# Sanity 导入校验的浏览器事件环境修复

## 目标

恢复完整 Vitest 测试中的 Sanity 导入校验，使其在 Node 环境内加载 Sanity schema 时不再触发 `TypeError: Invalid event target`。

## 根因

`scripts/validate-sanity-import.mjs` 会把缺失的 `globalThis.window` 临时指向 Node 的 `globalThis`。Sanity 3.99 在检测到 `window` 后会调用 RxJS `fromEvent(window, ...)`，并进一步访问 `document.querySelectorAll`。Node 的 `globalThis` 没有浏览器事件目标和 DOM 查询接口，因而失败。

## 范围

- 仅修改 Sanity 导入校验的临时全局环境和它的测试。
- 临时使用 JSDOM 提供完整的浏览器 `window` 和 `document`，并在校验完成后关闭实例、完整恢复全局状态。
- 不修改 Sanity schema、CMS 内容、前台站点、Cloudflare 配置或产品数据。

## 验收标准

1. `scripts/export-sanity-import.mjs` 可在 Node 环境中完成并生成确定性的导入文件。
2. `tests/routes.test.ts` 的 Sanity 导出用例通过。
3. 全量 Vitest 测试、生产构建和静态资源审计通过。
4. 修复不会持久污染 `globalThis.window`。

## 风险与回退

影响范围限于构建时校验脚本。若发生问题，撤销临时 JSDOM 环境逻辑即可恢复原行为；不会影响生产网页或 Sanity Studio。
