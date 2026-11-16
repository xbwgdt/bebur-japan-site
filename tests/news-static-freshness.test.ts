import {afterEach,expect,it,vi} from "vitest";
const {fetchNews}=vi.hoisted(()=>({fetchNews:vi.fn(async(_query:string,_params?:Record<string,unknown>,options?:{cache:string})=>{
  if(options?.cache==="no-store")throw new Error("Static export cannot use revalidate: 0 fetch");
  return [];
})}));
vi.mock("@/lib/sanity/client",()=>({getSanityClient:()=>({fetch:fetchNews})}));
import {getNews,getNewsBySlug} from "@/lib/sanity/queries";
afterEach(()=>vi.restoreAllMocks());

it("uses one fresh build key and static-export-compatible caching for collection and detail reads",async()=>{
  await getNews();
  const [,firstParams,firstOptions]=fetchNews.mock.calls.at(-1)!;
  expect(firstOptions).toEqual({cache:"force-cache"});
  expect(firstParams?.newsBuildSnapshot).toEqual(expect.any(String));
  expect(String(firstParams?.newsBuildSnapshot).length).toBeGreaterThan(4);
  await getNews();
  expect(fetchNews.mock.calls.at(-1)![1]).toEqual(firstParams);
  await getNewsBySlug("ozone-monitoring-equipment");
  expect(fetchNews.mock.calls.at(-1)![1]).toEqual({...firstParams,slug:"ozone-monitoring-equipment"});
  expect(fetchNews.mock.calls.at(-1)![2]).toEqual(firstOptions);
});

it("changes the news query cache key for a later build of the same Git commit",async()=>{
  vi.spyOn(Date,"now").mockReturnValue(1794800000000);
  vi.resetModules();
  await (await import("@/lib/sanity/queries")).getNews();
  const first=fetchNews.mock.calls.at(-1)![1]?.newsBuildSnapshot;
  vi.mocked(Date.now).mockReturnValue(1794800060000);
  vi.resetModules();
  await (await import("@/lib/sanity/queries")).getNews();
  expect(fetchNews.mock.calls.at(-1)![1]?.newsBuildSnapshot).not.toBe(first);
});
