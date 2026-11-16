import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {load} from 'cheerio';
import {describe,it,expect} from 'vitest';
import ProductDetailPage from '../app/products/[category]/[slug]/page';
import {ArticleImageCaption} from '../components/source-faithful/article-image-caption';

describe('localized image rendering',()=>{
 for(const slug of ['at-2000','bs-phs276','bs-ec350','bs-turb113']){
  it(`keeps the entire ${slug} cover and Japan inquiry actions`,async()=>{
   const dom=load(renderToStaticMarkup(await ProductDetailPage({params:Promise.resolve({category:slug==='at-2000'?'gas-detection':'water-quality',slug})})));
   expect(decodeURIComponent(dom('.product-detail__media--diagram img').attr('src')??'')).toContain(`/media/localized-20261116/${slug}-ja.webp`);
   expect(dom('.product-detail__media--diagram a').attr('href')).toBe(`/media/localized-20261116/${slug}-ja.webp`);
   expect(dom('a[href="tel:080-5189-8663"]')).not.toHaveLength(0);
   expect(dom('a[href^="mailto:info@newtree-i.com"]')).not.toHaveLength(0);
  });
 }
 for(const slug of ['guangdong-guizhou-water-supply-conference-2025','global-data-center-liquid-cooling-conference-2025']){
  it(`lets mobile readers enlarge the currently editable ${slug} panel`,()=>{
   const current='https://cdn.sanity.io/images/gbzt89e5/production/replaced-in-editor.webp';
   const dom=load(renderToStaticMarkup(<ArticleImageCaption kind="news" slug={slug} image={{src:current,alt:'日文ポスター'}}/>));
   expect(dom('a').attr('href')).toBe(current);
   expect(dom('a').text()).toBe('拡大表示');
  });
 }
});
