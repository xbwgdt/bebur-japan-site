import {expect,it,vi} from 'vitest';
const {fetchPage}=vi.hoisted(()=>({fetchPage:vi.fn(async(_query: string,_params: Record<string,unknown>,options?:{cache:string})=>{
  if(options?.cache==='no-store')throw new Error('Static export cannot use revalidate: 0 fetch');
  return {_id:'page--'+_params.slug,blocks:[{_type:'cardGrid',title:'企業紹介',cards:[{title:'公開本文'}]}]};
})}));
vi.mock('@/lib/sanity/client',()=>({getSanityClient:()=>({fetch:fetchPage})}));
import {getPublishedPageForRoute} from '@/lib/cms-pages';
import {getPageBySlug} from '@/lib/sanity/queries';

it.each(['overview','culture','history','dosing','chemical-industry','electric-power-industry','environmental-protection','municipal-water-treatment','liquid-cooling-industry','industry-solutions','plate-heat-exchanger-cleanliness','manifold-cleanliness','online-disinfectant-analyzer-waterworks'])('reads %s during a static export instead of silently taking the fallback',async(slug)=>{
  const page=await getPublishedPageForRoute(slug);
  expect(page?._id).toBe('page--'+slug);
  const [,params,options]=fetchPage.mock.calls.at(-1)!;
  expect(options?.cache).toBe('force-cache');
  expect(params.slug).toBe(slug);
  expect(typeof params.overviewBuildSnapshot).toBe('string');
  expect(String(params.overviewBuildSnapshot).length).toBeGreaterThan(4);
});

it('reuses one snapshot inside a build and does not change unrelated route policies',async()=>{
  await getPageBySlug('overview');
  const snapshot=fetchPage.mock.calls.at(-1)![1].overviewBuildSnapshot;
  await getPageBySlug('overview');
  expect(fetchPage.mock.calls.at(-1)![1].overviewBuildSnapshot).toBe(snapshot);
  await getPublishedPageForRoute('company-profile');
  expect(fetchPage.mock.calls.at(-1)![1]).toEqual({slug:'company-profile'});
  expect(fetchPage.mock.calls.at(-1)![2]).toEqual({cache:'no-store'});
});
