# 首页主标题桌面单行显示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让首页主视觉日文标题仅在桌面端完整显示为一行，同时保留移动端自动换行。

**Architecture:** 仅在现有首页专用 CSS 选择器上追加一个 `min-width: 64rem` 媒体查询。回归测试读取 `app/globals.css`，锁定该媒体查询以及两条必要声明，避免影响 CMS 数据、标题文案和其他页面。

**Tech Stack:** Next.js 静态导出、CSS、Vitest。

## Global Constraints

- 只修改 `app/globals.css` 和 `tests/styles.test.ts`。
- 目标选择器必须是 `.source-home-hero .source-hero h1`。
- 桌面断点必须是 `@media (min-width: 64rem)`。
- 不修改 `app/page.tsx` 的文案，不修改 Sanity schema 或内容。
- 小于 64rem 的既有自动换行行为必须保留。

---

### Task 1: 为首页桌面主标题增加隔离的单行规则

**Files:**
- Modify: `tests/styles.test.ts`
- Modify: `app/globals.css:2223-2228` and the existing desktop media-query area near `app/globals.css:2829`

**Interfaces:**
- Consumes: `.source-home-hero .source-hero h1` 的现有移动优先样式，当前含 `max-width: 12ch`。
- Produces: 仅在 `min-width: 64rem` 时覆盖 `max-width` 和 `white-space` 的 CSS 规则。

- [ ] **Step 1: 写入失败的回归测试**

在 `tests/styles.test.ts` 的末尾新增以下测试；它验证首页专用的桌面媒体查询存在，并且明确移除宽度限制、禁止换行。

```ts
describe("home hero desktop title", () => {
  it("keeps the home page title on one line only on desktop", async () => {
    const css = await readFile("app/globals.css", "utf8");
    const desktopRule = css.match(
      /@media \(min-width: 64rem\)\s*\{[\s\S]*?\.source-home-hero \.source-hero h1\s*\{([^}]+)\}/,
    )?.[1];

    expect(desktopRule).toContain("max-width: none;");
    expect(desktopRule).toContain("white-space: nowrap;");
  });
});
```

- [ ] **Step 2: 运行测试，确认它失败**

运行：

```powershell
& 'C:\Users\bwgd\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/styles.test.ts
```

预期：新增用例失败，因为 CSS 尚未包含首页标题的桌面覆盖规则。

- [ ] **Step 3: 添加最小 CSS 实现**

在 `app/globals.css` 的现有 `@media (min-width: 64rem)` 区块内添加以下规则；不改动默认的 `max-width: 12ch`，使其继续服务于移动端。

```css
.source-home-hero .source-hero h1 {
  max-width: none;
  white-space: nowrap;
}
```

- [ ] **Step 4: 运行针对性测试，确认通过**

运行：

```powershell
& 'C:\Users\bwgd\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/vitest/vitest.mjs run tests/styles.test.ts
```

预期：所有 `tests/styles.test.ts` 用例通过，包括新增的桌面标题用例。

- [ ] **Step 5: 执行生产验证**

运行：

```powershell
& 'C:\Users\bwgd\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' node_modules/next/dist/bin/next build
& 'C:\Users\bwgd\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/audit-static-assets.mjs
```

预期：Next.js 静态构建完成，静态资源审计通过。

- [ ] **Step 6: 目视检查两种视口**

在 `https://www.bebur-jp.com/` 检查：桌面（至少 1024px）标题为一行；手机宽度标题可换行，页面没有横向滚动或截断。

- [ ] **Step 7: 提交实现**

```powershell
git add -- app/globals.css tests/styles.test.ts
git commit -m "fix: keep home hero title on one desktop line"
```
