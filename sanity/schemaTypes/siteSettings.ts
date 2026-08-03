import { defineField, defineType, type StringRule } from "sanity";

import { approvedContact } from "../../lib/constants";
import { validateJapaneseProse, validateJapaneseText } from "./validation";

type ApprovedContactField = keyof typeof approvedContact;

export function validateApprovedContactValue(
  field: ApprovedContactField,
  value: unknown,
): true | string {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  return (
    value === approvedContact[field] ||
    `必须与已批准的日本站联系信息一致：${approvedContact[field]}`
  );
}

const approvedContactValidation =
  (field: ApprovedContactField) => (Rule: StringRule) =>
    Rule.required()
      .custom((value) => validateApprovedContactValue(field, value))
      .error("只能使用已批准公开的日本站联系信息");

const requiredJapaneseField = (
  name: string,
  title: string,
  description?: string,
) =>
  defineField({
    name,
    title,
    description,
    type: "string",
    validation: (Rule) =>
      Rule.required().custom(validateJapaneseText).error(`请输入${title}`),
  });

const contactPanelStyleFields = () => [
  defineField({
    name: "color",
    title: "配色",
    type: "string",
    options: {
      list: [
        { title: "浅色", value: "light" },
        { title: "深蓝", value: "deepBlue" },
        { title: "浅蓝", value: "paleBlue" },
      ],
      layout: "radio",
    },
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: "fontSize",
    title: "字号",
    type: "string",
    options: {
      list: [
        { title: "小", value: "sm" },
        { title: "中", value: "md" },
        { title: "大", value: "lg" },
        { title: "特大", value: "xl" },
      ],
      layout: "radio",
    },
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: "fontFamily",
    title: "字体",
    type: "string",
    options: {
      list: [
        { title: "无衬线", value: "sans" },
        { title: "衬线", value: "serif" },
        { title: "等宽", value: "mono" },
      ],
      layout: "radio",
    },
    validation: (Rule) => Rule.required(),
  }),
];

export default defineType({
  name: "siteSettings",
  title: "网站设置",
  type: "document",
  groups: [
    { name: "home", title: "ホーム" },
    { name: "navigation", title: "导航", default: true },
    { name: "contact", title: "联系信息" },
    { name: "footer", title: "页脚" },
    { name: "seo", title: "搜索优化" },
  ],
  fields: [
    defineField({
      name: "homeHero",
      title: "ホーム ヒーロー",
      type: "object",
      group: "home",
      fields: [
        requiredJapaneseField("eyebrow", "アイブロー"),
        requiredJapaneseField("title", "見出し"),
        defineField({ name: "summary", title: "概要", type: "text", rows: 3, validation: (Rule) => Rule.required().custom(validateJapaneseProse) }),
        defineField({ name: "backgroundImage", title: "背景画像", type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", title: "代替テキスト", type: "string", validation: (Rule) => Rule.required().custom(validateJapaneseText) })] }),
        defineField({ name: "primaryAction", title: "主ボタン", type: "object", fields: [requiredJapaneseField("label", "ラベル"), defineField({ name: "href", title: "リンク先", type: "string", validation: (Rule) => Rule.required().regex(/^(?:\/|https:\/\/|mailto:|tel:)/u) })] }),
        defineField({ name: "secondaryAction", title: "副ボタン", type: "object", fields: [requiredJapaneseField("label", "ラベル"), defineField({ name: "href", title: "リンク先", type: "string", validation: (Rule) => Rule.required().regex(/^(?:\/|https:\/\/|mailto:|tel:)/u) })] }),
        defineField({ name: "style", title: "表示プリセット", type: "object", fields: [
          defineField({ name: "color", title: "色", type: "string", options: { list: ["brand", "blue", "red", "neutral"], layout: "radio" } }),
          defineField({ name: "fontSize", title: "文字サイズ", type: "string", options: { list: ["sm", "md", "lg", "xl"], layout: "radio" } }),
          defineField({ name: "alignment", title: "配置", type: "string", options: { list: ["left", "center"], layout: "radio" } }),
          defineField({ name: "spacing", title: "余白", type: "string", options: { list: ["compact", "normal", "spacious"], layout: "radio" } }),
          defineField({ name: "desktopTitleWrap", title: "デスクトップ見出し折り返し", type: "string", options: { list: ["wrap", "nowrap"], layout: "radio" } }),
        ] }),
      ],
    }),
    defineField({
      name: "navigationLabels",
      title: "日文导航文字",
      description: "这些文字会显示在日本站的页头和移动菜单中。",
      type: "object",
      group: "navigation",
      fields: [
        requiredJapaneseField("home", "首页文字"),
        requiredJapaneseField("products", "产品文字"),
        requiredJapaneseField("applications", "应用领域文字"),
        requiredJapaneseField("company", "企业信息文字"),
        requiredJapaneseField("news", "新闻文字"),
        requiredJapaneseField("contact", "联系我们文字"),
      ],
      validation: (Rule) => Rule.required().error("请填写全部日文导航文字"),
    }),
    defineField({
      name: "distributorName",
      title: "日文总代理名称",
      type: "string",
      group: "contact",
      validation: approvedContactValidation("distributorName"),
    }),
    defineField({
      name: "companyName",
      title: "日文公司名称",
      type: "string",
      group: "contact",
      validation: approvedContactValidation("companyName"),
    }),
    defineField({
      name: "postalCode",
      title: "日本邮政编码",
      description: "格式：123-4567",
      type: "string",
      group: "contact",
      validation: approvedContactValidation("postalCode"),
    }),
    defineField({
      name: "address",
      title: "日文地址",
      type: "string",
      group: "contact",
      validation: approvedContactValidation("address"),
    }),
    defineField({
      name: "phone",
      title: "联系电话",
      description: "只填写已批准公开的日本联系电话。",
      type: "string",
      group: "contact",
      validation: approvedContactValidation("phone"),
    }),
    defineField({
      name: "inquiryEmail",
      title: "咨询邮箱",
      description: "只填写已批准公开的咨询邮箱。",
      type: "string",
      group: "contact",
      validation: approvedContactValidation("inquiryEmail"),
    }),
    defineField({
      name: "contactPage",
      title: "联系页内容与样式",
      description:
        "电话和邮件去向已保护，始终从已批准的联系字段生成，不能在此修改。",
      type: "object",
      group: "contact",
      fields: [
        defineField({
          name: "panel",
          title: "左侧联系卡片",
          type: "object",
          fields: [
            requiredJapaneseField("label", "卡片标签"),
            defineField({
              name: "description",
              title: "说明",
              type: "text",
              rows: 3,
              validation: (Rule) =>
                Rule.required()
                  .max(240)
                  .custom(validateJapaneseProse)
                  .custom((value) =>
                    typeof value !== "string" || !/[\r\n]/u.test(value) ||
                    "说明不能包含换行",
                  )
                  .error("请输入日文说明"),
            }),
            requiredJapaneseField("phoneActionLabel", "电话按钮标签"),
            requiredJapaneseField("emailActionLabel", "邮件按钮标签"),
            defineField({
              name: "style",
              title: "卡片样式",
              type: "object",
              fields: contactPanelStyleFields(),
            }),
          ],
        }),
        defineField({
          name: "guide",
          title: "右侧咨询流程",
          type: "object",
          fields: [
            requiredJapaneseField("eyebrow", "眉题"),
            requiredJapaneseField("title", "标题"),
            defineField({
              name: "steps",
              title: "步骤",
              type: "array",
              of: [
                defineField({
                  name: "step",
                  title: "步骤内容",
                  type: "string",
                  validation: (Rule) =>
                    Rule.required()
                      .custom(validateJapaneseText)
                      .error("请输入日文步骤内容"),
                }),
              ],
              validation: (Rule) => Rule.required().min(1).max(6),
            }),
            requiredJapaneseField("linkLabel", "邮件链接标签"),
            defineField({
              name: "style",
              title: "流程样式",
              type: "object",
              fields: contactPanelStyleFields(),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "footerText",
      title: "日文页脚说明",
      type: "text",
      rows: 3,
      group: "footer",
      validation: (Rule) =>
        Rule.required()
          .custom(validateJapaneseText)
          .error("请输入日文页脚说明"),
    }),
    defineField({
      name: "defaultSeoTitle",
      title: "默认日文 SEO 标题",
      type: "string",
      group: "seo",
      validation: (Rule) =>
        Rule.required()
          .min(10)
          .max(60)
          .custom(validateJapaneseText)
          .error("请输入 10 至 60 个字符的默认日文 SEO 标题"),
    }),
    defineField({
      name: "defaultSeoDescription",
      title: "默认日文 SEO 描述",
      type: "text",
      rows: 3,
      group: "seo",
      validation: (Rule) =>
        Rule.required()
          .min(50)
          .max(160)
          .custom(validateJapaneseProse)
          .error("请输入 50 至 160 个字符的默认日文 SEO 描述"),
    }),
    defineField({
      name: "defaultOgImage",
      title: "默认分享图片",
      type: "image",
      group: "seo",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "日文替代文字",
          type: "string",
          validation: (Rule) =>
            Rule.required()
              .custom(validateJapaneseText)
              .error("请输入日文替代文字"),
        }),
      ],
      validation: (Rule) => Rule.required().error("请上传默认分享图片"),
    }),
  ],
  preview: {
    prepare: () => ({
      title: "网站设置",
      subtitle: "日本站共享内容",
    }),
  },
});
