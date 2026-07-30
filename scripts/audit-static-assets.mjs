import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import * as cheerio from "cheerio";

function collectHtmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectHtmlFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".html")
      ? [entryPath]
      : [];
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
  return value
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/u)[0] ?? "")
    .filter(Boolean);
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

function isExternalReference(reference) {
  return (
    reference.startsWith("//") ||
    reference.startsWith("#") ||
    /^[a-z][a-z\d+.-]*:/iu.test(reference)
  );
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
    ? collectHtmlFiles(entryPath)
    : collectHtmlFiles(outputRoot);
  const unresolved = new Set();

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
