import type { MetadataRoute } from "next";

import { getAllRoutes } from "@/lib/content";
import { siteConfig } from "@/lib/constants";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return getAllRoutes().map((route) => ({
    url: new URL(route, `${siteConfig.origin}/`).toString(),
  }));
}
