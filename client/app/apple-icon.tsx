import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <rect width="64" height="64" fill="#10202a" />
          <g fill="none" stroke="#f6f2e8" strokeWidth="3.2" strokeLinecap="round">
            <circle cx="29" cy="35" r="19" />
            <ellipse cx="29" cy="35" rx="7.5" ry="19" />
            <path d="M10 35h38" strokeWidth="2.2" />
          </g>
          <circle cx="48" cy="16" r="8" fill="#c8472b" stroke="#10202a" strokeWidth="3.5" />
        </svg>
      </div>
    ),
    size,
  );
}
