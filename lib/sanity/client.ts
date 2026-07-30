import { createClient, type SanityClient } from "@sanity/client";

export const sanityEnvironment = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production",
  apiVersion:
    process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2025-02-19",
};

export const isSanityConfigured = Boolean(sanityEnvironment.projectId);

export let sanityClient: SanityClient | null = null;
let clientInitializationAttempted = false;

export function getSanityClient(): SanityClient | null {
  if (clientInitializationAttempted) {
    return sanityClient;
  }

  clientInitializationAttempted = true;
  if (!isSanityConfigured) {
    return null;
  }

  try {
    sanityClient = createClient({
      ...sanityEnvironment,
      useCdn: false,
      perspective: "published",
    });
  } catch {
    sanityClient = null;
  }

  return sanityClient;
}
