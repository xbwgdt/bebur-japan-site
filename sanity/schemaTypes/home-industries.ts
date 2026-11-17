import {defineArrayMember,defineField} from "sanity";
import {homeIndustryTargets,isHomeIndustryRoute} from "../../lib/home-industries";
import {validateJapaneseText,validateJapaneseProse} from "./validation";
const japanese=(name:string,title:string,max:number)=>defineField({name,title,type:"string",validation:Rule=>Rule.required().max(max).custom(validateJapaneseText)});
export const homeIndustriesField=defineField({
  name:"homeIndustries",title:"首页行业应用大图轮播",type:"object",group:"home",
  description:"八个行业的原厂照片与日文标题，独立于首页顶部轮播和液冷动画。拖动调整顺序；背景仍在“首页背景与分类／优势配图→行业用途背景”中修改。发布后等待网站重新构建。",
  fields:[
    defineField({name:"enabled",title:"启用行业大图轮播",type:"boolean",initialValue:true}),
    japanese("title","日文区块标题",100),
    defineField({name:"summary",title:"日文区块说明",type:"text",rows:2,validation:Rule=>Rule.required().max(300).custom(validateJapaneseProse)}),
    defineField({name:"autoPlay",title:"自动播放",type:"boolean",initialValue:true,description:"鼠标停留、键盘聚焦、页面后台或减少动态效果时暂停。手动滑动后停止，可用按钮重新开始。"}),
    defineField({name:"intervalSeconds",title:"切换间隔（秒）",type:"number",initialValue:6,validation:Rule=>Rule.required().min(5).max(20)}),
    defineField({name:"fontFamily",title:"标题字体",type:"string",options:{list:[{title:"标准黑体",value:"sans"},{title:"明朝体",value:"serif"}]}}),
    defineField({name:"fontSize",title:"图片标题字号",type:"string",options:{list:[{title:"小",value:"sm"},{title:"中",value:"md"},{title:"大",value:"lg"}]}}),
    defineField({name:"slides",title:"行业照片（拖动排序）",type:"array",validation:Rule=>Rule.max(20),of:[defineArrayMember({name:"homeIndustryPhoto",title:"行业照片",type:"object",fields:[
      japanese("title","日文行业名称",80),
      defineField({name:"href",title:"对应日文方案页",type:"string",options:{list:homeIndustryTargets.map(item=>({title:item.title,value:item.href}))},validation:Rule=>Rule.required().custom(value=>value===undefined||isHomeIndustryRoute(value)||"请选择已有的日文行业方案页")}),
      defineField({name:"image",title:"行业大图",type:"image",options:{hotspot:false},validation:Rule=>Rule.required().assetRequired(),fields:[japanese("alt","日文图片替代文字",160)]}),
    ],preview:{select:{title:"title",subtitle:"href",media:"image"}}})]}),
  ],
});
