import { ImageResponse } from "next/og";

export const alt = "Globe.travel group trip planning preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f6f1e6",
          color: "#0c1f33",
          fontFamily: "Inter, Arial, sans-serif",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "2px solid rgba(12, 31, 51, 0.14)",
            background: "#fdfaf2",
            padding: 56,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  background: "#0c1f33",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f6f1e6",
                  fontSize: 30,
                  fontWeight: 700,
                }}
              >
                G
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>Globe.travel</div>
            </div>
            <div style={{ color: "#7c5824", fontSize: 24, fontWeight: 700 }}>
              Group trip maps
            </div>
          </div>

          <div style={{ display: "flex", gap: 36, alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 22, width: 610 }}>
              <div style={{ fontSize: 62, lineHeight: 0.98, fontWeight: 850, letterSpacing: -1 }}>
                Plan trips everyone can say yes to
              </div>
              <div style={{ color: "#2a3d51", fontSize: 30, lineHeight: 1.28 }}>
                Build a city itinerary, see it on the map, and share it for fast friend feedback.
              </div>
            </div>

            <div
              style={{
                width: 300,
                height: 288,
                display: "flex",
                flexDirection: "column",
                gap: 18,
                background: "#ede6d4",
                padding: 28,
                border: "1px solid rgba(12, 31, 51, 0.16)",
              }}
            >
              {["Morning neighborhood walk", "Lunch near the market", "Sunset viewpoint"].map((label, index) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    color: "#0c1f33",
                  fontSize: 21,
                    fontWeight: 700,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      background: index === 1 ? "#5a9aa8" : "#7c5824",
                      color: "#f6f1e6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    {index + 1}
                  </div>
                  <span>{label}</span>
                </div>
              ))}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#596879",
                  fontSize: 22,
                  borderTop: "1px solid rgba(12, 31, 51, 0.12)",
                  marginTop: 10,
                  paddingTop: 18,
                }}
              >
                Map, notes, and votes together
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
