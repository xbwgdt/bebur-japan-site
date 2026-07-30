import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");

describe("Cloudflare Pages static export", () => {
  it("builds a fully static Next.js export with unoptimized local images", () => {
    const nextConfig = readProjectFile("next.config.ts");

    expect(nextConfig).toMatch(/output:\s*["']export["']/);
    expect(nextConfig).toMatch(/unoptimized:\s*true/);
    expect(nextConfig).not.toMatch(/standalone/);
    expect(nextConfig).not.toMatch(/remotePatterns/);
  });

  it("publishes the generated out directory with pinned Wrangler Pages configuration", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts?: Record<string, string>;
    };
    const wranglerConfig = JSON.parse(readProjectFile("wrangler.jsonc")) as {
      name?: string;
      pages_build_output_dir?: string;
      compatibility_date?: string;
    };

    expect(packageJson.scripts?.["deploy:cloudflare"]).toBe(
      "npm exec --yes --package=wrangler@4.115.0 -- wrangler pages deploy",
    );
    expect(packageJson.scripts?.start).toBe(
      "npm exec --yes --package=wrangler@4.115.0 -- wrangler pages dev",
    );
    expect(wranglerConfig).toMatchObject({
      name: "bebur-japan",
      pages_build_output_dir: "./out",
      compatibility_date: "2026-07-29",
    });
  });

  it("documents the public Sanity build variables used by the static site", () => {
    const environmentTemplate = readProjectFile(".env.example");

    expect(environmentTemplate).toMatch(
      /^NEXT_PUBLIC_SANITY_PROJECT_ID=$/m,
    );
    expect(environmentTemplate).toMatch(
      /^NEXT_PUBLIC_SANITY_DATASET=production$/m,
    );
    expect(environmentTemplate).toMatch(
      /^NEXT_PUBLIC_SANITY_API_VERSION=2025-02-19$/m,
    );
  });

  it("documents the actual webhook types and Administrator-only Sanity access", () => {
    const runbook = readProjectFile(
      "docs/operations/sanity-cloudflare-publishing.md",
    );

    expect(runbook).toContain(
      '_type in ["product", "news", "siteSettings"]',
    );
    expect(runbook).not.toContain(
      '_type in ["product", "application", "article", "siteSettings", "page"]',
    );
    expect(runbook).toMatch(
      /Sanity:\s+Administrator access only; do not assign Editor access\./,
    );
    expect(runbook).not.toMatch(
      /Sanity:.*Editor role for normal content work/,
    );
  });

  it("removes Railway-only deployment files", () => {
    expect(existsSync(resolve(process.cwd(), "Dockerfile"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), ".dockerignore"))).toBe(false);
  });

  it("sets PNG MIME types for extensionless static metadata routes", () => {
    const headers = readProjectFile("public/_headers");

    expect(headers).toMatch(/\/opengraph-image\s+Content-Type: image\/png/s);
    expect(headers).toMatch(/\/icon\s+Content-Type: image\/png/s);
  });
});
