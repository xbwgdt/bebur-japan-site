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
  homeHero: {
    eyebrow: string;
    title: string;
    summary: string;
    backgroundImage: { src: string; alt: string };
    primaryAction: { label: string; href: string };
    secondaryAction: { label: string; href: string };
    style: HomeHeroStyle;
  };
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

type HomeHeroStyle = {
  color: "brand" | "blue" | "red" | "neutral";
  fontSize: "sm" | "md" | "lg" | "xl";
  alignment: "left" | "center";
  spacing: "compact" | "normal" | "spacious";
  desktopTitleWrap: "wrap" | "nowrap";
};

const homeHeroPresetValues = {
  color: ["brand", "blue", "red", "neutral"],
  fontSize: ["sm", "md", "lg", "xl"],
  alignment: ["left", "center"],
  spacing: ["compact", "normal", "spacious"],
  desktopTitleWrap: ["wrap", "nowrap"],
} as const;

export const localPublicSiteSettings: PublicSiteSettings = {
  homeHero: {
    eyebrow: "WATER QUALITY & GAS DETECTION",
    title: "水質とガスを、より確かに。",
    summary:
      "Beburの精密計測技術で、水処理、製造、医薬、液冷設備の安全と品質管理を支えます。",
    backgroundImage: {
      src: "/source-media/1761791363673595-08e6a0255dfd817e.jpg",
      alt: "Beburの水質分析・ガス検知ソリューション",
    },
    primaryAction: { label: "製品情報を見る", href: "/products" },
    secondaryAction: { label: "お問い合わせ", href: "/contact" },
    style: {
      color: "brand",
      fontSize: "xl",
      alignment: "left",
      spacing: "normal",
      desktopTitleWrap: "nowrap",
    },
  },
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

function safeAction(
  action: { label?: unknown; href?: unknown } | undefined,
  fallback: { label: string; href: string },
): { label: string; href: string } {
  const label = safeText(action?.label, { max: 40 });
  const href = safeText(action?.href, { max: 2_048 });
  return label && href && /^(?:\/|https:\/\/|mailto:|tel:)/u.test(href)
    ? { label, href }
    : fallback;
}

function safePreset<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] {
  return typeof value === "string" && allowed.includes(value as T[number])
    ? (value as T[number])
    : fallback;
}

function resolveHomeHero(
  hero: SanitySiteSettings["homeHero"] | undefined,
): PublicSiteSettings["homeHero"] {
  const fallback = localPublicSiteSettings.homeHero;
  return {
    eyebrow: safeText(hero?.eyebrow, { max: 80 }) ?? fallback.eyebrow,
    title: safeText(hero?.title, { max: 80 }) ?? fallback.title,
    summary: safeText(hero?.summary, { max: 240 }) ?? fallback.summary,
    backgroundImage: safeImage(hero?.backgroundImage) ?? fallback.backgroundImage,
    primaryAction: safeAction(hero?.primaryAction, fallback.primaryAction),
    secondaryAction: safeAction(hero?.secondaryAction, fallback.secondaryAction),
    style: {
      color: safePreset(hero?.style?.color, homeHeroPresetValues.color, fallback.style.color),
      fontSize: safePreset(hero?.style?.fontSize, homeHeroPresetValues.fontSize, fallback.style.fontSize),
      alignment: safePreset(hero?.style?.alignment, homeHeroPresetValues.alignment, fallback.style.alignment),
      spacing: safePreset(hero?.style?.spacing, homeHeroPresetValues.spacing, fallback.style.spacing),
      desktopTitleWrap: safePreset(hero?.style?.desktopTitleWrap, homeHeroPresetValues.desktopTitleWrap, fallback.style.desktopTitleWrap),
    },
  };
}

export function resolveHomeHeroStyle(style: HomeHeroStyle): string {
  return [
    "source-home-hero",
    `source-home-hero--color-${style.color}`,
    `source-home-hero--font-${style.fontSize}`,
    `source-home-hero--align-${style.alignment}`,
    `source-home-hero--spacing-${style.spacing}`,
    `source-home-hero--title-${style.desktopTitleWrap}`,
  ].join(" ");
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
    homeHero: resolveHomeHero(settings.homeHero),
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
