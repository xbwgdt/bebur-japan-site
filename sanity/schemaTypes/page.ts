import { defineArrayMember, defineField, defineType } from "sanity";

import { pageBlocks } from "./blocks";
import { validateJapaneseProse, validateJapaneseText } from "./validation";

const validSlug = (value: unknown) => {
  const current = value && typeof value === "object" && "current" in value && typeof value.current === "string" ? value.current : "";
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(current) || "URL 路径只能使用小写英文、数字和连字符。";
};

export default defineType({
  name: "page",
  title: "页面内容",
  type: "document",
  groups: [{ name: "content", title: "页面内容", default: true }, { name: "seo", title: "搜索优化" }, { name: "publishing", title: "发布" }],
  fields: [
    defineField({ name: "title", title: "页面标题", description: "用于后台识别该页面，请填写日文。", type: "string", group: "content", validation: (Rule) => Rule.required().custom(validateJapaneseText).error("请填写日文页面标题。") }),
    defineField({ name: "slug", title: "URL 路径", description: "与现有网站路径一致，不要修改已发布页面的路径。", type: "slug", group: "content", options: { source: "title", maxLength: 96 }, validation: (Rule) => Rule.required().custom(validSlug).error("请填写有效的 URL 路径。") }),
    defineField({ name: "blocks", title: "页面模块", description: "按页面显示顺序添加和拖动模块。", type: "array", group: "content", of: pageBlocks.map((block) => defineArrayMember({ type: block.name })), validation: (Rule) => Rule.required().min(1).error("请至少添加一个页面模块。") }),
    defineField({ name: "seoTitle", title: "SEO 标题", type: "string", group: "seo", validation: (Rule) => Rule.required().min(10).max(60).custom(validateJapaneseText).error("请填写 10 到 60 字的日文 SEO 标题。") }),
    defineField({ name: "seoDescription", title: "SEO 描述", type: "text", rows: 3, group: "seo", validation: (Rule) => Rule.required().min(50).max(160).custom(validateJapaneseProse).error("请填写 50 到 160 字的日文 SEO 描述。") }),
    defineField({ name: "publishState", title: "发布状态", description: "只有已发布页面会在前台显示。", type: "string", group: "publishing", initialValue: "draft", options: { list: [{ title: "草稿", value: "draft" }, { title: "已发布", value: "published" }], layout: "radio" }, validation: (Rule) => Rule.required().error("请选择发布状态。") }),
  ],
  preview: { select: { title: "title", subtitle: "slug.current" } },
});
