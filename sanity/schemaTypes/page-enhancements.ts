import { defineArrayMember, defineField } from "sanity";
import { validateJapaneseText } from "./validation";

const japanese = (name: string, title: string, max = 300) => defineField({name,title,type:"string",validation:Rule=>Rule.required().max(max).custom(validateJapaneseText)});
export const categoryHeroField = defineField({
  name:"categoryHero",title:"药注分类页：首屏大图",type:"object",group:"content",
  hidden:({document})=>(document?.slug as {current?:string}|undefined)?.current!=="dosing",
  description:"单独管理药注分类页的大图、日文文字、配色和字体；不会覆盖产品列表、筛选或联系方式。发布后重新构建生效。",
  fields:[
    defineField({name:"eyebrow",title:"眉题",type:"string",validation:Rule=>Rule.required().max(60)}),
    japanese("title","日文标题",100),japanese("summary","日文说明"),
    defineField({name:"image",title:"首屏背景图",type:"image",options:{hotspot:true},fields:[japanese("alt","日文图片说明",160)],validation:Rule=>Rule.required()}),
    defineField({name:"color",title:"配色",type:"string",options:{list:[{title:"深蓝遮罩＋白字",value:"deepBlue"},{title:"浅色遮罩＋深蓝字",value:"light"}]}}),
    defineField({name:"fontFamily",title:"字体",type:"string",options:{list:[{title:"标准黑体",value:"sans"},{title:"明朝体",value:"serif"}]}}),
    defineField({name:"fontSize",title:"标题字号",type:"string",options:{list:[{title:"小",value:"sm"},{title:"中",value:"md"},{title:"大",value:"lg"}]}}),
  ],
});
export const applicationProductsField = defineField({
  name:"applicationProducts",title:"化工行业页：相关产品分组",type:"object",group:"content",
  hidden:({document})=>(document?.slug as {current?:string}|undefined)?.current!=="chemical-industry",
  description:"修改标题、用途说明、产品及顺序。卡片图片、产品简介与详情页共用产品管理中的资料，不重复维护。发布后重新构建生效。",
  fields:[japanese("title","区块日文标题",100),japanese("summary","区块日文说明"),defineField({
    name:"groups",title:"产品分组",type:"array",validation:Rule=>Rule.max(5),of:[defineArrayMember({name:"applicationProductGroup",title:"产品分组",type:"object",fields:[
      defineField({name:"category",title:"产品分类／更多产品链接",type:"string",options:{list:[{title:"气体检测",value:"gas-detection"},{title:"水质监测",value:"water-quality"}]},validation:Rule=>Rule.required()}),
      japanese("title","日文组标题",100),japanese("summary","日文用途说明"),japanese("moreLabel","更多产品按钮文字",60),
      defineField({name:"products",title:"推荐产品（可拖动排序）",description:"先选择本组的产品分类，再添加对应产品。",type:"array",of:[defineArrayMember({type:"reference",to:[{type:"product"}],options:{filter:({document,parentPath})=>{
        const groupKey=parentPath.find(segment=>typeof segment==="object"&&"_key" in segment) as {_key:string}|undefined;
        const groups=(document.applicationProducts as {groups?:{_key?:string;category?:string}[]}|undefined)?.groups;
        const category=groups?.find(group=>group._key===groupKey?._key)?.category;
        return {filter:'category == $category && publishState == "published"',params:{category:category??""}};
      }}})],validation:Rule=>Rule.required().min(1).max(12).unique()}),
    ],preview:{select:{title:"title",subtitle:"category"}}})],
  })],
});
