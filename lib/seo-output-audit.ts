type SitemapEntry = {
  url?: string | URL;
};

type RobotsRule = {
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
};

type RobotsPolicy = {
  rules?: RobotsRule | RobotsRule[];
  sitemap?: string | string[];
  host?: string;
};

type DistributorConfig = {
  name?: string;
  origin?: string;
  company?: string;
  distributorLabel?: string;
  postalCode?: string;
  address?: string;
  phone?: string;
  email?: string;
};

type OrganizationJsonLd = {
  "@context"?: string;
  "@type"?: string;
  name?: string;
  alternateName?: string;
  description?: string;
  url?: string;
  email?: string;
  telephone?: string;
  address?: {
    "@type"?: string;
    postalCode?: string;
    addressRegion?: string;
    addressLocality?: string;
    streetAddress?: string;
    addressCountry?: string;
  };
};

export type SeoOutputAuditInput = {
  canonicalOrigin: string;
  canonicalRoutes: string[];
  sitemapEntries: SitemapEntry[];
  robotsPolicy: RobotsPolicy;
  siteConfig: DistributorConfig;
  organizationJsonLd: OrganizationJsonLd;
};

const approvedSite = {
  name: "Bebur Japan",
  origin: "https://www.bebur-jp.com",
  company: "新樹産業株式会社",
  distributorLabel: "Bebur 日本総代理店｜新樹産業株式会社",
  postalCode: "〒340-0043",
  address: "埼玉県草加市草加2－13－21－7",
  phone: "080-5189-8663",
  email: "info@newtree-i.com",
} as const;

const approvedOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: approvedSite.company,
  alternateName: "Bebur 日本総代理店",
  description: "Bebur 日本総代理店",
  url: approvedSite.origin,
  email: approvedSite.email,
  telephone: approvedSite.phone,
  address: {
    "@type": "PostalAddress",
    postalCode: "340-0043",
    addressRegion: "埼玉県",
    addressLocality: "草加市",
    streetAddress: "草加2－13－21－7",
    addressCountry: "JP",
  },
} as const;

function comparable(value: unknown): string {
  return JSON.stringify(value);
}

export function auditSeoOutputs(input: SeoOutputAuditInput): string[] {
  const errors: string[] = [];
  const expectedUrls = input.canonicalRoutes.map((route) =>
    new URL(route, `${approvedSite.origin}/`).toString(),
  );
  const sitemapUrls = input.sitemapEntries.map(({ url }) =>
    typeof url === "string" ? url : url?.toString() ?? "",
  );

  if (input.canonicalOrigin !== approvedSite.origin) {
    errors.push(
      `canonical origin: expected ${approvedSite.origin}, received ${input.canonicalOrigin}`,
    );
  }
  if (
    sitemapUrls.length !== expectedUrls.length ||
    comparable(sitemapUrls.toSorted()) !== comparable(expectedUrls.toSorted())
  ) {
    errors.push(
      `sitemap route coverage: expected ${expectedUrls.length} exact URLs, received ${sitemapUrls.length}`,
    );
  }
  if (new Set(sitemapUrls).size !== sitemapUrls.length) {
    errors.push("sitemap uniqueness: duplicate URLs detected");
  }
  if (
    sitemapUrls.some(
      (url) =>
        !url.startsWith(`${approvedSite.origin}/`) ||
        !URL.canParse(url),
    )
  ) {
    errors.push(`sitemap origin: every URL must use ${approvedSite.origin}`);
  }

  const robotRules = Array.isArray(input.robotsPolicy.rules)
    ? input.robotsPolicy.rules
    : [input.robotsPolicy.rules];
  if (
    comparable(robotRules) !==
    comparable([{ userAgent: "*", allow: "/" }])
  ) {
    errors.push(
      "robots rules: expected one public rule with userAgent * and allow /",
    );
  }
  if (
    input.robotsPolicy.sitemap !==
    `${approvedSite.origin}/sitemap.xml`
  ) {
    errors.push(
      `robots sitemap: expected ${approvedSite.origin}/sitemap.xml`,
    );
  }
  if (input.robotsPolicy.host !== approvedSite.origin) {
    errors.push(`robots host: expected ${approvedSite.origin}`);
  }

  for (const [key, expectedValue] of Object.entries(approvedSite)) {
    if (input.siteConfig[key as keyof DistributorConfig] !== expectedValue) {
      errors.push(`site config ${key}: expected approved distributor value`);
    }
  }

  const actualOrganization = {
    "@context": input.organizationJsonLd["@context"],
    "@type": input.organizationJsonLd["@type"],
    name: input.organizationJsonLd.name,
    alternateName: input.organizationJsonLd.alternateName,
    description: input.organizationJsonLd.description,
    url: input.organizationJsonLd.url,
    email: input.organizationJsonLd.email,
    telephone: input.organizationJsonLd.telephone,
    address: input.organizationJsonLd.address,
  };
  if (comparable(actualOrganization) !== comparable(approvedOrganization)) {
    errors.push(
      "organization JSON-LD: output does not match the approved Japan distributor identity",
    );
  }

  return errors;
}
