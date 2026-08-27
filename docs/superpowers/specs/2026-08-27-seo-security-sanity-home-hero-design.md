# Bebur Japan SEO、安全头与 Sanity 首页接管设计

## 目标

只处理审计问题 1、2、4：消除重复 SEO 标题并补齐分享图片，增加经过验证的安全响应头，将当前首页主视觉完整写入 Sanity。不得改变现有页面结构、视觉布局、日文正文、联系方式、域名或账号权限。

## 现状与根因

### SEO

- 根布局使用 `title.template = "%s｜Bebur Japan"`。
- Sanity 和本地内容中的多数 `seoTitle` 已经包含 `｜Bebur Japan`。
- 动态页面把完整 `seoTitle` 交给根模板后，品牌后缀被追加第二次。
- 子页面创建自己的 `openGraph` 对象时，没有图片的页面不会继承根布局分享图片。
- `/about/company-profile` 与 `/about/overview` 当前输出相同标题，需要使用各自页面身份生成不同标题。

### 安全响应头

- Cloudflare Pages 默认提供 `X-Content-Type-Options` 和 `Referrer-Policy`。
- `public/_headers` 目前只处理扩展名省略的 PNG 路由和静态资源缓存，没有全站安全策略。
- 页面包含 Next.js 静态导出内联脚本及 Cloudflare Web Analytics，因此 CSP 必须允许站内脚本、必要的内联初始化和 Cloudflare Analytics，不能直接套用过严模板。

### Sanity 首页主视觉

- schema、查询和前端解析逻辑已经支持 `siteSettings.homeHero`。
- 生产数据集中该字段为空，所以前端一直使用 `lib/site-settings.ts` 的本地备用值。
- 现有导入文档包含用户尚未提交的联系页变更，不得重新生成或整体覆盖 `siteSettings`。

## 设计

### 1. SEO 元数据规范化

新增一个集中式元数据辅助模块，职责仅包括：

1. 去除输入标题末尾已有的一个或多个 `｜Bebur Japan` 后缀。
2. 页面 `<title>` 交给根模板追加一次品牌名。
3. `openGraph.title` 和 Twitter 标题显式追加一次品牌名，因为它们不使用根模板。
4. 页面无内容图片时使用网站默认分享图片。
5. 为 `company-profile` 与 `overview` 提供不同的页面标题，不修改页面正文。

产品、新闻、企业信息和应用案例的动态 metadata 都调用同一个辅助模块，避免各路由再次产生不同规则。

### 2. Cloudflare Pages 安全头

在 `public/_headers` 增加全站规则：

- `Strict-Transport-Security: max-age=31536000`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- 限制相机、麦克风、地理位置等不需要的浏览器权限
- CSP：默认仅本站；图片允许本站、`data:`、`blob:` 和 `cdn.sanity.io`；脚本允许本站、Next.js 必要内联初始化和 `static.cloudflareinsights.com`；连接允许本站、Cloudflare Analytics 和 Sanity API；禁止被 iframe 嵌入；限制 `base-uri` 与表单目标

先在本地静态输出和 Cloudflare 预览部署验证页面、图片、菜单、Sanity 内容及 Web Analytics 无 CSP 报错，再发布正式站。HSTS 不包含 `includeSubDomains` 或 `preload`，避免影响尚未盘点的其他子域名。

### 3. Sanity 首页主视觉同步

新增一个仅更新 `siteSettings.homeHero` 的幂等同步脚本：

1. 从已批准的 `localPublicSiteSettings.homeHero` 读取当前线上主视觉文字、按钮和样式。
2. 对背景图计算摘要，复用 Sanity 中相同资产；不存在时只上传这一张图片。
3. 使用 patch 只设置 `homeHero`，不得 create-or-replace 整个 `siteSettings`，因此不会覆盖联系方式和联系页设置。
4. 同步后查询生产数据集，核对标题、按钮、样式和图片资产引用。
5. 由现有 Sanity webhook 触发 Cloudflare 生产构建。

本地备用内容继续保留，作为 Sanity 暂时不可用或字段无效时的安全降级；正常发布内容必须来自 Sanity。

## 测试与验收

### 自动测试

- 标题已含一个或多个品牌后缀时，最终 HTML 标题只出现一次 `Bebur Japan`。
- 所有公开路由标题唯一；`company-profile` 与 `overview` 不重复。
- 无页面图片时，metadata 使用默认分享图片。
- `_headers` 包含要求的安全头和 Cloudflare/Sanity 必要 CSP 来源。
- 首页同步脚本只产生 `set.homeHero` patch，不替换 `siteSettings` 其他字段。
- 全量 Vitest、Sanity typecheck、内容审计、静态输出审计和 Next.js build 全部通过。

### 预览与线上验证

- 桌面端与移动端首页视觉与当前正式站一致。
- 110 个 sitemap 页面全部返回 200，404 路由仍返回 404。
- 110 个页面标题均只含一次品牌名且没有重复页面标题。
- 所有页面都有分享图片、canonical、description、单一 H1 和 Analytics beacon。
- 响应头包含 HSTS、CSP、X-Frame-Options 和 Permissions-Policy。
- 浏览器控制台没有 CSP、图片、脚本或 Analytics 错误。
- Sanity 修改首页主标题并发布后，Cloudflare 自动构建；为避免改变正式文案，只用无内容变化的发布或恢复原值验证发布链路。

## 发布与回滚

- 代码变更先提交并推送，确认 Cloudflare 预览部署通过后再进入生产。
- Sanity patch 在代码已支持并通过预览验证后执行。
- 如 CSP 导致资源被拦截，回滚安全头提交；不修改 Sanity 文案。
- 如 Sanity 同步异常，仅移除 `homeHero` 字段即可恢复当前本地备用显示，其他 `siteSettings` 字段不受影响。

## 明确不在本次范围

- 不迁移 `bebur-jp.com` DNS，不处理根域名。
- 不新增 Sanity 成员或调整套餐。
- 不调整现有页面布局、配色、字体或日文正文。
- 不改变静态资源缓存策略。
