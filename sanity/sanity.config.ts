import { zhHansLocale } from "@sanity/locale-zh-hans";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./schemaTypes";
import { structure } from "./structure";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();

if (!projectId) {
  throw new Error(
    "缺少 NEXT_PUBLIC_SANITY_PROJECT_ID。请在本地或托管环境中设置该公共环境变量。",
  );
}

export default defineConfig({
  name: "bebur-japan",
  title: "Bebur 日本站内容管理",
  projectId,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production",
  plugins: [
    structureTool({ structure }),
    visionTool(),
    zhHansLocale({ title: "简体中文" }),
  ],
  schema: {
    types: schemaTypes,
  },
});
