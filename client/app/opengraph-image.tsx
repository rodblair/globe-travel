import { ImageResponse } from "next/og";

export const alt = "Globe.travel – plan the trip everyone says yes to";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const INK = "#10202a";
const BONE = "#f6f2e8";
const ROUTE = "#e0583a";

export default function Image() {
  const stops: Array<[number, number]> = [
    [90, 250],
    [200, 150],
    [320, 190],
    [430, 90],
    [520, 170],
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: INK,
          color: BONE,
          fontFamily: "Georgia, serif",
          padding: 72,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
              <g stroke={BONE} strokeWidth="2.4" strokeLinecap="round" fill="none">
                <circle cx="22" cy="26" r="16" />
                <ellipse cx="22" cy="26" rx="6.5" ry="16" />
                <path d="M6 26h32" strokeWidth="1.6" />
              </g>
              <circle cx="37" cy="12" r="6.5" fill={ROUTE} stroke={INK} strokeWidth="3" />
            </svg>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>Globe.travel</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ fontSize: 84, lineHeight: 1, fontWeight: 700, letterSpacing: -3 }}>
              Plan the trip everyone says yes to.
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.35, color: "#b9c2c4", fontFamily: "Arial, sans-serif" }}>
              Mapped itineraries your group can react to.
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 72,
            top: 90,
            width: 440,
            height: 450,
            display: "flex",
            background: BONE,
            borderRadius: 6,
            padding: 20,
          }}
        >
          <svg width="400" height="410" viewBox="0 0 600 600">
            <rect width="600" height="600" fill="#cfdadb" />
            <path
              d="M70 330 C60 180 220 60 360 90 C500 120 560 260 500 400 C450 520 280 560 170 500 C100 460 75 400 70 330Z"
              fill="#faf7ee"
              stroke="#10202a"
              strokeWidth="2.5"
            />
            <path
              d="M150 330 C145 220 250 150 350 175 C440 200 470 290 430 380 C395 450 270 470 205 430 C170 405 152 370 150 330Z"
              fill="none"
              stroke="#10202a"
              strokeOpacity="0.28"
              strokeWidth="2"
            />
            <polyline
              points={stops.map(([x, y]) => `${x + 20},${y + 180}`).join(" ")}
              fill="none"
              stroke={ROUTE}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="2 14"
            />
            {stops.map(([x, y], i) => (
              <g key={i}>
                <circle cx={x + 20} cy={y + 180} r="22" fill="#faf7ee" stroke="#10202a" strokeWidth="3" />
                <circle cx={x + 20} cy={y + 180} r="15" fill={ROUTE} />
              </g>
            ))}
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
