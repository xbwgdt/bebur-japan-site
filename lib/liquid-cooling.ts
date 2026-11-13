import solutionData from "@/content/ja/liquid-cooling-solution.json";
import designData from "@/content/ja/liquid-cooling-design.json";
import type { PageBlock } from "@/lib/page-blocks";
import type { SanityPage } from "@/lib/sanity/queries";
import { getPublishedPageForRoute } from "@/lib/cms-pages";

export const solutionRoute = "/solutions/liquid-cooling-cleanliness-testing";
export const solutionSlug = "liquid-cooling-cleanliness-testing";
export const localSolutionPage: SanityPage = {
  ...solutionData,
  slug: solutionData.slug.current,
  blocks: solutionData.blocks as PageBlock[],
  liquidCoolingDesign: designData,
};

export async function getLiquidCoolingSolution(): Promise<SanityPage> {
  return (await getPublishedPageForRoute(solutionSlug)) ?? structuredClone(localSolutionPage);
}

export function solutionSections(blocks: PageBlock[]) {
  const used = new Set<string>();
  return blocks.map((block, index) => {
    const requested = block.anchorId;
    let id = requested && /^[a-z][a-z0-9-]*$/u.test(requested) ? requested : `section-${index + 1}`;
    while (used.has(id)) id += "-next";
    used.add(id);
    return { block, id };
  });
}
