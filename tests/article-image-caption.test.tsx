import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {load} from "cheerio";
import {describe,expect,it} from "vitest";
import manifest from "../content/source/article-image-completion-20261116.json";
import {ArticleImageCaption} from "../components/source-faithful/article-image-caption";

describe("scoped article image enlargement",()=>{
  for(const page of manifest.pages){
    it(`offers the current editable image at full size for ${page.slug}`,()=>{
      const src="https://cdn.sanity.io/images/gbzt89e5/production/current-edit.webp";
      const dom=load(renderToStaticMarkup(<ArticleImageCaption kind={page.type} slug={page.slug} image={{src,alt:"日文の図注"}}/>));
      expect(dom("figcaption").text()).toContain("日文の図注");
      expect(dom("a").text()).toBe("拡大表示");
      expect(dom("a").attr("href")).toBe(src);
      expect(dom("a").attr("target")).toBe("_blank");
      expect(dom("a").attr("rel")).toContain("noopener");
      expect(dom("a").attr("aria-label")).toContain("新しいタブ");
    });
  }
  it("does not alter unrelated article captions",()=>{
    const dom=load(renderToStaticMarkup(<ArticleImageCaption kind="news" slug="yunnan-water-quality-exchange" image={{src:"/media/example.jpg",alt:"既存の図注"}}/>));
    expect(dom("figcaption").text()).toBe("既存の図注");
    expect(dom("a")).toHaveLength(0);
  });
});
