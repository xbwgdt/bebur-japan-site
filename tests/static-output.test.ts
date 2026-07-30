import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  truncateSync,
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
            <source srcset="data:image/svg+xml,%3Csvg%3E%3C/svg%3E 1x, /assets/present.webp 2x">
            <img src="/assets/present.png" srcset="/assets/present.png 1x, /assets/missing-2x.png 2x" alt="">
            <img srcset="data:image/png;base64,iVBORw0KGgo=, /assets/present.png 2x" alt="">
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

  it("rejects any individual exported asset larger than 25 MiB", () => {
    const outputDirectory = mkdtempSync(
      path.join(tmpdir(), "bebur-static-size-audit-"),
    );
    temporaryDirectories.push(outputDirectory);
    const entryPath = path.join(outputDirectory, "index.html");
    const oversizedAsset = path.join(outputDirectory, "media", "oversized.mp4");
    mkdirSync(path.dirname(oversizedAsset), { recursive: true });
    writeFileSync(entryPath, "<!doctype html>");
    writeFileSync(oversizedAsset, "");
    truncateSync(oversizedAsset, 25 * 1024 * 1024 + 1);

    expect(runStaticAudit(entryPath)).toContain(
      "media/oversized.mp4 exceeds 25 MiB -> 26214401 bytes",
    );
  });

  it("audits CSS url references and rejects remote Bebur assets", () => {
    const outputDirectory = mkdtempSync(
      path.join(tmpdir(), "bebur-static-css-audit-"),
    );
    temporaryDirectories.push(outputDirectory);
    const assetsDirectory = path.join(outputDirectory, "assets");
    mkdirSync(assetsDirectory, { recursive: true });
    writeFileSync(
      path.join(outputDirectory, "index.html"),
      '<link rel="stylesheet" href="/assets/site.css">',
    );
    writeFileSync(path.join(assetsDirectory, "present.woff2"), "");
    writeFileSync(
      path.join(assetsDirectory, "site.css"),
      `
      @font-face { src: url("./present.woff2") format("woff2"); }
      .missing { background: url('/assets/missing.png?build=1'); }
      .inline { background: url(data:image/svg+xml,%3Csvg%3E%3C/svg%3E); }
      .fragment { mask: url("#local-mask"); }
      .sanity { background: url("https://cdn.sanity.io/images/project/production/remote.jpg"); }
      .font { src: url("https://fonts.gstatic.com/s/example.woff2"); }
      .bebur { background: url("https://www.bebur.net/static/images/remote.jpg"); }
      .bebur-protocol-relative { background: url("//bebur.net/static/images/remote-2.jpg"); }
      `,
    );

    const unresolved = runStaticAudit(
      path.join(outputDirectory, "index.html"),
    );

    expect(unresolved).toHaveLength(3);
    expect(unresolved).toEqual(
      expect.arrayContaining([
        expect.stringContaining("/assets/missing.png?build=1"),
        expect.stringContaining(
          "https://www.bebur.net/static/images/remote.jpg",
        ),
        expect.stringContaining(
          "//bebur.net/static/images/remote-2.jpg",
        ),
      ]),
    );
    expect(unresolved.join("\n")).not.toMatch(
      /present\.woff2|data:image|#local-mask|cdn\.sanity\.io|fonts\.gstatic\.com/u,
    );
  });
});
