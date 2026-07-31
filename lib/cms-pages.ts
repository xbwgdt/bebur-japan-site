import type { SanityPage } from "@/lib/sanity/queries";
import { getPageBySlug } from "@/lib/sanity/queries";

/**
 * CMS page reads are optional enhancements. A disconnected or malformed CMS
 * must not turn an otherwise available public route into a 500 response.
 */
export async function getPublishedPageForRoute(
  slug: string,
): Promise<SanityPage | null> {
  try {
    const page = await getPageBySlug(slug);

    return page?.blocks.length ? page : null;
  } catch {
    return null;
  }
}
