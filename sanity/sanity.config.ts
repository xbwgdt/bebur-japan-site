import { zhHansLocale } from "@sanity/locale-zh-hans";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { readStudioEnvironment } from "./environment";
import { schemaTypes } from "./schemaTypes";
import {
  filterSingletonActions,
  filterSingletonCreationOptions,
  filterSingletonTemplates,
} from "./singletons";
import { structure } from "./structure";

const studioEnvironment = readStudioEnvironment({
  SANITY_STUDIO_PROJECT_ID: process.env.SANITY_STUDIO_PROJECT_ID,
  SANITY_STUDIO_DATASET: process.env.SANITY_STUDIO_DATASET,
  SANITY_STUDIO_API_VERSION: process.env.SANITY_STUDIO_API_VERSION,
});

export default defineConfig({
  name: "bebur-japan",
  title: "Bebur 日本站内容管理",
  projectId: studioEnvironment.projectId,
  dataset: studioEnvironment.dataset,
  plugins: [
    structureTool({ structure }),
    visionTool({
      defaultApiVersion: studioEnvironment.apiVersion,
      defaultDataset: studioEnvironment.dataset,
    }),
    zhHansLocale({ title: "简体中文" }),
  ],
  schema: {
    types: schemaTypes,
    templates: filterSingletonTemplates,
  },
  document: {
    actions: filterSingletonActions,
    newDocumentOptions: filterSingletonCreationOptions,
  },
});
