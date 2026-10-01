import { ImageResponse } from "next/og";

export const alt = "Globe.travel – plan the trip everyone says yes to";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const stops = [
  { label: "Acropolis at sunrise", time: "09:00" },
  { label: "Lunch in Plaka", time: "13:00" },
  { label: "Sunset on Filopappou", time: "19:30" },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #f4f7ff 0%, #ffffff 55%, #fff4e0 100%)",
          color: "#101a3a",
          fontFamily: "Inter, Arial, sans-serif",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="16" fill="#3358e0" />
            <g fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round">
              <circle cx="32" cy="33" r="17" />
              <ellipse cx="32" cy="33" rx="7.5" ry="17" />
              <path d="M15 33h34" />
            </g>
            <circle cx="46" cy="18" r="6.2" fill="#ffb84d" stroke="#3358e0" strokeWidth="3" />
          </svg>
          <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>Globe.travel</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 640 }}>
            <div style={{ fontSize: 76, lineHeight: 1.02, fontWeight: 800, letterSpacing: -3 }}>
              Plan the trip everyone says yes to.
            </div>
            <div style={{ fontSize: 30, lineHeight: 1.3, color: "#4a5578" }}>
              AI itineraries on a map. Share a link, collect votes, lock it in.
            </div>
          </div>

          <div
            style={{
              width: 380,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              background: "#ffffff",
              borderRadius: 28,
              padding: 28,
              border: "1px solid #e3e8f5",
              boxShadow: "0 24px 48px -12px rgba(16,26,58,0.18)",
            }}
          >
            {stops.map((stop, index) => (
              <div key={stop.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    background: "#3358e0",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 22, fontWeight: 600 }}>{stop.label}</div>
                  <div style={{ fontSize: 17, color: "#6b7599" }}>{stop.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
