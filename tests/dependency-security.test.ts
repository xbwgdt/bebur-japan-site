import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const packages = lock.packages as Record<string, { version?: string }>;
const versions = (name: string) => Object.entries(packages)
  .filter(([path]) => path.endsWith(`node_modules/${name}`))
  .map(([, entry]) => entry.version!);
const atLeast = (version: string, minimum: string) => {
  const actual = version.split(".").map(Number);
  const floor = minimum.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (actual[i] !== floor[i]) return actual[i] > floor[i];
  }
  return true;
};

describe("security maintenance floors", () => {
  it("uses one matching React and React DOM version across website and Studio", () => {
    expect(new Set([...versions("react"), ...versions("react-dom")]).size).toBe(1);
  });
  it.each([["next", "16.4.6"], ["image-size", "2.1.0"], ["sanity", "6.23.0"], ["@sanity/vision", "6.23.0"], ["vitest", "5.1.0"]])
    ("locks %s at the reviewed patched baseline", (name, minimum) => {
      expect(versions(name).length).toBeGreaterThan(0);
      expect(versions(name).every((version) => atLeast(version, minimum))).toBe(true);
    });
  it("does not retain the unmaintained vulnerable archive extractor", () => {
    expect(versions("decompress")).toEqual([]);
  });
  it("does not retain the vulnerable DOM sanitizer or worker pool", () => {
    expect(versions("dompurify").every((version) => atLeast(version, "3.4.17"))).toBe(true);
    expect(versions("tinypool").every((version) => atLeast(version, "2.1.2"))).toBe(true);
  });
  it("checks the dependency audit and Studio build in release CI", () => {
    const ci = readFileSync(new URL("../.github/workflows/verify.yml", import.meta.url), "utf8");
    expect(ci).toContain("npm run audit:dependencies");
    expect(ci).toContain("npm run sanity:typecheck");
    expect(ci).toContain("npm run sanity:build");
  });
  it("removes the remaining vulnerable CLI parsers and path matcher", () => {
    expect(versions("js-yaml").every((v) => atLeast(v, "3.15.2"))).toBe(true);
    expect(versions("smol-toml").every((v) => atLeast(v, "1.9.1"))).toBe(true);
    expect(versions("minimatch").every((v) => atLeast(v, "11.0.1"))).toBe(true);
    const undiciFloors: Record<string, string> = { "6": "6.29.1", "7": "7.30.1", "8": "8.12.2" };
    expect(versions("undici").every((v) => {
      const floor = undiciFloors[v.split(".")[0]];
      return Boolean(floor) && atLeast(v, floor);
    })).toBe(true);
  });
});

describe("scoped CLI dependency compatibility", () => {
  const require = createRequire(import.meta.url);
  it("preserves the CommonJS minimatch API used by oclif plugin discovery", () => {
    const fromOclif = createRequire(require.resolve("@oclif/core"));
    const { minimatch } = fromOclif("minimatch");
    const names = ["@sanity/cli", "@sanity/runtime-cli", "unrelated-tool"];
    expect(names.filter((name) => minimatch(name, "@sanity/*")))
      .toEqual(["@sanity/cli", "@sanity/runtime-cli"]);
    expect(minimatch("@sanity/cli", "@sanity/cli")).toBe(true);
    expect(minimatch("unrelated-tool", "@sanity/*")).toBe(false);
  });
  it("preserves Vercel framework detection for JSON, YAML and TOML", async () => {
    const { readConfigFile } = require(join(dirname(require.resolve("@vercel/frameworks")), "read-config-file.js"));
    const directory = mkdtempSync(join(tmpdir(), "bebur-parser-"));
    try {
      const inputs = {"example.json": '{"framework":"nextjs"}', "example.yaml": "framework: nextjs\n", "example.toml": 'framework = "nextjs"\n'};
      for (const [name, data] of Object.entries(inputs)) {
        const file = join(directory, name);
        writeFileSync(file, data);
        expect(await readConfigFile(file)).toEqual({framework:"nextjs"});
      }
    } finally {
      rmSync(directory, {recursive:true, force:true});
    }
  });
});
