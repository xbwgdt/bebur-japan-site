import {defineField} from "sanity";
import defaults from "../../content/ja/company-overview.json";

export const companyOverviewStyleField = defineField({
  name:"companyOverviewStyle", title:"企业综合页：配色与字体", type:"object", group:"content",
  hidden:({document})=>(document?.slug as {current?:string}|undefined)?.current!=="overview",
  description:"用于 /about/overview。下方页面模块可修改正文、图片、卡片和排序；此处管理整页配色、字体和通用标签。",
  initialValue:defaults.companyOverviewStyle,
  fields:[
    defineField({name:"fontFamily",title:"页面字体",type:"string",options:{list:[{title:"标准黑体",value:"sans"},{title:"明朝体",value:"serif"}]}}),
    ...Object.entries({primary:"标题、链接与主按钮",background:"页面与卡片背景",surface:"浅色分区背景",text:"正文文字",muted:"次要说明文字"}).map(([name,title])=>defineField({name,title,type:"string",description:"# 加六位颜色代码，请保持文字和背景的对比度。",validation:Rule=>Rule.regex(/^#[0-9a-f]{6}$/i).error("请输入 # 加六位颜色代码。")})),
    ...Object.entries({eyebrow:"首屏眉题",navigationLabel:"页内导航说明",documentActionLabel:"证书查看按钮文字"}).map(([name,title])=>defineField({name,title,type:"string",validation:Rule=>Rule.max(80)})),
  ],
});
