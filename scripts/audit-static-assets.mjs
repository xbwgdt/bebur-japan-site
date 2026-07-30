import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import * as cheerio from "cheerio";

const MAX_STATIC_ASSET_BYTES = 25 * 1024 * 1024;

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(entryPath);
    }

    return entry.isFile() ? [entryPath] : [];
  });
}

function outputRootFor(entryPath) {
  const projectOutput = path.resolve(process.cwd(), "out");
  const relativeToProjectOutput = path.relative(projectOutput, entryPath);

  if (
    relativeToProjectOutput === "" ||
    (!relativeToProjectOutput.startsWith(`..${path.sep}`) &&
      relativeToProjectOutput !== ".." &&
      !path.isAbsolute(relativeToProjectOutput))
  ) {
    return projectOutput;
  }

  return statSync(entryPath).isDirectory()
    ? entryPath
    : path.dirname(entryPath);
}

function srcsetReferences(value) {
  const references = [];
  let position = 0;

  while (position < value.length) {
    while (
      position < value.length &&
      (/[\t\n\f\r ]/u.test(value[position]) ||
        value[position] === ",")
    ) {
      position += 1;
    }

    const urlStart = position;
    while (
      position < value.length &&
      !/[\t\n\f\r ]/u.test(value[position])
    ) {
      position += 1;
    }

    let url = value.slice(urlStart, position);
    if (!url) {
      break;
    }

    if (url.endsWith(",")) {
      url = url.replace(/,+$/u, "");
      if (url) {
        references.push(url);
      }
      continue;
    }

    references.push(url);
    let parentheses = 0;
    while (position < value.length) {
      const character = value[position];
      position += 1;

      if (character === "(") {
        parentheses += 1;
      } else if (character === ")" && parentheses > 0) {
        parentheses -= 1;
      } else if (character === "," && parentheses === 0) {
        break;
      }
    }
  }

  return references;
}

function localReferences(html) {
  const $ = cheerio.load(html);
  const references = [];

  const addAttribute = (selector, attribute) => {
    $(selector).each((_, element) => {
      const value = $(element).attr(attribute)?.trim();
      if (value) {
        references.push({ selector, attribute, value });
      }
    });
  };
  const addSrcset = (selector) => {
    $(selector).each((_, element) => {
      const value = $(element).attr("srcset")?.trim();
      if (value) {
        for (const reference of srcsetReferences(value)) {
          references.push({
            selector,
            attribute: "srcset",
            value: reference,
          });
        }
      }
    });
  };

  addAttribute("img[src]", "src");
  addSrcset("img[srcset]");
  addAttribute("source[src]", "src");
  addSrcset("source[srcset]");
  addAttribute('link[rel~="stylesheet"][href]', "href");
  addAttribute("script[src]", "src");

  return references;
}

function cssReferences(css) {
  const references = [];
  const pattern =
    /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/giu;

  for (const match of css.matchAll(pattern)) {
    const value = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (value) {
      references.push(value);
    }
  }

  return references;
}

function isExternalReference(reference) {
  return (
    reference.startsWith("//") ||
    reference.startsWith("#") ||
    /^[a-z][a-z\d+.-]*:/iu.test(reference)
  );
}

function isRemoteBeburReference(reference) {
  if (
    !reference.startsWith("//") &&
    !/^https?:/iu.test(reference)
  ) {
    return false;
  }

  try {
    const url = new URL(
      reference,
      reference.startsWith("//") ? "https://audit.invalid" : undefined,
    );
    const hostname = url.hostname.toLowerCase();

    return (
      hostname === "bebur.net" ||
      hostname.endsWith(".bebur.net") ||
      hostname === "bebur-jp.com" ||
      hostname.endsWith(".bebur-jp.com")
    );
  } catch {
    return false;
  }
}

function resolveReference(reference, htmlPath, outputRoot) {
  if (isExternalReference(reference)) {
    return undefined;
  }

  const pathOnly = reference.split(/[?#]/u, 1)[0];
  if (!pathOnly) {
    return undefined;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathOnly);
  } catch {
    return null;
  }

  const resolved = decodedPath.startsWith("/")
    ? path.resolve(outputRoot, decodedPath.replace(/^\/+/u, ""))
    : path.resolve(path.dirname(htmlPath), decodedPath);
  const relativeToOutput = path.relative(outputRoot, resolved);

  if (
    relativeToOutput === ".." ||
    relativeToOutput.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToOutput)
  ) {
    return null;
  }

  return resolved;
}

export function runStaticAudit(
  entry = path.join("out", "index.html"),
) {
  const entryPath = path.resolve(process.cwd(), entry);
  if (!existsSync(entryPath)) {
    return [`missing audit entry -> ${entry}`];
  }

  const outputRoot = outputRootFor(entryPath);
  const htmlFiles = statSync(entryPath).isDirectory()
    ? collectFiles(entryPath).filter((file) => file.endsWith(".html"))
    : collectFiles(outputRoot).filter((file) => file.endsWith(".html"));
  const cssFiles = collectFiles(outputRoot).filter((file) =>
    file.endsWith(".css"),
  );
  const unresolved = new Set();

  for (const assetPath of collectFiles(outputRoot)) {
    const assetSize = statSync(assetPath).size;
    if (assetSize > MAX_STATIC_ASSET_BYTES) {
      unresolved.add(
        `${path.relative(outputRoot, assetPath).split(path.sep).join("/")} exceeds 25 MiB -> ${assetSize} bytes`,
      );
    }
  }

  for (const htmlPath of htmlFiles) {
    const html = readFileSync(htmlPath, "utf8");
    const htmlLabel = path
      .relative(outputRoot, htmlPath)
      .split(path.sep)
      .join("/");

    for (const reference of localReferences(html)) {
      const resolved = resolveReference(
        reference.value,
        htmlPath,
        outputRoot,
      );

      if (
        resolved === undefined ||
        (resolved !== null &&
          existsSync(resolved) &&
          statSync(resolved).isFile())
      ) {
        continue;
      }

      unresolved.add(
        `${htmlLabel} ${reference.selector}[${reference.attribute}] -> ${reference.value}`,
      );
    }
  }

  for (const cssPath of cssFiles) {
    const css = readFileSync(cssPath, "utf8");
    const cssLabel = path
      .relative(outputRoot, cssPath)
      .split(path.sep)
      .join("/");

    for (const reference of cssReferences(css)) {
      if (isRemoteBeburReference(reference)) {
        unresolved.add(`${cssLabel} css url() -> ${reference}`);
        continue;
      }

      const resolved = resolveReference(reference, cssPath, outputRoot);
      if (
        resolved === undefined ||
        (resolved !== null &&
          existsSync(resolved) &&
          statSync(resolved).isFile())
      ) {
        continue;
      }

      unresolved.add(`${cssLabel} css url() -> ${reference}`);
    }
  }

  return [...unresolved].toSorted();
}

function isMainModule() {
  return (
    process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  );
}

if (isMainModule()) {
  const entry = process.argv[2] ?? path.join("out", "index.html");
  const unresolved = runStaticAudit(entry);

  console.log(`static HTML files audited from: ${entry}`);
  console.log(`unresolved local asset references: ${unresolved.length}`);
  for (const item of unresolved) {
    console.log(`- ${item}`);
  }

  if (unresolved.length > 0) {
    process.exitCode = 1;
  }
}
