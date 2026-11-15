import {describe,it,expect,vi} from "vitest";
// These schema constructors return their input; the validation under test remains real.
vi.mock("sanity",()=>({defineType:(value:unknown)=>value,defineField:(value:unknown)=>value,defineArrayMember:(value:unknown)=>value}));
import {pageBlocks} from "@/sanity/schemaTypes/blocks";
describe("optional overview card links",()=>{
  it("does not require link text for informational figures or history cards",()=>{
    const schema=pageBlocks.find(block=>block.name==="cardGrid") as any;
    const label=schema.fields.find((field:any)=>field.name==="cards").of[0].fields.find((field:any)=>field.name==="linkLabel");
    let required=false;
    const validators:Array<(value:unknown,context:unknown)=>unknown>=[];
    const rule={required:()=>{required=true;return rule;},custom:(fn:typeof validators[number])=>{validators.push(fn);return rule;},error:()=>rule};
    label.validation(rule);
    expect(required).toBe(false);
    expect(validators.every(fn=>fn(undefined,{parent:{}})===true)).toBe(true);
    expect(validators.some(fn=>fn(undefined,{parent:{href:"/about/history"}})!==true)).toBe(true);
  });
});
