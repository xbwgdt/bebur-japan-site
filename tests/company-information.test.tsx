import {expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {load} from 'cheerio';
import about from '@/content/ja/about.json';
import AboutDetailPage from '@/app/about/[slug]/page';
import {getPublishedPageForRoute} from '@/lib/cms-pages';
vi.mock('@/lib/cms-pages',()=>({getPublishedPageForRoute:vi.fn(async()=>null)}));
const renderPage=async(slug:string)=>load(renderToStaticMarkup(await AboutDetailPage({params:Promise.resolve({slug})})));

it('uses the three verified culture photos instead of any certificate',async()=>{
 const $=await renderPage('culture');
 expect($('#company-culture article')).toHaveLength(3);
 const images=$('.company-overview__section img').map((_,e)=>$(e).attr('src')).get().join(' ');
 for(const id of ['1761881996364563','1761881868491509','1761881802241667'])expect(images).toContain(id);
 expect(images).not.toMatch(/17624078|1789974/);
 expect($('h1').text()).toBe('企業文化');
});
it('uses the complete history timeline and no certificate picture',async()=>{
 const $=await renderPage('history');
 expect($('#company-history article')).toHaveLength(5);
 for(const year of ['2002','2008','2017','2020','2024'])expect($('#company-history').text()).toContain(year);
 expect($('.company-overview__section img')).toHaveLength(0);
 expect($('h1').text()).toBe('沿革');
});
it.each(['culture','history'])('renders real CMS edits for %s and preserves Japan contacts',async(slug)=>{
 vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({_id:'page--'+slug,slug,title:'編集済み',seoTitle:'編集済み',seoDescription:'編集した企業情報です。',companyOverviewStyle:{primary:'#225588',fontFamily:'serif'},blocks:[{_type:'hero',title:'編集済み',summary:'公開した説明です。'},{_type:'cardGrid',anchorId:'edited',title:'編集した内容',cards:[{title:'公開した本文',summary:'公開した企業情報です。'}]},{_type:'cta',title:'日本のお問い合わせ',summary:'お問い合わせを承ります。',label:'メールでお問い合わせ'}]} as never);
 const $=await renderPage(slug);
 expect($('#edited').text()).toContain('公開した本文');
 expect($('.company-overview').attr('style')).toContain('--overview-primary:#225588');
 expect($('.company-overview').attr('data-font')).toBe('serif');
 expect($('a[href="tel:080-5189-8663"]').length).toBeGreaterThan(0);
 expect($('a[href^="mailto:info@newtree-i.com"]').length).toBeGreaterThan(0);
});
it.each(['culture','history'])('does not let a legacy hero-only %s record remove the corrected body',async(slug)=>{
 vi.mocked(getPublishedPageForRoute).mockResolvedValueOnce({_id:'page--'+slug,slug,title:'旧内容',blocks:[{_type:'hero',title:'旧内容'}]} as never);
 const $=await renderPage(slug);
 expect($('#company-'+(slug==='culture'?'culture':'history')+' article')).toHaveLength(slug==='culture'?3:5);
});
it('removes wrong legacy image assignments and expired certificate claims',()=>{
 for(const slug of ['culture','history'])expect(about.find(p=>p.slug===slug)!.images.map(i=>i.src).join()).not.toMatch(/1762407834497676|1762407869816422/);
 expect(JSON.stringify(about.find(p=>p.slug==='certifications'))).not.toContain('AS-525');
});
