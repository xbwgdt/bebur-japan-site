import { readFile } from "node:fs/promises";

import { ImageResponse } from "next/og";

export const alt =
  "Bebur Japan｜水質分析・ガス検知の精密ソリューション";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export const openGraphBackgroundPath = [
  "public",
  "media",
  "brand",
  "bebur-og-background.png",
] as const;

export const openGraphImageText = {
  brand: "Bebur Japan",
  message: "水質分析・ガス検知の精密ソリューション",
  distributor: "日本総代理店 新樹産業株式会社",
} as const;

export default async function OpenGraphImage(): Promise<ImageResponse> {
  const backgroundData = await readFile(
    new URL(
      "../public/media/brand/bebur-og-background.png",
      import.meta.url,
    ),
    "base64",
  );
  const backgroundSrc = `data:image/png;base64,${backgroundData}`;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          backgroundColor: "#03162f",
          color: "#ffffff",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <img
          alt=""
          height={630}
          src={backgroundSrc}
          style={{
            height: "100%",
            left: 0,
            objectFit: "cover",
            opacity: 0.72,
            position: "absolute",
            top: 0,
            width: "100%",
          }}
          width={1200}
        />
        <div
          style={{
            background:
              "linear-gradient(90deg, rgba(2,17,39,0.96) 0%, rgba(4,30,64,0.88) 48%, rgba(6,49,87,0.32) 100%)",
            display: "flex",
            height: "100%",
            left: 0,
            position: "absolute",
            top: 0,
            width: "100%",
          }}
        />
        <div
          style={{
            border: "1px solid rgba(80,218,239,0.48)",
            display: "flex",
            height: 566,
            left: 32,
            position: "absolute",
            top: 32,
            width: 1136,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "76px 86px 68px",
            position: "relative",
            width: "100%",
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              fontFamily: "Arial, sans-serif",
              fontSize: 27,
              fontWeight: 700,
              letterSpacing: "0.12em",
            }}
          >
            <span
              style={{
                backgroundColor: "#17c7df",
                display: "flex",
                height: 4,
                marginRight: 18,
                width: 54,
              }}
            />
            {openGraphImageText.brand}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 900,
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily:
                  '"Noto Sans JP", "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif',
                fontSize: 58,
                fontWeight: 700,
                letterSpacing: "-0.035em",
                lineHeight: 1.35,
                textShadow: "0 3px 24px rgba(0,0,0,0.28)",
              }}
            >
              {openGraphImageText.message}
            </div>
            <div
              style={{
                color: "#a7eaf3",
                display: "flex",
                fontFamily:
                  '"Noto Sans JP", "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif',
                fontSize: 27,
                fontWeight: 600,
                letterSpacing: "0.04em",
                marginTop: 30,
              }}
            >
              {openGraphImageText.distributor}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
