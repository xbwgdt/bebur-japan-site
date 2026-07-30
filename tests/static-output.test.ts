import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { afterEach, describe, expect, it, vi } from "vitest";

import { runStaticAudit } from "../scripts/audit-static-assets.mjs";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("static export asset audit", () => {
  it("finds no unresolved local references from out/index.html", () => {
    const fixtureRoot = mkdtempSync(
      path.join(tmpdir(), "bebur-static-clean-"),
    );
    temporaryDirectories.push(fixtureRoot);
    const outputDirectory = path.join(fixtureRoot, "out");
    mkdirSync(path.join(outputDirectory, "_next", "static"), {
      recursive: true,
    });
    mkdirSync(path.join(outputDirectory, "media"), { recursive: true });
    mkdirSync(path.join(outputDirectory, "products"), { recursive: true });
    writeFileSync(
      path.join(outputDirectory, "_next", "static", "site.css"),
      "",
    );
    writeFileSync(
      path.join(outputDirectory, "_next", "static", "site.js"),
      "",
    );
    writeFileSync(path.join(outputDirectory, "media", "hero.jpg"), "");
    writeFileSync(
      path.join(outputDirectory, "index.html"),
      `<!doctype html>
      <link rel="stylesheet" href="/_next/static/site.css?build=1">
      <script src="/_next/static/site.js#runtime"></script>
      <img src="/media/hero.jpg" alt="">`,
    );
    writeFileSync(
      path.join(outputDirectory, "products", "index.html"),
      '<img src="../media/hero.jpg" alt="">',
    );
    const cwd = vi.spyOn(process, "cwd").mockReturnValue(fixtureRoot);

    try {
      expect(runStaticAudit("out/index.html")).toEqual([]);
    } finally {
      cwd.mockRestore();
    }
  });

  it("checks local img, source, stylesheet, and script files", () => {
    const outputDirectory = mkdtempSync(
      path.join(tmpdir(), "bebur-static-audit-"),
    );
    temporaryDirectories.push(outputDirectory);
    mkdirSync(path.join(outputDirectory, "assets"), { recursive: true });
    writeFileSync(path.join(outputDirectory, "assets", "present.png"), "");
    writeFileSync(path.join(outputDirectory, "assets", "present.webp"), "");
    writeFileSync(path.join(outputDirectory, "assets", "present.css"), "");
    writeFileSync(path.join(outputDirectory, "assets", "present.js"), "");

    const entryPath = path.join(outputDirectory, "index.html");
    writeFileSync(
      entryPath,
      `<!doctype html>
      <html>
        <head>
          <link rel="stylesheet" href="/assets/present.css">
          <link rel="stylesheet" href="/assets/missing.css">
          <script src="/assets/present.js"></script>
          <script src="/assets/missing.js"></script>
        </head>
        <body>
          <picture>
            <source src="/assets/present.webp" srcset="/assets/present.webp 1x, /assets/missing-2x.webp 2x">
            <img src="/assets/present.png" srcset="/assets/present.png 1x, /assets/missing-2x.png 2x" alt="">
          </picture>
          <img src="https://cdn.sanity.io/images/project/production/remote.jpg" alt="">
        </body>
      </html>`,
    );

    const unresolved = runStaticAudit(entryPath);

    expect(unresolved).toHaveLength(4);
    expect(unresolved.join("\n")).toContain("/assets/missing.css");
    expect(unresolved.join("\n")).toContain("/assets/missing.js");
    expect(unresolved.join("\n")).toContain("/assets/missing-2x.webp");
    expect(unresolved.join("\n")).toContain("/assets/missing-2x.png");

    const cli = spawnSync(
      process.execPath,
      [
        path.resolve(process.cwd(), "scripts", "audit-static-assets.mjs"),
        entryPath,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );

    expect(cli.status).toBe(1);
  });
});
