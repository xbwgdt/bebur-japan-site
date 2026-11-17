import { defineField } from "sanity";
import { validateJapaneseText } from "./validation";

const image = (name: string, title: string) => defineField({
  name, title, type: "image", options: { hotspot: false },
  fields: [defineField({ name: "alt", title: "日文图片替代文字", type: "string", validation: Rule => Rule.required().max(160).custom(validateJapaneseText) })],
});
const background = (name: string, title: string) => defineField({
  name, title, type: "object", fields: [
    image("image", "背景图片"),
    defineField({ name: "overlayColor", title: "遮罩颜色", type: "string", description: "# 加六位颜色代码；文字区另有对比底板保护。", validation: Rule => Rule.regex(/^#[0-9a-f]{6}$/i) }),
    defineField({ name: "overlayOpacity", title: "遮罩不透明度", type: "number", description: "0 表示无遮罩，0.85 表示较深遮罩。建议保留原图的可见度。", validation: Rule => Rule.min(0).max(0.85) }),
  ],
});
export const homeVisualsField = defineField({
  name: "homeVisuals", title: "首页背景与分类／优势配图", type: "object", group: "home",
  description: "仅控制对应区块图片，不会替换首页轮播或液冷动画。联系区背景会同步应用于全站咨询横幅。发布后需等网站重新构建完成。",
  fields: [
    background("about", "企业介绍背景"), background("technology", "技术优势背景"),
    background("applications", "行业用途背景"), background("contact", "全站咨询横幅背景"),
    image("companyImage", "企业介绍配图"),
    defineField({ name: "categoryImages", title: "五个产品分类配图", type: "object", fields: [
      image("cleanliness", "清浄度測定装置"), image("dosing", "薬注制御装置"), image("waterQuality", "水質分析計"), image("gasDetection", "ガス検知器"), image("flowLevel", "流量計・液位計"),
    ] }),
    defineField({ name: "strengthImages", title: "四个技术优势配图", type: "object", fields: [
      image("experience", "20年の経験"), image("technology", "電気化学・光学技術"), image("products", "横断する製品群"), image("global", "50か国以上"),
    ] }),
  ],
});
