import { defineArrayMember, defineField } from "sanity";
import { carouselPresets, isSafeCarouselUrl } from "../../lib/home-carousel";
import { validateJapaneseProse, validateJapaneseText } from "./validation";

const japaneseText = (name: string, title: string, max: number) => defineField({
  name, title, type: "string", validation: Rule => Rule.required().max(max).custom(validateJapaneseText),
});
const styleLabels = {
  color: { title: "配色", labels: ["深蓝底白字", "白底深蓝字", "浅蓝底深蓝字"] },
  fontFamily: { title: "字体", labels: ["日文无衬线（推荐）", "日文衬线", "日文等宽"] },
  fontSize: { title: "标题字号", labels: ["小", "中（推荐）", "大", "特大"] },
  alignment: { title: "桌面文字位置", labels: ["左侧", "居中", "右侧"] },
};

export const homeCarouselField = defineField({
  name: "homeCarousel", title: "首页轮播", type: "object", group: "home",
  description: "日文文字与图片分离编辑。发布后需网站重新构建。关闭或清空幻灯片时恢复原首页主视觉，原设置不会删除。",
  initialValue: { enabled: true, autoPlay: true, intervalSeconds: 8 },
  fields: [
    defineField({ name: "enabled", title: "启用首页轮播", type: "boolean", initialValue: true }),
    defineField({ name: "autoPlay", title: "自动播放", type: "boolean", initialValue: true, description: "鼠标悬停、键盘聚焦及浏览器后台时暂停；用户选择减少动态效果时不自动播放。" }),
    defineField({ name: "intervalSeconds", title: "切换间隔（秒）", type: "number", initialValue: 8, validation: Rule => Rule.required().min(5).max(20) }),
    defineField({
      name: "slides", title: "幻灯片（拖动调整顺序）", type: "array", validation: Rule => Rule.max(20),
      of: [defineArrayMember({
        name: "homeCarouselSlide", title: "幻灯片", type: "object",
        fields: [
          japaneseText("eyebrow", "眉题", 60), japaneseText("title", "日文标题", 100),
          defineField({ name: "summary", title: "日文说明", type: "text", rows: 3, validation: Rule => Rule.required().max(300).custom(validateJapaneseProse) }),
          defineField({ name: "image", title: "背景图片（不含文字）", type: "image", options: { hotspot: true }, validation: Rule => Rule.required().assetRequired(), fields: [japaneseText("alt", "日文图片替代文字", 160)] }),
          defineField({ name: "primaryAction", title: "主按钮", type: "object", validation: Rule => Rule.required(), fields: [
            japaneseText("label", "日文按钮文字", 40),
            defineField({ name: "href", title: "链接地址", type: "string", description: "仅限以 / 开头的本站路径或完整 https:// 地址。", validation: Rule => Rule.required().custom(value => value === undefined || isSafeCarouselUrl(value) || "请输入安全的本站路径或 HTTPS 地址") }),
          ] }),
          defineField({ name: "style", title: "显示样式", type: "object", initialValue: { color: "deepBlue", fontFamily: "sans", fontSize: "md", alignment: "left" },
            description: "配色使用保证对比度的组合；移动端统一采用深蓝文字面板。",
            fields: (Object.keys(carouselPresets) as Array<keyof typeof carouselPresets>).map(name => defineField({
              name, title: styleLabels[name].title, type: "string",
              options: { list: carouselPresets[name].map((value, index) => ({ value, title: styleLabels[name].labels[index] })), layout: "radio" },
              validation: Rule => Rule.required().custom(value => value === undefined || (carouselPresets[name] as readonly string[]).includes(value) || "请选择列表中的显示样式"),
            })),
          }),
        ],
        preview: { select: { title: "title", subtitle: "eyebrow", media: "image" } },
      })],
    }),
  ],
});
