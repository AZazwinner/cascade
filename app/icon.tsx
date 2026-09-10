import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          gap: 2,
          padding: "4px 3px 3px",
        }}
      >
        <div style={{ width: 6, height: 10, background: "#22c78a" }} />
        <div style={{ width: 6, height: 17, background: "#4c95ea" }} />
        <div style={{ width: 6, height: 24, background: "#e4772f" }} />
      </div>
    ),
    { ...size },
  );
}
