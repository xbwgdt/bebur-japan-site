import fs from "node:fs/promises";
import path from "node:path";

const out="public/media";
await fs.mkdir(path.join(out,"industry"),{recursive:true});
await fs.mkdir(path.join(out,"dosing"),{recursive:true});
const esc=value=>value.replace(/[&<>\"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
function text(lines,x,y,size=36,weight=600,color="#123b63"){
  return `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="${weight}" fill="${color}">${lines.map((line,index)=>`<tspan x="${x}" dy="${index?size*1.35:0}">${esc(line)}</tspan>`).join("")}</text>`;
}
function svg(title,steps,note="用途に応じた計測・取水の構成例"){
  const count=steps.length,height=Math.max(860,230+count*180);
  const nodes=steps.map((step,index)=>{
    const y=190+index*180;
    return `${index?`<path d="M450 ${y-50}v36" stroke="#086d87" stroke-width="7" marker-end="url(#arrow)"/>`:""}<rect x="65" y="${y}" width="770" height="130" rx="18" fill="${index%2?"#e7f2fb":"#fff"}" stroke="#b8d1e8" stroke-width="2"/><circle cx="110" cy="${y+65}" r="24" fill="#2458a0"/>${text([String(index+1)],110,y+77,30,700,"#fff")}${text(Array.isArray(step)?step:[step],470,y+(Array.isArray(step)&&step.length>1?48:78),34)}`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 ${height}" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}の構成例</title><desc id="desc">${esc(note)}。${steps.flat().map(esc).join("、")}</desc><defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9" fill="#086d87"/></marker></defs><rect width="900" height="${height}" rx="24" fill="#f1f7fc"/><path d="M0 0h900v14H0" fill="#2458a0"/><g font-family="Noto Sans JP,Yu Gothic,Meiryo,sans-serif">${text([title],450,80,36,700)}${text(["計測・監視の構成例"],450,133,30,500,"#086d87")}${nodes}${text(["構成例｜実際の設置は対象工程・仕様に応じて選定"],450,height-35,25,400)}</g></svg>`;
}
// Each edge is the actual process/sample/signal relationship, not an implied
// sequence through all instruments. Signal returns are visibly dashed loops.
function controlSvg(title,nodes,edges){
  const height=260+nodes.length*190;
  const positions=new Map(nodes.map(([id],index)=>[id,190+index*190]));
  const paths=edges.map(([from,to,relation,lane])=>{
    const start=positions.get(from),end=positions.get(to);
    const signal=['feedback','feedforward','reference','flow-input','dosing-control'].includes(relation);
    const color=signal?'#2458a0':'#086d87';
    const port=relation==='dosing-control'?100:65;
    const d=lane?`M${lane<360?110:610} ${start+port}H${lane}V${end+port}H${lane<360?100:620}`:`M360 ${start+130}V${end-15}`;
    return `<path data-from="${from}" data-to="${to}" data-relation="${relation}" d="${d}" fill="none" stroke="${color}" stroke-width="5"${signal?' stroke-dasharray="12 8"':''} marker-end="url(#${signal?'signal':'water'})"><title>${esc(nodes.find(row=>row[0]===from)[1].join('・'))} → ${esc(nodes.find(row=>row[0]===to)[1].join('・'))}（${esc(relation)}）</title></path>`;
  }).join('');
  const boxes=nodes.map(([id,lines],index)=>`<g data-node="${id}"><rect x="110" y="${positions.get(id)}" width="500" height="130" rx="16" fill="${index%2?'#e7f2fb':'#fff'}" stroke="#b8d1e8" stroke-width="2"/>${text(lines,360,positions.get(id)+49,32)}</g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 ${height}" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}の構成例</title><desc id="desc">${nodes.map(row=>row[1].map(esc).join('、')).join('。')}。実線は工程・採水、破線は計測信号・制御の関係を示す構成例。</desc><defs>${[['water','#086d87'],['signal','#2458a0']].map(([id,color])=>`<marker id="${id}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="${color}"/></marker>`).join('')}</defs><rect width="720" height="${height}" rx="24" fill="#f1f7fc"/><g font-family="Noto Sans JP,Yu Gothic,Meiryo,sans-serif">${text([title],360,65,32,700)}${text(['構成例｜実線：工程・採水','破線：計測信号・制御'],360,116,28,500,'#086d87')}${paths}${boxes}${text(['対象工程・仕様に応じて設置を選定'],360,height-30,28,400)}</g></svg>`;
}
const diagrams={
 "industry-solutions":["産業別ソリューション",[["水質・粒子","上水／液冷／医療・製薬"],["ガス・プロセス監視","化学／環境／食品"],["流体・水処理の品質管理","電力／油圧"]]],
 "liquid-cooling-industry":["液冷システムの監視",[["CDU・コールドプレート","冷却液の供給・戻り"],["粒子計数／pH・導電率・濁度","測定対象に合わせて計器を選定"],["供給・戻りの変化を確認","水質と粒子を組み合わせて監視"]]],
 "municipal-water-treatment":["上水処理の水質監視",[["原水・浄水処理工程","工程ごとの状態を確認"],["水質・粒子・消毒剤を監視","用途に応じたオンライン分析"],["水処理状態を把握","薬注・消毒工程の管理を支援"]]],
 "electric-power-industry":["発電所の水処理監視",[["発電所の用水・水処理","取水・処理工程"],["水質・粒子・流動電流","測定対象に合わせて選定"],["水処理と薬注工程","状態変化を確認"]]],
 "medical-pharmaceutical":["医療・製薬の水質管理",[["製薬用水・洗浄工程","用途と試料を確認"],["水質・不溶性微粒子","測定方法に適した計器を選定"],["工程に応じた品質管理","適用条件に基づいて評価"]]],
 "chemical-industry":["化学プロセスの監視",[["化学プラント・用水設備","監視対象と設置場所を確認"],["水質分析・ガス監視","対象成分に応じた計器構成"],["工程状態の把握","測定値と警報を確認"]]],
 "environmental-protection":["水質・悪臭ガスの監視",[["排水・排出源","監視対象を確認"],["水質分析・悪臭ガス測定","対象に合わせた設置構成"],["状態変化を継続確認","現場の監視・管理を支援"]]],
 "food-industry":["食品・飲料の水質管理",[["食品・飲料の製造用水","洗浄・消毒工程"],["残留塩素・オゾンなどの監視","測定対象に合う水質計を選定"],["工程に応じた品質管理","水質の変化を確認"]]],
 "hydraulic-industry":["油圧分野の清浄度管理",[["油圧系・作動流体","試料と測定条件を確認"],["粒子個数・粒径別分布","用途に適した測定構成"],["流体清浄度の変化を確認","汚染状態を把握"]]],
 "plate-heat-exchanger-cleanliness":["熱交換器の清浄度管理",[["洗浄・循環ライン","対象の熱交換器"],["出口側で取水・粒子測定","安定した流量で測定"],["洗浄状態・運転中の変化","水質と粒子を確認"]]],
 "scm530-power-plant-dosing":["SCM530による薬注管理",[["凝集剤注入・混合"],["処理後水を採水"],["SCM530で流動電流を測定"],["凝集剤の薬注制御"]]],
};
const scmNodes=[['mix',['凝集剤注入・混合','注入量を調整']],['sample',['処理後水を採水','凝集剤添加後の試料水']],['scm',['SCM530','流動電流を連続測定']],['control',['凝集剤の薬注制御','測定値をフィードバック']]];
for(const [slug,[title,steps]] of Object.entries(diagrams))await fs.writeFile(path.join(out,"industry",slug+".svg"),slug==='scm530-power-plant-dosing'?controlSvg(title,scmNodes,[['mix','sample','treated-water'],['sample','scm','sample'],['scm','control','feedback'],['control','mix','dosing-control',665]]):svg(title,steps));
const dosing={
 "bt-9000c":["BT-9000C 塩素消毒薬注制御",[
   ['flow',['流量測定','薬注制御への流量入力']],['inlet',['入口で消毒剤を注入','消毒池への流入水']],['pool',['消毒池','消毒処理']],['outlet',['消毒池の出口で採水','出口側の残留塩素を確認']],['residual',['残留塩素を測定','測定値をフィードバック']],['control',['塩素消毒の薬注制御','流量と残留塩素で注入量調整']],
 ],[['flow','inlet','process'],['inlet','pool','process'],['pool','outlet','process'],['outlet','residual','sample'],['residual','control','feedback'],['flow','control','flow-input',45],['control','inlet','dosing-control',675]]],
 "bt-9000l":["BT-9000L 凝集薬注制御",[
   ['raw',['原水の濁度・有機物','前段のフィードフォワード']],['mix',['凝集剤注入・混合','原水のpHを調整']],['settled',['沈殿後の濁度','凝集・沈殿後、ろ過前の参考値']],['streaming',['凝集後の流動電流','測定値をフィードバック']],['control',['凝集薬注制御','前段・後段の情報で注入量調整']],
 ],[['raw','mix','process'],['mix','settled','coagulation-sedimentation'],['mix','streaming','sample',645],['raw','control','feedforward',25],['streaming','control','feedback'],['settled','control','reference',690],['control','mix','dosing-control',65]]],
 "bt-9000s":["BT-9000S 薬注制御",[
   ['mix',['凝集剤注入・管内ミキサー','原水と凝集剤を混合']],['sample',['混合後に採水','ミキサーより下流の取水口']],['streaming',['ストリーミング電流','混合後の試料水を測定']],['control',['凝集剤の薬注制御','測定値をフィードバック']],
 ],[['mix','sample','post-mixer-sample'],['sample','streaming','sample'],['streaming','control','feedback'],['control','mix','dosing-control',665]]],
};
for(const [slug,[title,nodes,edges]] of Object.entries(dosing))await fs.writeFile(path.join(out,"dosing",slug+".svg"),controlSvg(title,nodes,edges));

const read=async name=>JSON.parse(await fs.readFile(`content/ja/${name}.json`,"utf8"));
const previousReport=await fs.readFile("content/source/image-remediation-20261116.json","utf8").then(JSON.parse).catch(()=>({provenance:[]}));
const provenance=previousReport.provenance;
const remember=entry=>{if(!provenance.some(row=>row.route===entry.route))provenance.push(entry);};
const applications=await read("applications");
for(const record of applications){
  if(Object.hasOwn(diagrams,record.slug)&&!record.slug.includes("plate-heat")&&!record.slug.includes("scm530-")){
    remember({route:record.route,sourceUrl:record.sourceUrl,previous:record.images,method:"Japanese native measurement configuration, not an installation photograph"});
    record.images=[{src:`/media/industry/${record.slug}.svg`,alt:`${diagrams[record.slug][0]}の構成例`}];
  }
}
const cases={"bt8200-liquid-cooling":"liquid-cooling-industry","liquid-particle-counter-pharmaceutical":"medical-pharmaceutical","medical-pharmaceutical-cases":"medical-pharmaceutical","plate-heat-exchanger-cleanliness":"plate-heat-exchanger-cleanliness","scm530-power-plant-dosing":"scm530-power-plant-dosing"};
for(const record of applications)if(Object.hasOwn(cases,record.slug)){
  remember({route:record.route,sourceUrl:record.sourceUrl,previous:record.images,method:"Preserve authentic product photo; add explicitly labeled configuration"});
  const first=record.images[0];
  if(first&&record.slug==="plate-heat-exchanger-cleanliness")first.alt="熱交換器の参考画像";
  else if(first&&!first.alt.endsWith("（製品写真）"))first.alt+="（製品写真）";
  const slug=cases[record.slug],src=`/media/industry/${slug}.svg`;
  if(!record.images.some(image=>image.src===src))record.images.push({src,alt:`${diagrams[slug][0]}の構成例`});
}
const products=await read("products");
for(const record of products)if(Object.hasOwn(dosing,record.slug)){
  remember({route:record.route,sourceUrl:record.sourceUrl,previous:record.images,method:"Japanese native schematic based on original process labels; no new specifications"});
  record.images=[{src:`/media/dosing/${record.slug}.svg`,alt:`${dosing[record.slug][0]}の構成例`}];
}
const insights=await read("insights");
for(const record of insights){
  if(record.slug==="particle-charge-analyzer-papermaking")record.images=record.images.filter(image=>image.alt.includes("粒子電荷分析計"));
  if(record.slug==="residual-chlorine-detector-brands-2026-april")record.images=record.images.filter(image=>!image.alt.includes("イメージ図"));
  if(record.slug==="toc-analyzer-brands-2026")record.images[0].alt="UVSense：UV吸収方式の光学式水質センサー。TOCはUV吸収との相関に基づく推定であり、燃焼酸化法・湿式酸化法による直接測定とは異なります。";
}
for(const [name,records] of Object.entries({applications,products,insights}))await fs.writeFile(`content/ja/${name}.json`,JSON.stringify(records,null,2)+"\n");
await fs.mkdir("content/source",{recursive:true});
await fs.writeFile("content/source/image-remediation-20261116.json",JSON.stringify({date:"2026-11-16",provenance},null,2)+"\n");
console.log(JSON.stringify({industryDiagrams:Object.keys(diagrams).length,dosingDiagrams:Object.keys(dosing).length,applicationTargets:Object.keys(diagrams).length+3,products:Object.keys(dosing).length,articles:3}));
