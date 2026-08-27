import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "gbzt89e5";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19";
const apiBase = `https://${projectId}.api.sanity.io/v${apiVersion}`;

const approvedContact = {
  phone: "080-5189-8663",
  inquiryEmail: "info@newtree-i.com",
};

export const approvedHomeHero = Object.freeze({
  eyebrow: "WATER QUALITY & GAS DETECTION",
  title: "水質とガスを、より確かに。",
  summary:
    "Beburの精密計測技術で、水処理、製造、医薬、液冷設備の安全と品質管理を支えます。",
  backgroundImage: Object.freeze({
    src: "/source-media/1761791363673595-08e6a0255dfd817e.jpg",
    alt: "Beburの水質分析・ガス検知ソリューション",
  }),
  primaryAction: Object.freeze({ label: "製品情報を見る", href: "/products" }),
  secondaryAction: Object.freeze({ label: "お問い合わせ", href: "/contact" }),
  style: Object.freeze({
    color: "brand",
    fontSize: "xl",
    alignment: "left",
    spacing: "normal",
    desktopTitleWrap: "nowrap",
  }),
});

export function buildHomeHeroPatch({ hero, assetId }) {
  if (!assetId || typeof assetId !== "string") {
    throw new Error("A Sanity image asset ID is required.");
  }

  return {
    id: "siteSettings",
    set: {
      homeHero: {
        eyebrow: hero.eyebrow,
        title: hero.title,
        summary: hero.summary,
        backgroundImage: {
          _type: "image",
          asset: { _type: "reference", _ref: assetId },
          alt: hero.backgroundImage.alt,
        },
        primaryAction: hero.primaryAction,
        secondaryAction: hero.secondaryAction,
        style: hero.style,
      },
    },
  };
}

export function resolvePublicAssetPath(root, publicUrl) {
  return path.resolve(root, "public", publicUrl.replace(/^\/+|\\+/gu, ""));
}

function readToken() {
  const configPath = [
    path.join(
      process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"),
      "sanity",
      "config.json",
    ),
    path.join(os.homedir(), ".config", "sanity", "config.json"),
  ].find(existsSync);

  return (
    process.env.SANITY_AUTH_TOKEN ??
    (configPath
      ? JSON.parse(readFileSync(configPath, "utf8")).authToken
      : undefined)
  );
}

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const token = readToken();
  if (!token) {
    throw new Error("Sanity authentication token is required for home hero synchronization.");
  }

  const request = async (pathname, options = {}) => {
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${apiBase}${pathname}`, { ...options, headers });
    if (!response.ok) {
      throw new Error(
        `Sanity request failed (${response.status}) ${pathname}: ${await response.text()}`,
      );
    }
    return response;
  };

  const query = async (groq, params = {}) => {
    const response = await request(`/data/query/${dataset}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: groq, params }),
    });
    return (await response.json()).result;
  };

  const root = process.cwd();
  const imagePath = resolvePublicAssetPath(
    root,
    approvedHomeHero.backgroundImage.src,
  );
  const publicRoot = path.resolve(root, "public");
  if (
    !imagePath.startsWith(publicRoot + path.sep) ||
    !existsSync(imagePath)
  ) {
    throw new Error("Approved home hero image is missing or outside public/.");
  }

  const image = await readFile(imagePath);
  const sha1hash = createHash("sha1").update(image).digest("hex");
  const existingAsset = await query(
    '*[_type == "sanity.imageAsset" && sha1hash == $sha1hash][0]{_id}',
    { sha1hash },
  );

  if (dryRun) {
    console.log(
      JSON.stringify({
        dryRun: true,
        documentId: "siteSettings",
        fields: ["homeHero"],
        imageAsset: existingAsset?._id ? "reuse" : "upload-required",
      }),
    );
    return;
  }

  let assetId = existingAsset?._id;
  let uploadedAsset = false;
  if (!assetId) {
    const response = await request(
      `/assets/images/${dataset}?filename=${encodeURIComponent(path.basename(imagePath))}`,
      {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: image,
      },
    );
    assetId = (await response.json()).document._id;
    uploadedAsset = true;
  }

  const patch = buildHomeHeroPatch({ hero: approvedHomeHero, assetId });
  const mutationResponse = await request(`/data/mutate/${dataset}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mutations: [{ patch }],
      returnDocuments: false,
    }),
  });
  await mutationResponse.json();

  const verification = await query(
    '*[_type == "siteSettings" && _id == "siteSettings"][0]{phone,inquiryEmail,homeHero{eyebrow,title,summary,backgroundImage{alt,asset->{_id}},primaryAction,secondaryAction,style}}',
  );
  if (
    verification?.phone !== approvedContact.phone ||
    verification?.inquiryEmail !== approvedContact.inquiryEmail
  ) {
    throw new Error("Protected contact verification failed after home hero synchronization.");
  }

  const expectedHero = patch.set.homeHero;
  const actualHero = verification?.homeHero;
  if (
    !actualHero ||
    actualHero.eyebrow !== expectedHero.eyebrow ||
    actualHero.title !== expectedHero.title ||
    actualHero.summary !== expectedHero.summary ||
    actualHero.backgroundImage?.asset?._id !== assetId ||
    actualHero.backgroundImage?.alt !== expectedHero.backgroundImage.alt ||
    !isDeepStrictEqual(actualHero.primaryAction, expectedHero.primaryAction) ||
    !isDeepStrictEqual(actualHero.secondaryAction, expectedHero.secondaryAction) ||
    !isDeepStrictEqual(actualHero.style, expectedHero.style)
  ) {
    throw new Error("Sanity did not return the exact approved home hero after synchronization.");
  }

  console.log(
    JSON.stringify({
      synchronized: true,
      documentId: "siteSettings",
      fields: ["homeHero"],
      uploadedAsset,
      protectedContactVerified: true,
    }),
  );
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  await run();
}
