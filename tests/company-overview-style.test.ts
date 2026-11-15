import {describe,it,expect} from "vitest";
import {overviewBlockStyle} from "@/lib/company-overview";
describe("overview module typography",()=>{
  it("distinguishes small type from the normal preset",()=>{
    expect(overviewBlockStyle({fontSize:"sm"})).not.toEqual(overviewBlockStyle({fontSize:"md"}));
  });
});
