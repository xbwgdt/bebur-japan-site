import { describe, expect, it } from "vitest";
import { buildFidelityPage, publicationFingerprint, requirePublicationFingerprint } from "../scripts/lib/liquid-cooling-fidelity.mjs";

const page = () => ({
  _id: "page--liquid-cooling-cleanliness-testing", _type: "page", _rev: "before",
  title: "以前のタイトル", seoTitle: "保持するSEO", customField: "保持",
  blocks: [
    {_key:"hero",_type:"hero",anchorId:"overview",fontSize:"xl",color:"blue",title:"旧見出し",summary:"旧説明",image:{_type:"image",alt:"保持する写真",asset:{_ref:"image-original"}}},
    {_key:"products",_type:"cardGrid",anchorId:"products",cards:[{_key:"sensor",title:"旧製品名",href:"/products/old",image:{alt:"保持する製品画像",asset:{_ref:"image-sensor"}}}]},
  ],
  liquidCoolingDesign:{theme:{ink:"#102030"},fontSize:18,diagram:{speed:22,image:{asset:{_ref:"image-custom"}}},parameters:[{_key:"ph",value:"旧値"}]},
});
const source = () => ({title:"新しいタイトル",blocks:[
  {_key:"hero",_type:"hero",anchorId:"overview",fontSize:"md",color:"neutral",title:"復元した見出し",summary:"復元した説明",image:{asset:{url:"/placeholder.svg"}}},
  {_key:"new-prose",_type:"richText",anchorId:"restored-detail",title:"復元した詳細",content:[{_type:"block",style:"normal",children:[{_type:"span",text:"失われた条件を復元します。"}]}]},
  {_key:"products",_type:"cardGrid",anchorId:"products",cards:[{_key:"sensor",title:"復元した製品名",href:"/products/correct",image:{asset:{url:"/local.jpg"}}}]},
]});

describe("precise source-fidelity CMS migration",()=>{
  it("updates only explicitly approved standard-localization design fields",()=>{
    const before={...page(),liquidCoolingDesign:{...page().liquidCoolingDesign,metrics:[{_key:"ph",value:"old",custom:"keep"}],navigation:[{_key:"standards",label:"old",anchor:"standards"}]}};
    const reviewed={metrics:[{_key:"ph",value:"new"}],navigation:[{_key:"standards",label:"規格・技術指針",anchor:"standards"}],theme:{ink:"#FFFFFF"}};
    const result=buildFidelityPage(before,source(),reviewed,{approvedDesignFields:["metrics","navigation"]});
    expect(result.liquidCoolingDesign.metrics).toEqual([{_key:"ph",value:"new",custom:"keep"}]);
    expect(result.liquidCoolingDesign.navigation[0].label).toBe("規格・技術指針");
    expect(result.liquidCoolingDesign.theme).toEqual(before.liquidCoolingDesign.theme);
    expect(buildFidelityPage(before,source(),reviewed).liquidCoolingDesign.metrics).toEqual(before.liquidCoolingDesign.metrics);
    expect(()=>buildFidelityPage(before,source(),reviewed,{approvedDesignFields:["theme"]})).toThrow(/design field/i);
  });
  it("updates reviewed text and adds blocks while preserving media, styling and unrelated fields",()=>{
    const before=page();
    const result=buildFidelityPage(before,source(),{parameters:[{_key:"ph",value:"復元値"}],theme:{ink:"#FFFFFF"},diagram:{speed:14}});
    expect(result.title).toBe("新しいタイトル");
    expect(result.blocks.map((b:any)=>b._key)).toEqual(["hero","new-prose","products"]);
    expect(result.blocks[0]).toMatchObject({title:"復元した見出し",fontSize:"xl",color:"blue",image:before.blocks[0].image});
    expect(result.blocks[2].cards[0]).toMatchObject({title:"復元した製品名",href:"/products/correct",image:before.blocks[1].cards?.[0].image});
    expect(result.seoTitle).toBe(before.seoTitle);
    expect(result.customField).toBe(before.customField);
    expect(result.liquidCoolingDesign).toMatchObject({theme:before.liquidCoolingDesign.theme,fontSize:18,diagram:before.liquidCoolingDesign.diagram,parameters:[{_key:"ph",value:"復元値"}]});
    expect(result.blocks[1].content[0].children[0]._key).toBeTruthy();
    expect(before.title).toBe("以前のタイトル");
  });
  it("refuses a wrong document, duplicate keys, or removal of a current CMS block",()=>{
    expect(()=>buildFidelityPage({...page(),_id:"unrelated"},source(),{})).toThrow(/target/i);
    expect(()=>buildFidelityPage(page(),{...source(),blocks:[...source().blocks,source().blocks[0]]},{})).toThrow(/duplicate/i);
    expect(()=>buildFidelityPage(page(),{...source(),blocks:source().blocks.slice(0,2)},{})).toThrow(/missing/i);
  });
  it("accepts the matching draft and preserves its unrelated draft fields",()=>{
    const draft={...page(),_id:"drafts.page--liquid-cooling-cleanliness-testing",draftOnly:"保持"};
    expect(buildFidelityPage(draft,source(),{}).draftOnly).toBe("保持");
  });
  it("refuses removal of CMS-only text cards and preserves extra design entries and fields",()=>{
    const before=page();
    before.blocks[1].cards!.push({_key:"custom",title:"CMS-only"} as any);
    expect(()=>buildFidelityPage(before,source(),{})).toThrow(/card/i);
    const custom=page();
    custom.liquidCoolingDesign.parameters=[{_key:"ph",value:"old",custom:"keep"},{_key:"custom",value:"keep"}] as any;
    const result=buildFidelityPage(custom,source(),{parameters:[{_key:"ph",value:"new"}]});
    expect(result.liquidCoolingDesign.parameters).toEqual([{_key:"ph",value:"new",custom:"keep"},{_key:"custom",value:"keep"}]);
  });
  it("binds publication to the reviewed IDs, revisions and planned changes",()=>{
    const before=[page()]; const after=before.map(p=>buildFidelityPage(p,source(),{}));
    const hash=publicationFingerprint(before,after);
    expect(()=>requirePublicationFingerprint(hash,before,after)).not.toThrow();
    expect(()=>requirePublicationFingerprint(undefined,before,after)).toThrow(/fingerprint/i);
    expect(()=>requirePublicationFingerprint(hash,[{...before[0],_rev:"edited"}],after)).toThrow(/fingerprint/i);
    expect(()=>requirePublicationFingerprint(hash,[...before,{...before[0],_id:"drafts.page--liquid-cooling-cleanliness-testing"}],after)).toThrow(/fingerprint/i);
    expect(()=>requirePublicationFingerprint(hash,before,[{...after[0],title:"changed"}])).toThrow(/fingerprint/i);
  });
});
