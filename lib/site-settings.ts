import {
  approvedContact,
  siteConfig,
} from "./constants";
import {
  getSiteSettings,
  type SanitySiteSettings,
} from "./sanity/queries";

export type PublicNavigationLabels = {
  home: string;
  products: string;
  applications: string;
  company: string;
  news: string;
  contact: string;
};

export type PublicSiteSettings = {
  navigationLabels: PublicNavigationLabels;
  distributorName: string;
  companyName: string;
  postalCode: string;
  address: string;
  phone: string;
  inquiryEmail: string;
  footerText: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultOgImage: {
    src: string;
    alt: string;
  };
};

export const localPublicSiteSettings: PublicSiteSettings = {
  navigationLabels: {
    home: "ホーム",
    products: "製品情報",
    applications: "導入分野・事例",
    company: "企業情報",
    news: "ニュース・技術情報",
    contact: "お問い合わせ",
  },
  ...approvedContact,
  footerText: siteConfig.distributorLabel,
  defaultSeoTitle: "Bebur Japan｜水質分析・ガス検知の精密計測",
  defaultSeoDescription:
    "Bebur 日本総代理店の新樹産業株式会社が、水質分析計、ガス検知器、清浄度測定装置、薬注制御装置をご案内します。",
  defaultOgImage: {
    src: "/opengraph-image",
    alt: "Bebur Japan｜水質分析・ガス検知の精密ソリューション",
  },
};

function safeText(
  value: unknown,
  { min = 1, max }: { min?: number; max: number },
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.trim();
  if (
    text.length < min ||
    text.length > max ||
    /[\u0000-\u001f\u007f<>]/u.test(text)
  ) {
    return undefined;
  }

  return text;
}

function exactApproved<K extends keyof typeof approvedContact>(
  field: K,
  value: unknown,
): (typeof approvedContact)[K] {
  return value === approvedContact[field]
    ? (value as (typeof approvedContact)[K])
    : approvedContact[field];
}

function safeImage(
  image: SanitySiteSettings["defaultOgImage"],
): PublicSiteSettings["defaultOgImage"] | undefined {
  const src = safeText(image?.asset?.url, { max: 2_048 });
  const alt = safeText(image?.alt, { max: 160 });
  if (!src || !alt) {
    return undefined;
  }

  if (src.startsWith("/") && !src.startsWith("//")) {
    return { src, alt };
  }

  try {
    const url = new URL(src);
    if (url.protocol === "https:" && url.hostname === "cdn.sanity.io") {
      return { src: url.toString(), alt };
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function resolvePublicSiteSettings(
  settings: SanitySiteSettings | null | undefined,
): PublicSiteSettings {
  if (!settings) {
    return localPublicSiteSettings;
  }

  const navigationLabels = Object.fromEntries(
    Object.entries(localPublicSiteSettings.navigationLabels).map(
      ([key, fallback]) => [
        key,
        safeText(settings.navigationLabels?.[key], { max: 40 }) ??
          fallback,
      ],
    ),
  ) as PublicNavigationLabels;

  return {
    navigationLabels,
    distributorName: exactApproved(
      "distributorName",
      settings.distributorName,
    ),
    companyName: exactApproved("companyName", settings.companyName),
    postalCode: exactApproved("postalCode", settings.postalCode),
    address: exactApproved("address", settings.address),
    phone: exactApproved("phone", settings.phone),
    inquiryEmail: exactApproved("inquiryEmail", settings.inquiryEmail),
    footerText:
      safeText(settings.footerText, { max: 120 }) ??
      localPublicSiteSettings.footerText,
    defaultSeoTitle:
      safeText(settings.defaultSeoTitle, { min: 10, max: 60 }) ??
      localPublicSiteSettings.defaultSeoTitle,
    defaultSeoDescription:
      safeText(settings.defaultSeoDescription, { min: 50, max: 160 }) ??
      localPublicSiteSettings.defaultSeoDescription,
    defaultOgImage:
      safeImage(settings.defaultOgImage) ??
      localPublicSiteSettings.defaultOgImage,
  };
}

export async function loadPublicSiteSettings(
  readSettings: () => Promise<SanitySiteSettings | null> = getSiteSettings,
): Promise<PublicSiteSettings> {
  try {
    return resolvePublicSiteSettings(await readSettings());
  } catch {
    return localPublicSiteSettings;
  }
}

export const publicSiteSettings = await loadPublicSiteSettings();
