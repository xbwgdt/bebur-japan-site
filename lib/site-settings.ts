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

export type ContactPanelStyle = {
  color: "light" | "deepBlue" | "paleBlue";
  fontSize: "sm" | "md" | "lg" | "xl";
  fontFamily: "sans" | "serif" | "mono";
};

export type PublicContactPageSettings = {
  panel: {
    label: string;
    description: string;
    phoneActionLabel: string;
    emailActionLabel: string;
    style: ContactPanelStyle;
  };
  guide: {
    eyebrow: string;
    title: string;
    steps: string[];
    linkLabel: string;
    style: ContactPanelStyle;
  };
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
  contactPage: PublicContactPageSettings;
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

const contactPanelPresetValues = {
  color: ["light", "deepBlue", "paleBlue"],
  fontSize: ["sm", "md", "lg", "xl"],
  fontFamily: ["sans", "serif", "mono"],
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
  contactPage: {
    panel: {
      label: "Bebur 日本総代理店",
      description:
        "新樹産業株式会社が、日本国内の製品選定、用途確認、お見積もり、アフターサービスに関するご相談を承ります。",
      phoneActionLabel: "電話で相談",
      emailActionLabel: "メールでお問い合わせ",
      style: {
        color: "light",
        fontSize: "md",
        fontFamily: "sans",
      },
    },
    guide: {
      eyebrow: "INQUIRY GUIDE",
      title: "お問い合わせの流れ",
      steps: [
        "製品・用途を確認",
        "電話またはメールで相談",
        "仕様・見積もりをご案内",
      ],
      linkLabel: "メールで問い合わせ",
      style: {
        color: "deepBlue",
        fontSize: "md",
        fontFamily: "sans",
      },
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

function resolveContactPanelStyleSettings(
  style:
    | { color?: string; fontSize?: string; fontFamily?: string }
    | undefined,
  fallback: ContactPanelStyle,
): ContactPanelStyle {
  return {
    color: safePreset(
      style?.color,
      contactPanelPresetValues.color,
      fallback.color,
    ),
    fontSize: safePreset(
      style?.fontSize,
      contactPanelPresetValues.fontSize,
      fallback.fontSize,
    ),
    fontFamily: safePreset(
      style?.fontFamily,
      contactPanelPresetValues.fontFamily,
      fallback.fontFamily,
    ),
  };
}

function safeGuideSteps(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length < 1 || value.length > 6) {
    return undefined;
  }

  const steps = value.map((step) => safeText(step, { max: 120 }));
  return steps.every((step) => step !== undefined)
    ? (steps as string[])
    : undefined;
}

function resolveContactPage(
  contactPage: SanitySiteSettings["contactPage"],
): PublicContactPageSettings {
  const fallback = localPublicSiteSettings.contactPage;

  return {
    panel: {
      label: safeText(contactPage?.panel?.label, { max: 80 }) ?? fallback.panel.label,
      description:
        safeText(contactPage?.panel?.description, { max: 240 }) ??
        fallback.panel.description,
      phoneActionLabel:
        safeText(contactPage?.panel?.phoneActionLabel, { max: 40 }) ??
        fallback.panel.phoneActionLabel,
      emailActionLabel:
        safeText(contactPage?.panel?.emailActionLabel, { max: 40 }) ??
        fallback.panel.emailActionLabel,
      style: resolveContactPanelStyleSettings(
        contactPage?.panel?.style,
        fallback.panel.style,
      ),
    },
    guide: {
      eyebrow:
        safeText(contactPage?.guide?.eyebrow, { max: 40 }) ??
        fallback.guide.eyebrow,
      title:
        safeText(contactPage?.guide?.title, { max: 80 }) ?? fallback.guide.title,
      steps: safeGuideSteps(contactPage?.guide?.steps) ?? fallback.guide.steps,
      linkLabel:
        safeText(contactPage?.guide?.linkLabel, { max: 40 }) ??
        fallback.guide.linkLabel,
      style: resolveContactPanelStyleSettings(
        contactPage?.guide?.style,
        fallback.guide.style,
      ),
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

export function resolveContactPanelStyle(style: ContactPanelStyle): string {
  const colorClass = {
    light: "contact-card--color-light",
    deepBlue: "contact-card--color-deep-blue",
    paleBlue: "contact-card--color-pale-blue",
  } as const;
  const sizeClass = {
    sm: "contact-card--size-sm",
    md: "contact-card--size-md",
    lg: "contact-card--size-lg",
    xl: "contact-card--size-xl",
  } as const;
  const fontClass = {
    sans: "contact-card--font-sans",
    serif: "contact-card--font-serif",
    mono: "contact-card--font-mono",
  } as const;

  return ["contact-card", colorClass[style.color], sizeClass[style.fontSize], fontClass[style.fontFamily]].join(
    " ",
  );
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
    contactPage: resolveContactPage(settings.contactPage),
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
