import { localPublicSiteSettings } from "@/lib/site-settings";

const brandSuffixPattern = /(?:｜Bebur Japan)+$/u;

export function normalizePageTitle(title: string): string {
  return title.trim().replace(brandSuffixPattern, "");
}

export function socialTitle(title: string): string {
  return `${normalizePageTitle(title)}｜Bebur Japan`;
}

export function defaultSocialImage(): { url: string; alt: string } {
  return {
    url: localPublicSiteSettings.defaultOgImage.src,
    alt: localPublicSiteSettings.defaultOgImage.alt,
  };
}
