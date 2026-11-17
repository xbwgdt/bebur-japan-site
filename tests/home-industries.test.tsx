// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import {existsSync,readFileSync} from "node:fs";
import HomePage from "@/app/page";
import { resolvePublicSiteSettings } from "@/lib/site-settings";
import {localHomeIndustries,resolveHomeIndustries,isHomeIndustryRoute} from "@/lib/home-industries";
import {HomeIndustryCarousel} from "@/components/home-industry-carousel";
import {getApplication} from "@/lib/content";
import {siteSettingsQuery} from "@/lib/sanity/queries";

let reduced=false, hidden=false;
beforeEach(()=>{
  vi.useFakeTimers();reduced=false;hidden=false;
  Object.defineProperty(document,"hidden",{configurable:true,get:()=>hidden});
  Object.defineProperty(window,"matchMedia",{configurable:true,value:vi.fn(()=>({matches:reduced,addEventListener:vi.fn(),removeEventListener:vi.fn()}))});
});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});
const advance=(milliseconds=6000)=>act(()=>vi.advanceTimersByTime(milliseconds));
const status=()=>screen.getByRole("status").textContent;
describe("manufacturer industry photo carousel", () => {
  it("matches all eight original image IDs and corresponding Japanese detail pages",()=>{
    const ids=["1762417708784412","1763108910519122","1762482758800188","1763109294688001","1763109461646071","1763110183129881","1763110422301491","1762483226236748"];
    const sourceIds=[171,177,178,176,175,174,173,172];
    localHomeIndustries.slides.forEach((slide,index)=>{
      expect(slide.image.src).toContain(ids[index]);expect(existsSync("public"+slide.image.src)).toBe(true);
      expect(slide.title).toMatch(/[ぁ-んァ-ヶ一-龯]/u);expect(slide.image.alt).toMatch(/[ぁ-んァ-ヶ一-龯]/u);
      expect(getApplication(slide.href.split("/").at(-1)!)?.sourceUrl).toContain(`/${sourceIds[index]}.html`);
      expect(isHomeIndustryRoute(slide.href)).toBe(true);
    });
  });
  it("honors CMS order, Japanese text, images and font without changing the original defaults",()=>{
    const settings=resolvePublicSiteSettings({homeIndustries:{title:"編集した産業別用途",autoPlay:false,intervalSeconds:12,fontFamily:"serif",fontSize:"lg",slides:[localHomeIndustries.slides[3],localHomeIndustries.slides[0]].map(slide=>({...slide,image:{alt:"編集した業界写真",asset:{url:"https://cdn.sanity.io/images/gbzt89e5/production/new-800x600.jpg"}}}))}});
    expect(settings.homeIndustries.slides.map(s=>s._key)).toEqual(["chemical","power"]);
    expect(settings.homeIndustries).toMatchObject({title:"編集した産業別用途",autoPlay:false,intervalSeconds:12,fontFamily:"serif",fontSize:"lg"});
    expect(settings.homeIndustries.slides[0].image.src).toContain("/new-800x600.jpg");
    expect(localHomeIndustries.slides).toHaveLength(8);
  });
  it("respects explicit disable/removal, deduplicates and rejects nonexistent or external links",()=>{
    expect(resolveHomeIndustries({enabled:false}).enabled).toBe(false);
    expect(resolveHomeIndustries({slides:[]}).slides).toEqual([]);
    const base=localHomeIndustries.slides[0];
    expect(resolveHomeIndustries({slides:[base,base,{...base,_key:"another"},{...base,_key:"external",href:"https://evil.test"},{...base,_key:"missing",href:"/applications/missing"}]}).slides).toHaveLength(1);
    expect(resolveHomeIndustries({slides:[null]}).slides).toHaveLength(8);
    for(const intervalSeconds of [0,21,NaN,Infinity,"5"])expect(resolveHomeIndustries({intervalSeconds}).intervalSeconds).toBe(6);
  });
  it.each(["//evil.test/x.jpg","javascript:alert(1)","https://evil.test/x.jpg","https://cdn.sanity.io:444/images/gbzt89e5/production/x.jpg","https://cdn.sanity.io/images/another/production/x.jpg"])("keeps photo and alt paired when a CMS image is rejected: %s",url=>{
    const base=localHomeIndustries.slides[0];
    const settings=resolveHomeIndustries({slides:[{...base,title:"<script>",image:{asset:{url},alt:"別の画像"}}]});
    expect(settings.slides[0].image).toEqual(base.image);expect(settings.slides[0].title).toBe(base.title);
  });
  it("projects editable assets and exposes an independent ordered gallery schema",()=>{
    expect(siteSettingsQuery).toContain("homeIndustries {");
    expect(siteSettingsQuery).toContain("slides[] { _key, title, href, image { alt, asset->{url} } }");
    const schema=readFileSync("sanity/schemaTypes/home-industries.ts","utf8");
    expect(schema).toContain('name:"slides"');expect(schema).toContain("hotspot:false");
  });
  it("preserves valid multiline CMS explanations as readable text",()=>{
    expect(resolveHomeIndustries({summary:"第一行の説明\n第二行の説明"}).summary).toBe("第一行の説明 第二行の説明");
  });
  it("provides eight Japanese industry photo entries independently from the hero carousel", () => {
    const settings = resolvePublicSiteSettings(undefined);
    expect(settings).toHaveProperty("homeIndustries.slides.length", 8);
    expect(settings).toHaveProperty("homeIndustries.intervalSeconds", 6);
    expect(settings.homeCarousel.slides).toHaveLength(6);
    expect(settings.phone).toBe("080-5189-8663");
  });
  it("replaces only the home industry diagram grid with eight original-photo links", async () => {
    const {container} = render(await HomePage());
    expect(container.querySelectorAll(".industry-carousel__card")).toHaveLength(8);
    expect(container.querySelectorAll(".source-home-applications .application-card")).toHaveLength(0);
    expect(container.querySelectorAll(".home-carousel__slide")).toHaveLength(6);
    expect(container.querySelector(".solution-promotion .flow")).not.toBeNull();
    expect(container.querySelectorAll(".category-card__media img")).toHaveLength(5);
  });
  it("renders eight unique linked photographs, readable captions and manual controls",()=>{
    const {container}=render(<HomeIndustryCarousel settings={localHomeIndustries}/>);
    expect(container.querySelectorAll(".industry-carousel__card")).toHaveLength(8);
    for(const slide of localHomeIndustries.slides)expect(screen.getByRole("link",{name:slide.title}).getAttribute("href")).toBe(slide.href);
    expect(status()).toBe("1–1 / 8");
    fireEvent.click(screen.getByRole("button",{name:"次の業界写真"}));expect(status()).toBe("2–2 / 8");
    fireEvent.click(screen.getByRole("button",{name:"前の業界写真"}));expect(status()).toBe("1–1 / 8");
    fireEvent.click(screen.getByRole("button",{name:"前の業界写真"}));expect(status()).toBe("8–8 / 8");
    fireEvent.click(screen.getByRole("button",{name:"次の業界写真"}));expect(status()).toBe("1–1 / 8");
  });
  it("supports arrow/home/end keyboard navigation and manual scrolling",()=>{
    const {container}=render(<HomeIndustryCarousel settings={localHomeIndustries}/>);
    const list=container.querySelector("ul")!;
    [...list.children].forEach((item,index)=>Object.defineProperty(item,"offsetLeft",{configurable:true,value:index*300}));
    fireEvent.keyDown(list,{key:"End"});expect(status()).toBe("8–8 / 8");
    fireEvent.keyDown(list,{key:"Home"});expect(status()).toBe("1–1 / 8");
    fireEvent.keyDown(list,{key:"ArrowRight"});expect(status()).toBe("2–2 / 8");
    fireEvent.pointerDown(list);fireEvent.scroll(list,{target:{scrollLeft:900}});expect(status()).toBe("4–4 / 8");
    advance(18000);expect(status()).toBe("4–4 / 8");
  });
  it("does not handle rail navigation keys from a focused industry link",()=>{
    render(<HomeIndustryCarousel settings={localHomeIndustries}/>);
    const link=screen.getByRole("link",{name:"電力・エネルギー"});
    fireEvent.keyDown(link,{key:"End"});expect(status()).toBe("1–1 / 8");
    fireEvent.keyDown(link,{key:"ArrowRight"});expect(status()).toBe("1–1 / 8");
  });
  it("pauses on hover/focus/background, resumes explicitly and cleans timers",()=>{
    const {container,unmount}=render(<HomeIndustryCarousel settings={localHomeIndustries}/>);
    advance();expect(status()).toBe("2–2 / 8");
    fireEvent.mouseEnter(container.firstChild!);advance(12000);expect(status()).toBe("2–2 / 8");
    fireEvent.mouseLeave(container.firstChild!);
    fireEvent.focus(screen.getByRole("link",{name:"電力・エネルギー"}));advance();expect(status()).toBe("2–2 / 8");
    fireEvent.blur(screen.getByRole("link",{name:"電力・エネルギー"}),{relatedTarget:document.body});advance();expect(status()).toBe("3–3 / 8");
    hidden=true;act(()=>document.dispatchEvent(new Event("visibilitychange")));advance();expect(status()).toBe("3–3 / 8");
    hidden=false;act(()=>document.dispatchEvent(new Event("visibilitychange")));
    fireEvent.click(screen.getByRole("button",{name:"業界写真の自動再生を停止"}));advance();expect(status()).toBe("3–3 / 8");
    fireEvent.click(screen.getByRole("button",{name:"業界写真の自動再生を開始"}));advance();expect(status()).toBe("4–4 / 8");
    unmount();expect(vi.getTimerCount()).toBe(0);
  });
  it("does not rotate for reduced-motion or disabled/empty settings",()=>{
    reduced=true;
    const {rerender,container}=render(<HomeIndustryCarousel settings={localHomeIndustries}/>);
    advance(18000);expect(status()).toBe("1–1 / 8");
    expect(screen.getByRole("button",{name:"業界写真の自動再生を停止"}).hasAttribute("disabled")).toBe(true);
    rerender(<HomeIndustryCarousel settings={{...localHomeIndustries,slides:[]}}/>);expect(container.innerHTML).toBe("");
    rerender(<HomeIndustryCarousel settings={{...localHomeIndustries,enabled:false}}/>);expect(container.innerHTML).toBe("");
  });
});
