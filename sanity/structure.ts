import type { StructureResolver } from "sanity/structure";

import { SITE_SETTINGS_DOCUMENT_ID } from "./singletons";

export const structure: StructureResolver = (S) =>
  S.list().id("content")
    .title("内容管理")
    .items([
      S.documentTypeListItem("page").title("页面内容"),
      S.documentTypeListItem("product").title("产品管理"),
      S.documentTypeListItem("news").title("新闻管理"),
      S.divider(),
      S.listItem()
        .id(SITE_SETTINGS_DOCUMENT_ID)
        .title("网站设置")
        .child(
          S.document()
            .id(SITE_SETTINGS_DOCUMENT_ID)
            .schemaType("siteSettings")
            .documentId(SITE_SETTINGS_DOCUMENT_ID)
            .title("网站设置"),
        ),
    ]);
