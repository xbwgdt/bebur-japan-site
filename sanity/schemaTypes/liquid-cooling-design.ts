import { defineArrayMember, defineField } from "sanity";
import defaults from "../../content/ja/liquid-cooling-design.json";

const label = (name: string, title: string, type = "string") => defineField({name, title, type});
const navigation = (name: string, title: string, member: string) => defineField({name, title, type:"array", of:[defineArrayMember({name:member, title:"目录/跳转项", type:"object", fields:[label("label","日文文字"), defineField({name:"anchor",title:"目标章节锚点",description:"与页面模块的章节锚点一致，不填 #。",type:"string",validation:Rule=>Rule.regex(/^[a-z][a-z0-9-]*$/)})]})]});
const themeLabels = {ink:"首屏背景 / 主标题",ink2:"深色面板",paper:"正文背景",paperHi:"摘要 / 卡片背景",paperTint:"浅色强调背景",line:"边框",lineSoft:"分隔线",accent:"品牌强调色 / 链接",accentBright:"首屏强调色 / 动画虚线",warning:"警示色",muted:"次要正文",body:"正文文字",heroText:"首屏主文字",heroMuted:"首屏次要文字",diagramLine:"示意图管路 / 边框"};
const diagramLabels = {accessibleLabel:"无障碍说明",cdu:"CDU 标签",loop:"闭回路标签",coolant:"冷却液标签",plates:"冷板标签",supply:"供给标签",return:"返回标签",ph:"pH 标签",conductivity:"电导率标签",turbidity:"浊度标签",particles:"颗粒标签",sampling:"旁路采样标签",samplingNote:"采样备注",caption:"图下说明"};

export const liquidCoolingDiagramField = defineField({name:"diagram",title:"液冷流动动画 / 替换图片",type:"object",options:{collapsible:true},initialValue:Object.fromEntries(Object.entries(defaults.diagram).filter(([key])=>key!=="image")),fields:[
  defineField({name:"mode",title:"示意图模式",type:"string",options:{list:[{title:"沿用流动动画",value:"animation"},{title:"使用上传图片",value:"image"}]}}),
  defineField({name:"enabled",title:"启用管路流动动画",description:"关闭时保留示意图，只停止移动。用户系统设置减少动态效果时也会自动停止。",type:"boolean"}),
  defineField({name:"speed",title:"动画周期（秒）",description:"4～60 秒，数值越大移动越慢。",type:"number",validation:Rule=>Rule.min(4).max(60)}),
  ...Object.entries(diagramLabels).map(([name,title])=>label(name,title,name==="caption"?"text":"string")),
  defineField({name:"image",title:"替换示意图图片",description:"选择“使用上传图片”后显示；上传后填写日文替代文字。首页未上传此图时使用“专题图片”。",type:"image",options:{hotspot:true},fields:[label("alt","日文替代文字")]}),
]});

export const liquidCoolingDesignField = defineField({
  name:"liquidCoolingDesign",title:"液冷专题：版式、动画与配色",description:"仅用于液冷清浄度专题。正文和产品图片仍在下方页面模块中编辑；这里管理首屏、动画标签和配色。",type:"object",group:"content",
  hidden:({document})=> (document?.slug as {current?:string}|undefined)?.current !== "liquid-cooling-cleanliness-testing",
  options:{collapsible:true,collapsed:false},
  fields:[
    label("eyebrow","首屏日文眉题"),label("navigationTitle","页内导航标题"),label("tocTitle","目录标题"),label("detailsLabel","规格折叠按钮文字"),
    defineField({name:"fontFamily",title:"专题字体",type:"string",options:{list:[{title:"标准黑体",value:"sans"},{title:"明朝体",value:"serif"}]}}),
    defineField({name:"fontSize",title:"正文基准字号",type:"number",description:"14～20 px。",validation:Rule=>Rule.min(14).max(20)}),
    defineField({name:"theme",title:"专题配色（十六进制颜色）",description:"格式为 #2458A0。深色背景请配浅色文字，避免相近颜色导致看不清。",type:"object",options:{collapsible:true},fields:Object.entries(themeLabels).map(([name,title])=>defineField({name,title,type:"string",description:`默认 ${defaults.theme[name as keyof typeof defaults.theme]}`,validation:Rule=>Rule.regex(/^#[0-9a-f]{6}$/i).error("请输入 # 加六位颜色代码。") }))}),
    defineField({name:"metadata",title:"首屏信息（更新时间、参照基准等）",type:"array",of:[defineArrayMember({name:"solutionMeta",title:"信息",type:"object",fields:[label("label","日文标签"),label("value","日文内容")]})]}),
    navigation("navigation","页内目录文字与链接","solutionNavItem"),navigation("heroActions","首屏跳转链接","solutionAction"),
    defineField({name:"metrics",title:"首屏四项指标",type:"array",of:[defineArrayMember({name:"solutionMetric",title:"指标",type:"object",fields:[label("label","日文标签"),label("value","显示值"),label("note","日文备注","text")]})]}),
    label("metricNote","首屏指标适用范围说明","text"),
    defineField({name:"parameters",title:"四项测量的说明卡片",type:"array",of:[defineArrayMember({name:"solutionParameter",title:"测量项",type:"object",fields:[label("title","日文名称"),label("topic","日文用途标签"),label("value","显示值"),label("note","日文备注"),label("summary","日文说明","text")]})]}),
    liquidCoolingDiagramField,
  ],
});
