import { describe, expect, it } from "vitest";

import { buildMailto, siteConfig } from "@/lib/constants";

describe("Bebur Japan contact details", () => {
  it("exposes the approved distributor identity", () => {
    expect(siteConfig.company).toBe("新樹産業株式会社");
    expect(siteConfig.distributorLabel).toBe(
      "Bebur 日本総代理店｜新樹産業株式会社",
    );
    expect(siteConfig.postalCode).toBe("〒340-0043");
    expect(siteConfig.address).toBe("埼玉県草加市草加2－13－21－7");
    expect(siteConfig.phone).toBe("080-5189-8663");
    expect(siteConfig.email).toBe("info@newtree-i.com");
  });

  it("builds the product inquiry email link", () => {
    expect(buildMailto("BT-7000 多項目水質分析計")).toBe(
      "mailto:info@newtree-i.com?subject=BT-7000%20%E5%A4%9A%E9%A0%85%E7%9B%AE%E6%B0%B4%E8%B3%AA%E5%88%86%E6%9E%90%E8%A8%88%E3%81%AE%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B",
    );
  });
});
