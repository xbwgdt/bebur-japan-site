import { describe, expect, it } from "vitest";
import { resolveApplicationImages } from "../lib/application-images";

const local=[{slug:"liquid-cooling-industry",images:[{src:"/media/local.svg",alt:"液冷の構成例"}]}];
describe("published application image overrides",()=>{
  it("reads only the dedicated published image field, preserving local design and fallback",()=>{
    expect(resolveApplicationImages(local,[{slug:"liquid-cooling-industry",contextImages:[{asset:{url:"https://cdn.sanity.io/images/gbzt89e5/production/valid.svg"},alt:"液冷設備の構成例"}]}])[0].images[0].alt).toBe("液冷設備の構成例");
    expect(resolveApplicationImages(local,[{slug:"liquid-cooling-industry",blocks:[]}])[0]).toEqual(local[0]);
  });
  it("ignores unsafe assets and honors an explicitly empty image list",()=>{
    expect(resolveApplicationImages(local,[{slug:"liquid-cooling-industry",contextImages:[{asset:{url:"javascript:alert(1)"},alt:"危険"}]}])).toEqual(local);
    expect(resolveApplicationImages(local,[{slug:"liquid-cooling-industry",contextImages:[]}])[0].images).toEqual([]);
    expect(resolveApplicationImages(local,[{slug:"unrelated",contextImages:[]}])).toEqual(local);
  });
});
