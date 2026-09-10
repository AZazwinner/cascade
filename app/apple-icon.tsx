import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 12,
          padding: "24px 18px 18px",
        }}
      >
        <div style={{ width: 32, height: 56, background: "#22c78a" }} />
        <div style={{ width: 32, height: 94, background: "#4c95ea" }} />
        <div style={{ width: 32, height: 132, background: "#e4772f" }} />
      </div>
    ),
    { ...size },
  );
}
