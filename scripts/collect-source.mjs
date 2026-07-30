import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import * as cheerio from "cheerio";

const SITEMAP_URL = "https://www.bebur.net/sitemap.xml";
const OUTPUT_PATH = path.join(
  process.cwd(),
  "content",
  "source",
  "source-manifest.json",
);
const EXPECTED_PAGE_COUNT = 112;
const USER_AGENT =
  "BeburJapanMigration/1.0 (+https://www.bebur-jp.com)";
const CONCURRENCY = 4;
const REQUEST_TIMEOUT_MS = 30_000;
const SOURCE_TITLE_FALLBACKS = new Map([
  ["/en/about_36", "About Us"],
  ["/en/list_38", "Applications And Cases"],
]);

const EXCLUDED_CONTENT_SELECTORS = [
  "script",
  "style",
  "noscript",
  "template",
  "header",
  "nav",
  "footer",
  ".sticky-nav",
  ".sp_header",
  ".ny-wban",
  ".in-banner",
  ".ny-banner",
  ".cp-nav",
  ".wap-cpanv",
  ".foot-ben",
  ".ycxf",
  ".ly-tc",
  ".ny-lx",
  ".ny-zxly",
  ".page",
  ".last-page",
  ".hidden",
  "[hidden]",
  '[aria-hidden="true"]',
  '[style*="display: none"]',
  '[style*="display:none"]',
].join(",");

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeXmlEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function normalizeSourceUrl(rawUrl) {
  const url = new URL(decodeXmlEntities(rawUrl));
  url.hash = "";

  if (url.protocol !== "https:" || !url.pathname.startsWith("/en/")) {
    return null;
  }

  if (url.searchParams.get("p") === "/Do/area") {
    return null;
  }

  url.pathname = url.pathname.replace(/\/{2,}/g, "/");
  if (url.pathname !== "/en/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.href;
}

function extractSitemapUrls(xml) {
  const urls = [...xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)]
    .map((match) => normalizeSourceUrl(normalizeWhitespace(match[1])))
    .filter(Boolean);

  return [...new Set(urls)].sort();
}

function isTransientError(error) {
  return (
    error?.name === "AbortError" ||
    error?.name === "TimeoutError" ||
    error instanceof TypeError
  );
}

async function fetchWithRetry(url) {
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": USER_AGENT },
        redirect: "follow",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status} ${response.statusText}`);
        error.transient = response.status === 408 || response.status === 429 ||
          response.status >= 500;
        throw error;
      }

      return response;
    } catch (error) {
      lastError = error;
      const retryable = error.transient || isTransientError(error);
      if (attempt === 2 || !retryable) {
        break;
      }
      console.warn(`Retrying ${url} after: ${error.message}`);
    }
  }

  throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? lastError}`);
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, items.length) },
      () => worker(),
    ),
  );
  return results;
}

function uniqueText(elements, $) {
  const seen = new Set();
  const values = [];

  elements.each((_, element) => {
    const text = normalizeWhitespace($(element).text());
    if (text && !seen.has(text)) {
      seen.add(text);
      values.push(text);
    }
  });

  return values;
}

function normalizeVisualUrl(src, pageUrl) {
  try {
    const url = new URL(src, pageUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    url.hash = "";
    if (url.protocol === "http:") {
      url.protocol = "https:";
    }
    return url.href;
  } catch {
    return null;
  }
}

function extractSrcsetUrls(value) {
  return value
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/, 1)[0])
    .filter(Boolean);
}

function extractCssUrls(value) {
  return [...value.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)]
    .map(([, , source]) => source.trim())
    .filter(Boolean);
}

function collectVisualReferences($, sourceUrl) {
  const references = new Map();
  const add = (rawUrl, kind) => {
    const src = normalizeVisualUrl(rawUrl, sourceUrl);
    if (!src) return;
    const reference = references.get(src) ?? { src, kinds: [] };
    if (!reference.kinds.includes(kind)) reference.kinds.push(kind);
    references.set(src, reference);
  };

  $("img[src], picture source[src], video[src]")
    .each((_, element) => add($(element).attr("src"), element.tagName));
  $("[srcset]").each((_, element) => {
    for (const src of extractSrcsetUrls($(element).attr("srcset") ?? "")) {
      add(src, `${element.tagName}:srcset`);
    }
  });
  $("[poster]").each((_, element) => add($(element).attr("poster"), "poster"));
  $("[data-src], [data-lazy-src], [data-original], [data-bg], [data-background]")
    .each((_, element) => {
      for (const attribute of [
        "data-src",
        "data-lazy-src",
        "data-original",
        "data-bg",
        "data-background",
      ]) {
        const value = $(element).attr(attribute);
        if (value) add(value, attribute);
      }
    });
  $("[style]").each((_, element) => {
    for (const src of extractCssUrls($(element).attr("style") ?? "")) add(src, "style");
  });
  $("style").each((_, element) => {
    for (const src of extractCssUrls($(element).text())) add(src, "stylesheet");
  });
  $("link[rel~='icon'][href], link[as='image'][href]")
    .each((_, element) => add($(element).attr("href"), "link"));
  $("meta[property='og:image'][content], meta[name='twitter:image'][content]")
    .each((_, element) => add($(element).attr("content"), "meta-image"));

  return [...references.values()]
    .map((reference) => ({ ...reference, kinds: reference.kinds.toSorted() }))
    .toSorted((left, right) => left.src.localeCompare(right.src));
}

function collectLayoutMarkers($) {
  const markers = new Map();
  const layoutSelector = [
    "header", "nav", "main", "footer", "section", "article", "aside", "[id]",
    "[class*='banner']", "[class*='product']", "[class*='about']",
    "[class*='news']", "[class*='case']", "[class*='contact']",
  ].join(",");

  $(layoutSelector).each((_, element) => {
    const id = $(element).attr("id") ?? "";
    const classes = ($(element).attr("class") ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .toSorted();
    const marker = `${element.tagName}${id ? `#${id}` : ""}${
      classes.length ? `.${classes.join(".")}` : ""
    }`;
    markers.set(marker, { tag: element.tagName, id, classes });
  });

  return [...markers.values()];
}

function parseTables($, root) {
  return root.find("table").map((_, table) => {
    const tableElement = $(table);
    let headers = tableElement
      .find("thead th")
      .map((__, cell) => normalizeWhitespace($(cell).text()))
      .get()
      .filter(Boolean);
    if (headers.length === 0) {
      headers = tableElement
        .find("tr")
        .first()
        .find("th")
        .map((__, cell) => normalizeWhitespace($(cell).text()))
        .get()
        .filter(Boolean);
    }

    const rows = tableElement
      .find("tbody tr, tr")
      .map((__, row) => {
        const cells = $(row)
          .find("td")
          .map((___, cell) => normalizeWhitespace($(cell).text()))
          .get();
        return cells.length > 0 ? cells : null;
      })
      .get();

    return { headers, rows };
  }).get();
}

function parsePage(html, sourceUrl) {
  const $ = cheerio.load(html);
  const body = $("body").clone();
  body.find(EXCLUDED_CONTENT_SELECTORS).remove();
  body.children(EXCLUDED_CONTENT_SELECTORS).remove();

  let title =
    normalizeWhitespace($("title").first().text()) ||
    normalizeWhitespace(body.find("h1").first().text());
  if (!title) {
    title = SOURCE_TITLE_FALLBACKS.get(new URL(sourceUrl).pathname) ?? "";
    if (title) {
      console.warn(`Using source-navigation title for ${sourceUrl}: ${title}`);
    }
  }
  const headings = uniqueText(body.find("h1, h2, h3"), $);
  const paragraphs = uniqueText(body.find("p, li"), $);
  const tables = parseTables($, body);
  const seenImages = new Set();
  const images = [];

  body.find("img[src]").each((_, image) => {
    const src = normalizeVisualUrl($(image).attr("src"), sourceUrl);
    if (!src || seenImages.has(src)) {
      return;
    }
    seenImages.add(src);
    images.push({
      src,
      alt: normalizeWhitespace($(image).attr("alt") ?? ""),
    });
  });

  return {
    sourceUrl,
    sourcePath: new URL(sourceUrl).pathname,
    title,
    headings,
    paragraphs,
    tables,
    images,
    layoutMarkers: collectLayoutMarkers($),
    visualReferences: collectVisualReferences($, sourceUrl),
  };
}

async function main() {
  console.log(`Fetching sitemap: ${SITEMAP_URL}`);
  const sitemapXml = await (await fetchWithRetry(SITEMAP_URL)).text();
  const urls = extractSitemapUrls(sitemapXml);

  if (urls.length !== EXPECTED_PAGE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_PAGE_COUNT} English content URLs, found ${urls.length}`,
    );
  }

  const failures = [];
  const pages = await mapWithConcurrency(urls, CONCURRENCY, async (url, index) => {
    try {
      const html = await (await fetchWithRetry(url)).text();
      const page = parsePage(html, url);
      if (!page.title) {
        throw new Error("document title is empty");
      }
      console.log(`[${index + 1}/${urls.length}] ${url}`);
      return page;
    } catch (error) {
      failures.push({ url, error: error.message });
      console.error(`[FAILED] ${url}: ${error.message}`);
      return null;
    }
  });

  if (failures.length > 0) {
    throw new Error(
      `${failures.length} required page fetch(es) failed:\n${failures
        .map(({ url, error }) => `- ${url}: ${error}`)
        .join("\n")}`,
    );
  }

  const manifest = pages
    .filter(Boolean)
    .sort((left, right) =>
      left.sourceUrl < right.sourceUrl
        ? -1
        : left.sourceUrl > right.sourceUrl
          ? 1
          : 0
    );

  if (manifest.length !== EXPECTED_PAGE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_PAGE_COUNT} parsed pages, found ${manifest.length}`,
    );
  }

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `Wrote ${manifest.length} pages with 0 failed fetches to ${OUTPUT_PATH}`,
  );
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
