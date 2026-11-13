import type { Metadata } from "next";
import { LiquidCoolingEditorialPage } from "@/components/liquid-cooling/editorial-page";
import { getLiquidCoolingSolution, solutionRoute } from "@/lib/liquid-cooling";
import { normalizePageTitle, socialTitle } from "@/lib/metadata";
import { canonicalUrl } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLiquidCoolingSolution();
  const image = page.blocks.find((block) => block._type === "hero")?.image;
  return {
    title: normalizePageTitle(page.seoTitle || page.title),
    description: page.seoDescription,
    alternates: { canonical: canonicalUrl(solutionRoute) },
    openGraph: { title: socialTitle(page.seoTitle || page.title), description: page.seoDescription, url: canonicalUrl(solutionRoute), locale: "ja_JP", images: image?.asset?.url ? [{ url: image.asset.url, alt: image.alt }] : undefined },
  };
}

export default async function LiquidCoolingSolutionPage() {
  const page = await getLiquidCoolingSolution();
  return <LiquidCoolingEditorialPage page={page}/>;
}
