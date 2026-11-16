import fs from 'node:fs';
import {describe,it,expect} from 'vitest';
import products from '../content/ja/products.json';
import sensors from '../content/ja/liquid-cooling-sensors.json';
import news from '../content/ja/insights.json';

describe('six approved Japanese image replacements',()=>{
 it('replaces only the four product covers and two conference panels in local fallback',()=>{
  for(const slug of ['at-2000','bs-phs276','bs-ec350','bs-turb113']){
   const record=[...products,...sensors].find(p=>p.slug===slug)!;
   expect(record.images[0].src).toBe(`/media/localized-20261116/${slug}-ja.webp`);
  }
  for(const slug of ['guangdong-guizhou-water-supply-conference-2025','global-data-center-liquid-cooling-conference-2025']){
   expect(news.find(n=>n.slug===slug)!.images[0].src).toMatch(/^\/media\/localized-20261116\//);
  }
 });
 it('commits all six nonempty images and preserves technical labels and event facts',()=>{
  const manifest=JSON.parse(fs.readFileSync('content/source/six-image-localization-20261116.json','utf8'));
  expect(manifest.assets).toHaveLength(6);
  for(const a of manifest.assets)expect(fs.statSync('public'+a.path).size).toBeGreaterThan(1000);
  expect(manifest.invariants.at2000).toEqual(['220V','4–20 mA']);
  expect(manifest.invariants.conference).toEqual(['2025','A3','11.06','11.08','貴陽市観山湖区 上善ホテル']);
 });
 it('uses full natural-height framing for the four corrected product covers',()=>{
  const page=fs.readFileSync('app/products/[category]/[slug]/page.tsx','utf8');
  expect(page).toContain('const isLocalizedFullImage = ["at-2000", "bs-phs276", "bs-ec350", "bs-turb113"].includes(product.slug)');
  expect(page).toContain('isControlDiagram || isLocalizedFullImage');
 });
});
