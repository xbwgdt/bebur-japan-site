import { defineArrayMember, defineField, defineType } from "sanity";

const japaneseText = (value: unknown) =>
  typeof value !== "string" ||
  value.length === 0 ||
  /[\u3040-\u30ff\u3400-\u9fff]/u.test(value) ||
  "请输入包含日文假名或汉字的内容";

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
      Rule.required().custom(japaneseText).error("请输入日文替代文字"),
  }),
];

export default defineType({
  name: "product",
  title: "产品",
  type: "document",
  groups: [
    { name: "content", title: "日文内容", default: true },
    { name: "media", title: "图片" },
    { name: "seo", title: "搜索优化" },
    { name: "publishing", title: "发布" },
  ],
  fields: [
    defineField({
      name: "category",
      title: "产品分类",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "清洁度测量装置", value: "cleanliness" },
          { title: "加药控制装置", value: "dosing" },
          { title: "水质分析仪", value: "water-quality" },
          { title: "气体检测仪", value: "gas-detection" },
          { title: "流量计与液位计", value: "flow-level" },
        ],
        layout: "dropdown",
      },
      validation: (Rule) => Rule.required().error("请选择产品分类"),
    }),
    defineField({
      name: "title",
      title: "日文产品名称",
      description: "此名称会显示在日本站的产品列表和详情页。",
      type: "string",
      group: "content",
      validation: (Rule) =>
        Rule.required()
          .min(2)
          .max(100)
          .custom(japaneseText)
          .error("请输入 2 至 100 个字符的日文产品名称"),
    }),
    defineField({
      name: "slug",
      title: "URL 路径",
      description: "从日文产品名称生成，可按需要调整为英文路径。",
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
      name: "model",
      title: "型号",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required().error("请输入产品型号"),
    }),
    defineField({
      name: "summary",
      title: "日文简要说明",
      description: "用于产品卡片和详情页开头。",
      type: "text",
      rows: 3,
      group: "content",
      validation: (Rule) =>
        Rule.required()
          .max(240)
          .custom(japaneseText)
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
      name: "features",
      title: "主要特点",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "string",
          validation: (Rule) =>
            Rule.required().custom(japaneseText).error("请输入日文特点"),
        }),
      ],
    }),
    defineField({
      name: "applications",
      title: "用途与应用领域",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "string",
          validation: (Rule) =>
            Rule.required().custom(japaneseText).error("请输入日文用途"),
        }),
      ],
    }),
    defineField({
      name: "specifications",
      title: "技术规格",
      description: "每行填写一个日文规格名称及其准确数值。",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          name: "specification",
          title: "规格行",
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "日文规格名称",
              type: "string",
              validation: (Rule) =>
                Rule.required()
                  .custom(japaneseText)
                  .error("请输入日文规格名称"),
            }),
            defineField({
              name: "value",
              title: "规格值",
              description: "保持原始数值、单位和测量范围。",
              type: "string",
              validation: (Rule) => Rule.required().error("请输入规格值"),
            }),
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "value",
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1).error("请至少添加一行技术规格"),
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
      description: "用于产品列表和详情页首图。",
      type: "image",
      group: "media",
      options: { hotspot: true },
      fields: imageFields,
      validation: (Rule) => Rule.required().error("请上传产品封面图片"),
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
          .custom(japaneseText)
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
          .custom(japaneseText)
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
      subtitle: "model",
      media: "coverImage",
    },
  },
});
