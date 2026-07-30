import { createClient, type SanityClient } from "@sanity/client";

export const sanityEnvironment = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production",
  apiVersion:
    process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2025-02-19",
};

export const isSanityConfigured = Boolean(sanityEnvironment.projectId);

export const sanityClient: SanityClient | null = isSanityConfigured
  ? createClient({
      ...sanityEnvironment,
      useCdn: true,
      perspective: "published",
    })
  : null;
