import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <rect width="64" height="64" fill="#3358e0" />
          <g fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round">
            <circle cx="32" cy="33" r="17" />
            <ellipse cx="32" cy="33" rx="7.5" ry="17" />
            <path d="M15 33h34" />
          </g>
          <circle cx="46" cy="18" r="6.2" fill="#ffb84d" stroke="#3358e0" strokeWidth="3" />
        </svg>
      </div>
    ),
    size,
  );
}
