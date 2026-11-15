import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import Icon, { contentType, dynamic, size } from "../app/icon";

// Original bytes of https://www.bebur.net/favicon.ico, approved by the user.
const approvedSha256 = "4c4d844b19d84e4c141593a1915da7902a1f4b773e568df2ac37a0ac96c804a0";

describe("approved Bebur browser icon", () => {
  it("keeps the original logo dimensions and static PNG metadata", () => {
    expect(size).toEqual({ width: 1173, height: 406 });
    expect(contentType).toBe("image/png");
    expect(dynamic).toBe("force-static");
  });

  it("serves the approved official image without cropping, redrawing or hotlinking", async () => {
    const response = await Icon();
    expect(response.headers.get("content-type")).toBe("image/png");
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(approvedSha256);
  });
});
