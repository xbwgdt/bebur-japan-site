import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(145deg, #061b39 0%, #0a4d82 58%, #10b9d3 100%)",
          color: "#ffffff",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          fontSize: 38,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-0.08em",
          width: "100%",
        }}
      >
        <span
          style={{
            alignItems: "center",
            border: "2px solid rgba(255,255,255,0.84)",
            borderRadius: 16,
            display: "flex",
            height: 48,
            justifyContent: "center",
            paddingRight: 2,
            width: 48,
          }}
        >
          B
        </span>
      </div>
    ),
    size,
  );
}
