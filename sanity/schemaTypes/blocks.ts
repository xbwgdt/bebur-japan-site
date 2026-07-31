import { defineArrayMember, defineField, defineType } from "sanity";

import { validateJapaneseProse, validateJapaneseText } from "./validation";

const imageFields = [
  defineField({
    name: "alt",
    title: "日文替代文字",
    description: "请填写对应图片的日文替代文字，用于无障碍阅读和搜索。",
    type: "string",
    validation: (Rule) =>
      Rule.required().custom(validateJapaneseText).error("请填写日文替代文字。"),
  }),
];

const styleFields = () => [
  defineField({ name: "color", title: "颜色预设", description: "仅可选择已批准的品牌颜色，不支持自定义 CSS。", type: "string", options: { list: [{ title: "品牌色", value: "brand" }, { title: "蓝色", value: "blue" }, { title: "红色", value: "red" }, { title: "中性色", value: "neutral" }], layout: "radio" } }),
  defineField({ name: "fontSize", title: "字号预设", type: "string", options: { list: [{ title: "小", value: "sm" }, { title: "中", value: "md" }, { title: "大", value: "lg" }, { title: "特大", value: "xl" }], layout: "radio" } }),
  defineField({ name: "alignment", title: "对齐方式", type: "string", options: { list: [{ title: "左对齐", value: "left" }, { title: "居中", value: "center" }], layout: "radio" } }),
  defineField({ name: "spacing", title: "间距预设", type: "string", options: { list: [{ title: "紧凑", value: "compact" }, { title: "标准", value: "normal" }, { title: "宽松", value: "spacious" }], layout: "radio" } }),
  defineField({ name: "desktopTitleWrap", title: "桌面端标题换行", description: "仅控制桌面端标题是否保持单行。", type: "string", options: { list: [{ title: "允许换行", value: "wrap" }, { title: "保持单行", value: "nowrap" }], layout: "radio" } }),
];

const requiredJapaneseString = (name: string, title: string) =>
  defineField({ name, title, type: "string", validation: (Rule) => Rule.required().custom(validateJapaneseText).error(`请填写日文${title}。`) });

export const pageBlocks = [
  defineType({ name: "hero", title: "首屏横幅", type: "object", fields: [requiredJapaneseString("title", "标题"), defineField({ name: "summary", title: "摘要", type: "text", rows: 3, validation: (Rule) => Rule.required().custom(validateJapaneseProse).error("请填写日文摘要。") }), defineField({ name: "image", title: "横幅图片", type: "image", options: { hotspot: true }, fields: imageFields }), requiredJapaneseString("ctaLabel", "按钮文字"), defineField({ name: "ctaHref", title: "按钮链接", type: "string" }), ...styleFields()] }),
  defineType({ name: "richText", title: "富文本内容", type: "object", fields: [requiredJapaneseString("title", "标题"), defineField({ name: "content", title: "正文", type: "array", of: [defineArrayMember({ type: "block" })], validation: (Rule) => Rule.required().min(1).error("请填写正文。") }), ...styleFields()] }),
  defineType({ name: "gallery", title: "图片画廊", type: "object", fields: [requiredJapaneseString("title", "标题"), defineField({ name: "images", title: "图片", type: "array", of: [defineArrayMember({ type: "image", options: { hotspot: true }, fields: imageFields })], validation: (Rule) => Rule.required().min(1).error("请至少添加一张图片。") }), ...styleFields()] }),
  defineType({ name: "cardGrid", title: "卡片网格", type: "object", fields: [requiredJapaneseString("title", "标题"), defineField({ name: "cards", title: "卡片", type: "array", of: [defineArrayMember({ name: "card", title: "卡片", type: "object", fields: [requiredJapaneseString("title", "标题"), defineField({ name: "summary", title: "摘要", type: "text", rows: 3 }), defineField({ name: "image", title: "图片", type: "image", options: { hotspot: true }, fields: imageFields }), requiredJapaneseString("linkLabel", "链接文字"), defineField({ name: "href", title: "链接地址", type: "string" })] })], validation: (Rule) => Rule.required().min(1).error("请至少添加一张卡片。") }), ...styleFields()] }),
  defineType({ name: "dataTable", title: "数据表格", type: "object", fields: [requiredJapaneseString("title", "标题"), defineField({ name: "columns", title: "表头", type: "array", of: [defineArrayMember({ type: "string" })], validation: (Rule) => Rule.required().min(1).error("请至少添加一个表头。") }), defineField({ name: "rows", title: "表格行", type: "array", of: [defineArrayMember({ name: "dataRow", title: "表格行", type: "object", fields: [defineField({ name: "cells", title: "单元格", type: "array", of: [defineArrayMember({ type: "string" })], validation: (Rule) => Rule.required().min(1).error("请填写单元格。") })] })], validation: (Rule) => Rule.required().min(1).error("请至少添加一行数据。") }), ...styleFields()] }),
  defineType({ name: "cta", title: "行动号召", type: "object", fields: [requiredJapaneseString("title", "标题"), defineField({ name: "summary", title: "说明文字", type: "text", rows: 3 }), requiredJapaneseString("label", "按钮文字"), defineField({ name: "href", title: "按钮链接", type: "string" }), ...styleFields()] }),
];
