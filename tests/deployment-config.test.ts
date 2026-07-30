import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");

describe("Railway deployment packaging", () => {
  it("builds a standalone Next.js runtime with Node 22 Alpine", () => {
    const dockerfile = readProjectFile("Dockerfile");

    expect(dockerfile).toMatch(/^FROM node:22-alpine AS deps$/m);
    expect(dockerfile).toMatch(/^FROM node:22-alpine AS builder$/m);
    expect(dockerfile).toMatch(/^FROM node:22-alpine AS runner$/m);
    expect(dockerfile.match(/^FROM node:22-alpine\b/gm)).toHaveLength(3);

    expect(dockerfile).toMatch(/^RUN npm ci$/m);
    expect(dockerfile).toMatch(/^RUN npm run build$/m);
    expect(dockerfile).toMatch(
      /^COPY --from=builder \/app\/public \.\/public$/m,
    );
    expect(dockerfile).toMatch(
      /^COPY --from=builder --chown=nextjs:nodejs \/app\/\.next\/standalone \.\/$/m,
    );
    expect(dockerfile).toMatch(
      /^COPY --from=builder --chown=nextjs:nodejs \/app\/\.next\/static \.\/\.next\/static$/m,
    );

    expect(dockerfile).toMatch(/addgroup .*nodejs/);
    expect(dockerfile).toMatch(/adduser .*nextjs/);
    expect(dockerfile).toMatch(/^USER nextjs$/m);
    expect(dockerfile).toMatch(/^ENV NODE_ENV=production$/m);
    expect(dockerfile).toMatch(/^ENV PORT=3000$/m);
    expect(dockerfile).toMatch(/^ENV HOSTNAME=0\.0\.0\.0$/m);
    expect(dockerfile).toMatch(/^EXPOSE 3000$/m);
    expect(dockerfile).toMatch(/^CMD \["node", "server\.js"\]$/m);
    expect(dockerfile).not.toMatch(/\bnext start\b/);
  });

  it("keeps local artifacts, planning files, and secrets out of the build context", () => {
    const ignoreEntries = readProjectFile(".dockerignore")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    expect(ignoreEntries).toEqual(
      expect.arrayContaining([
        ".git",
        ".next",
        "node_modules",
        ".worktrees",
        ".superpowers",
        "tests",
        "docs",
        "*.log",
        ".env*",
      ]),
    );

    for (const requiredBuildInput of [
      "app",
      "components",
      "content",
      "lib",
      "public",
      "package.json",
      "package-lock.json",
    ]) {
      expect(ignoreEntries).not.toContain(requiredBuildInput);
    }
  });

  it("enables Next.js standalone output", () => {
    const nextConfig = readProjectFile("next.config.ts");

    expect(nextConfig).toMatch(/output:\s*["']standalone["']/);
  });
});
