import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: "#000000",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          borderRadius: 8,
          border: "1.5px solid #27272a",
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-1px",
          position: "relative",
        }}
      >
        <span style={{ color: "#ffffff", transform: "translateY(-1px)" }}>A</span>
        <div
          style={{
            position: "absolute",
            bottom: 3,
            right: 4,
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#38bdf8",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
