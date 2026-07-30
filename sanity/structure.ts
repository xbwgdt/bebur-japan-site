import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("内容管理")
    .items([
      S.documentTypeListItem("product").title("产品管理"),
      S.documentTypeListItem("news").title("新闻管理"),
      S.divider(),
      S.listItem()
        .id("siteSettings")
        .title("网站设置")
        .child(
          S.document()
            .id("siteSettings")
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("网站设置"),
        ),
    ]);
