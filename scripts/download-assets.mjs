import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { imageSize } from "image-size";

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
const PUBLIC_PATH = path.join(process.cwd(), "public");
const ALLOWED_HOSTS = new Set(["bebur.net", "www.bebur.net"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const PRODUCT_PATH_PATTERN = /^\/en\/list_(?:37(?:_2)?|4[5-9]|50)(?:\/|$)/;
const PRODUCT_DETAIL_PATH_PATTERN =
  /^\/en\/list_(?:4[6-9]|50)\/\d+\.html$/;
const APPLICATION_PATH_PATTERN =
  /^\/en\/list_(?:38|5[2-9]|60|61)(?:\/|$)/;
const EXCLUDED_IMAGE_PATTERN =
  /(?:wechat|weixin|weibo|douyin|tiktok|qr(?:code)?|qrcode|whatsapp|skype|contact|footer|sprite|tracker|tracking|pixel|lan\.gif|index_13\.jpg|index_14\.jpg)/i;
const USER_AGENT =
  "BeburJapanMigration/1.0 (+https://www.bebur-jp.com)";
const CONCURRENCY = 4;
const REQUEST_TIMEOUT_MS = 30_000;

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

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

function collectImageRecords(manifest) {
  const records = new Map();

  for (const page of manifest) {
    const primaryImage = PRODUCT_DETAIL_PATH_PATTERN.test(page.sourcePath)
      ? page.images.find(
        ({ src, alt }) =>
          normalizeWhitespace(alt) && isFirstPartyHttpImage(src) &&
          !EXCLUDED_IMAGE_PATTERN.test(src),
      )?.src
      : null;

    for (const image of page.images) {
      const record = records.get(image.src) ?? {
        sourceUrl: image.src,
        sourcePaths: new Set(),
        primary: false,
      };
      record.sourcePaths.add(page.sourcePath);
      record.primary ||= image.src === primaryImage;
      records.set(image.src, record);
    }
  }

  return [...records.values()]
    .map((record) => {
      const sourcePaths = [...record.sourcePaths].sort();
      const category = sourcePaths.some((sourcePath) =>
        PRODUCT_PATH_PATTERN.test(sourcePath)
      )
        ? "products"
        : sourcePaths.some((sourcePath) =>
            APPLICATION_PATH_PATTERN.test(sourcePath)
          )
          ? "applications"
          : null;
      return { ...record, sourcePaths, category };
    })
    .sort((left, right) => {
      if (left.category !== right.category) {
        if (left.category === "products") return -1;
        if (right.category === "products") return 1;
        if (left.category === "applications") return -1;
        if (right.category === "applications") return 1;
      }
      return left.sourceUrl < right.sourceUrl
        ? -1
        : left.sourceUrl > right.sourceUrl
          ? 1
          : 0;
    });
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

async function downloadCandidate(record, index, total) {
  try {
    const response = await fetchWithRetry(record.sourceUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const dimensions = imageSize(buffer);

    if (
      !dimensions.width ||
      !dimensions.height ||
      dimensions.width < 160 ||
      dimensions.height < 60
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
  const records = collectImageRecords(manifest);
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
  const brokenPrimaryImages = [];

  for (const record of records) {
    if (!isFirstPartyHttpImage(record.sourceUrl)) {
      totals.rejectedNonFirstParty += 1;
      if (record.primary) brokenPrimaryImages.push(record.sourceUrl);
      continue;
    }
    if (!record.category || EXCLUDED_IMAGE_PATTERN.test(record.sourceUrl)) {
      totals.rejectedExcluded += 1;
      if (record.primary) brokenPrimaryImages.push(record.sourceUrl);
      continue;
    }
    candidates.push(record);
  }

  const downloaded = await mapWithConcurrency(
    candidates,
    CONCURRENCY,
    (record, index) => downloadCandidate(record, index, candidates.length),
  );

  await mkdir(path.join(PUBLIC_PATH, "products"), { recursive: true });
  await mkdir(path.join(PUBLIC_PATH, "applications"), { recursive: true });

  const assetMap = {};
  const localUrlByHash = new Map();
  for (const result of downloaded) {
    if (result.status === "rejected-small") {
      totals.rejectedSmall += 1;
      if (result.primary) brokenPrimaryImages.push(result.sourceUrl);
      continue;
    }
    if (result.status === "failed") {
      totals.failed += 1;
      if (result.primary) brokenPrimaryImages.push(result.sourceUrl);
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
      localUrl = `/${result.category}/${filename}`;
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

  if (brokenPrimaryImages.length > 0) {
    throw new Error(
      `${brokenPrimaryImages.length} primary product image(s) were not ` +
        `downloaded:\n${brokenPrimaryImages.map((url) => `- ${url}`).join("\n")}`,
    );
  }
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
