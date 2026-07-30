import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { imageSize } from "image-size";

import { isAllowedFinalImageUrl } from "./asset-policy.mjs";

const MANIFEST_PATH = path.join(
  process.cwd(),
  "content",
  "source",
  "source-manifest.json",
);
const ASSET_MAP_PATH = path.join(
  process.cwd(),
  "content",
  "source",
  "asset-map.json",
);
const PAGE_FAMILY_MANIFEST_PATH = path.join(
  process.cwd(),
  "content",
  "source",
  "page-family-manifest.json",
);
const PUBLIC_PATH = path.join(process.cwd(), "public");
const ALLOWED_HOSTS = new Set(["bebur.net", "www.bebur.net"]);
const ALLOWED_EXTENSIONS = new Set([
  "avif", "gif", "ico", "jpeg", "jpg", "png", "svg", "webp",
]);
const EXCLUDED_IMAGE_PATTERN =
  /(?:wechat|weixin|weibo|douyin|tiktok|qr(?:code)?|qrcode|whatsapp|skype|contact|footer|sprite|tracker|tracking|pixel|lan\.gif|index_13\.jpg|index_14\.jpg)/i;
const USER_AGENT =
  "BeburJapanMigration/1.0 (+https://www.bebur-jp.com)";
const CONCURRENCY = 4;
const REQUEST_TIMEOUT_MS = 30_000;
const PAGE_FAMILY_DEFINITIONS = [
  { route: "/", family: "home", sourcePath: "/en/" },
  { route: "/products", family: "product-index", sourcePath: "/en/list_37" },
  {
    route: "/products/cleanliness/bt8500",
    family: "product-detail",
    sourcePath: "/en/list_46/254.html",
  },
  {
    route: "/applications",
    family: "application",
    sourcePath: "/en/list_38",
    assetSourcePaths: ["/en/list_52"],
  },
  { route: "/insights", family: "insight", sourcePath: "/en/list_39" },
  { route: "/about/company-profile", family: "about", sourcePath: "/en/about_41" },
  {
    route: "/contact",
    family: "contact",
    sourcePath: "/en/list_40",
    assetSourcePaths: ["/en/about_41"],
  },
];

function isFirstPartyHttpImage(sourceUrl) {
  try {
    const url = new URL(sourceUrl);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      ALLOWED_HOSTS.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
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

function collectVisualRecords(manifest) {
  const records = new Map();

  for (const page of manifest) {
    for (const reference of page.visualReferences ?? page.images ?? []) {
      const record = records.get(reference.src) ?? {
        sourceUrl: reference.src,
        sourcePaths: new Set(),
      };
      record.sourcePaths.add(page.sourcePath);
      records.set(reference.src, record);
    }
  }

  return [...records.values()]
    .map((record) => {
      const sourcePaths = [...record.sourcePaths].sort();
      return { ...record, sourcePaths };
    })
    .sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl));
}

function extensionFor(sourceUrl, contentType) {
  let extension = path.extname(new URL(sourceUrl).pathname).slice(1).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(extension)) {
    return extension;
  }

  const normalizedContentType = contentType
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  const extensionsByContentType = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
    ["image/avif", "avif"],
    ["image/svg+xml", "svg"],
    ["image/x-icon", "ico"],
  ]);
  extension = extensionsByContentType.get(normalizedContentType);
  return extension && ALLOWED_EXTENSIONS.has(extension) ? extension : null;
}

function sanitizedBasename(sourceUrl) {
  let basename;
  try {
    basename = decodeURIComponent(
      path.basename(new URL(sourceUrl).pathname, path.extname(
        new URL(sourceUrl).pathname,
      )),
    );
  } catch {
    basename = "asset";
  }

  return (
    basename
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "asset"
  );
}

function createPageFamilyManifest(sourceManifest, assetMap) {
  const pageBySourcePath = new Map(
    sourceManifest.map((page) => [page.sourcePath, page]),
  );

  return PAGE_FAMILY_DEFINITIONS.map(({
    route,
    family,
    sourcePath,
    assetSourcePaths = [],
  }) => {
    const page = pageBySourcePath.get(sourcePath);
    if (!page) throw new Error(`Missing source page for ${family}: ${sourcePath}`);
    const localAssets = [...new Set(
      [sourcePath, ...assetSourcePaths].flatMap((assetSourcePath) =>
        (pageBySourcePath.get(assetSourcePath)?.visualReferences ??
          pageBySourcePath.get(assetSourcePath)?.images ?? [])
          .map(({ src }) => assetMap[src])
          .filter(Boolean)
      ),
    )].sort();
    if (localAssets.length === 0) {
      throw new Error(`No downloaded visual assets for ${family}: ${page.sourceUrl}`);
    }
    return { route, family, sourceUrl: page.sourceUrl, localAssets };
  });
}

async function downloadCandidate(record, index, total) {
  try {
    const response = await fetchWithRetry(record.sourceUrl);
    if (!isAllowedFinalImageUrl(response.url)) {
      throw new Error(`disallowed final image URL: ${response.url}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const dimensions = imageSize(buffer);

    if (
      !dimensions.width ||
      !dimensions.height ||
      dimensions.width < 16 ||
      dimensions.height < 16
    ) {
      console.log(
        `[${index + 1}/${total}] rejected-small ${record.sourceUrl} ` +
          `(${dimensions.width ?? "?"}x${dimensions.height ?? "?"})`,
      );
      return { ...record, status: "rejected-small" };
    }

    const extension = extensionFor(
      record.sourceUrl,
      response.headers.get("content-type"),
    );
    if (!extension) {
      throw new Error(
        `unsupported image extension/content type: ${
          response.headers.get("content-type") ?? "unknown"
        }`,
      );
    }

    console.log(
      `[${index + 1}/${total}] downloaded ${record.sourceUrl} ` +
        `(${dimensions.width}x${dimensions.height})`,
    );
    return {
      ...record,
      status: "downloaded",
      buffer,
      extension,
      hash: createHash("sha256").update(buffer).digest("hex"),
    };
  } catch (error) {
    console.error(`[FAILED] ${record.sourceUrl}: ${error.message}`);
    return { ...record, status: "failed", error: error.message };
  }
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  const records = collectVisualRecords(manifest);
  const totals = {
    considered: records.length,
    downloaded: 0,
    deDuplicated: 0,
    rejectedSmall: 0,
    rejectedNonFirstParty: 0,
    rejectedExcluded: 0,
    failed: 0,
  };
  const candidates = [];

  for (const record of records) {
    if (!isFirstPartyHttpImage(record.sourceUrl)) {
      totals.rejectedNonFirstParty += 1;
      continue;
    }
    if (EXCLUDED_IMAGE_PATTERN.test(record.sourceUrl)) {
      totals.rejectedExcluded += 1;
      continue;
    }
    candidates.push(record);
  }

  const downloaded = await mapWithConcurrency(
    candidates,
    CONCURRENCY,
    (record, index) => downloadCandidate(record, index, candidates.length),
  );

  await mkdir(path.join(PUBLIC_PATH, "source-media"), { recursive: true });

  const assetMap = {};
  const localUrlByHash = new Map();
  for (const result of downloaded) {
    if (result.status === "rejected-small") {
      totals.rejectedSmall += 1;
      continue;
    }
    if (result.status === "failed") {
      totals.failed += 1;
      continue;
    }

    totals.downloaded += 1;
    let localUrl = localUrlByHash.get(result.hash);
    if (localUrl) {
      totals.deDuplicated += 1;
    } else {
      const filename =
        `${sanitizedBasename(result.sourceUrl)}-${result.hash.slice(0, 16)}.` +
        result.extension;
      localUrl = `/source-media/${filename}`;
      localUrlByHash.set(result.hash, localUrl);
      await writeFile(
        path.join(PUBLIC_PATH, localUrl.slice(1)),
        result.buffer,
      );
    }
    assetMap[result.sourceUrl] = localUrl;
  }

  const sortedAssetMap = Object.fromEntries(
    Object.entries(assetMap).sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0
    ),
  );
  await writeFile(
    ASSET_MAP_PATH,
    `${JSON.stringify(sortedAssetMap, null, 2)}\n`,
    "utf8",
  );
  const pageFamilyManifest = createPageFamilyManifest(manifest, sortedAssetMap);
  await writeFile(
    PAGE_FAMILY_MANIFEST_PATH,
    `${JSON.stringify(pageFamilyManifest, null, 2)}\n`,
    "utf8",
  );

  console.log("Asset acquisition totals:");
  console.log(`  considered: ${totals.considered}`);
  console.log(`  downloaded: ${totals.downloaded}`);
  console.log(`  de-duplicated: ${totals.deDuplicated}`);
  console.log(`  rejected-small: ${totals.rejectedSmall}`);
  console.log(
    `  rejected-nonfirst-party: ${totals.rejectedNonFirstParty}`,
  );
  console.log(`  rejected-excluded: ${totals.rejectedExcluded}`);
  console.log(`  failed: ${totals.failed}`);
  console.log(`  local files: ${localUrlByHash.size}`);
  console.log(`  mapped source URLs: ${Object.keys(sortedAssetMap).length}`);
  console.log(`  page families: ${pageFamilyManifest.length}`);

}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
