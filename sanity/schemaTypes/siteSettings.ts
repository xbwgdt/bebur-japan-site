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

export default defineType({
  name: "siteSettings",
  title: "网站设置",
  type: "document",
  groups: [
    { name: "navigation", title: "导航", default: true },
    { name: "contact", title: "联系信息" },
    { name: "footer", title: "页脚" },
    { name: "seo", title: "搜索优化" },
  ],
  fields: [
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
