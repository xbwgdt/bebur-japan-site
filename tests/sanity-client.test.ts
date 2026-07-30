import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@sanity/client", () => ({
  createClient: createClientMock,
}));

describe("Sanity static-build client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "published-project");
    vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");
    vi.stubEnv("NEXT_PUBLIC_SANITY_API_VERSION", "2025-02-19");
    createClientMock.mockReset();
    createClientMock.mockReturnValue({ fetch: vi.fn() });
  });

  it("reads published webhook-triggered builds without the stale CDN", async () => {
    const { getSanityClient } = await import("../lib/sanity/client");

    expect(getSanityClient()).not.toBeNull();
    expect(createClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        perspective: "published",
        useCdn: false,
      }),
    );
  });
});
