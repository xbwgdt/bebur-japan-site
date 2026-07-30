import { defineArrayMember, defineField, defineType } from "sanity";

import { validateJapaneseProse, validateJapaneseText } from "./validation";

const validSlug = (value: unknown) => {
  const current =
    value &&
    typeof value === "object" &&
    "current" in value &&
    typeof value.current === "string"
      ? value.current
      : "";

  return (
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(current) ||
    "URL 路径只能使用小写英文字母、数字和连字符"
  );
};

const imageFields = [
  defineField({
    name: "alt",
    title: "日文替代文字",
    description: "用于无障碍阅读和搜索引擎，需准确描述图片内容。",
    type: "string",
    validation: (Rule) =>
      Rule.required().custom(validateJapaneseText).error("请输入日文替代文字"),
  }),
];

export default defineType({
  name: "news",
  title: "新闻",
  type: "document",
  groups: [
    { name: "content", title: "日文内容", default: true },
    { name: "media", title: "图片" },
    { name: "seo", title: "搜索优化" },
    { name: "publishing", title: "发布" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "日文新闻标题",
      type: "string",
      group: "content",
      validation: (Rule) =>
        Rule.required()
          .min(5)
          .max(120)
          .custom(validateJapaneseText)
          .error("请输入 5 至 120 个字符的日文新闻标题"),
    }),
    defineField({
      name: "slug",
      title: "URL 路径",
      description: "从日文标题生成，可按需要调整为英文路径。",
      type: "slug",
      group: "content",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom(validSlug).error("请输入有效的 URL 路径"),
    }),
    defineField({
      name: "publishedAt",
      title: "发布日期",
      type: "date",
      group: "content",
      options: {
        dateFormat: "YYYY-MM-DD",
      },
      validation: (Rule) => Rule.required().error("请选择发布日期"),
    }),
    defineField({
      name: "summary",
      title: "日文简要说明",
      type: "text",
      rows: 3,
      group: "content",
      validation: (Rule) =>
        Rule.required()
          .max(240)
          .custom(validateJapaneseProse)
          .error("请输入 240 个字符以内的日文简要说明"),
    }),
    defineField({
      name: "body",
      title: "日文正文",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "block" })],
      validation: (Rule) => Rule.required().min(1).error("请输入日文正文"),
    }),
    defineField({
      name: "relatedProducts",
      title: "相关产品",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "product" }],
        }),
      ],
    }),
    defineField({
      name: "coverImage",
      title: "封面图片",
      description: "用于新闻列表和详情页首图。",
      type: "image",
      group: "media",
      options: { hotspot: true },
      fields: imageFields,
      validation: (Rule) => Rule.required().error("请上传新闻封面图片"),
    }),
    defineField({
      name: "gallery",
      title: "图片库",
      type: "array",
      group: "media",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: imageFields,
        }),
      ],
    }),
    defineField({
      name: "seoTitle",
      title: "日文 SEO 标题",
      type: "string",
      group: "seo",
      validation: (Rule) =>
        Rule.required()
          .min(10)
          .max(60)
          .custom(validateJapaneseText)
          .error("请输入 10 至 60 个字符的日文 SEO 标题"),
    }),
    defineField({
      name: "seoDescription",
      title: "日文 SEO 描述",
      type: "text",
      rows: 3,
      group: "seo",
      validation: (Rule) =>
        Rule.required()
          .min(50)
          .max(160)
          .custom(validateJapaneseProse)
          .error("请输入 50 至 160 个字符的日文 SEO 描述"),
    }),
    defineField({
      name: "publishState",
      title: "发布状态",
      description: "只有选择“已发布”并发布文档后，内容才会进入公开查询。",
      type: "string",
      group: "publishing",
      initialValue: "draft",
      options: {
        list: [
          { title: "草稿", value: "draft" },
          { title: "已发布", value: "published" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required().error("请选择发布状态"),
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "publishedAt",
      media: "coverImage",
    },
  },
});
