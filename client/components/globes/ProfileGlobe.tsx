"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Pin = {
  latitude: number;
  longitude: number;
  status: "visited" | "bucket_list";
  name: string;
};

type ProfileGlobeProps = {
  pins?: Pin[];
  className?: string;
  onPinClick?: (pin: Pin, event: MouseEvent) => void;
  flyToRef?: React.MutableRefObject<((lat: number, lng: number, zoom?: number) => void) | null>;
};

export default function ProfileGlobe({
  pins = [],
  className,
  onPinClick,
  flyToRef,
}: ProfileGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const pinsRef = useRef(pins);
  pinsRef.current = pins;
  const onPinClickRef = useRef(onPinClick);
  onPinClickRef.current = onPinClick;

  // Spin globe
  const spinEnabled = useRef(true);
  const userInteracting = useRef(false);

  const spinGlobe = useCallback(() => {
    const map = mapRef.current;
    if (!map || userInteracting.current || !spinEnabled.current) return;
    const center = map.getCenter();
    center.lng -= 0.2;
    map.easeTo({ center, duration: 1000, easing: (n) => n });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Inject pulse animation CSS
    if (!document.getElementById("pin-pulse-css")) {
      const style = document.createElement("style");
      style.id = "pin-pulse-css";
      style.textContent = `@keyframes pin-pulse { 0% { transform:scale(1);opacity:0.6; } 100% { transform:scale(2.5);opacity:0; } }`;
      document.head.appendChild(style);
    }

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/standard",
      config: {
        basemap: {
          lightPreset: "night",
          showPointOfInterestLabels: false,
          showTransitLabels: false,
          showPlaceLabels: false,
          showRoadLabels: false,
        },
      },
      projection: "globe",
      zoom: 1.5,
      center: [20, 30],
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("style.load", () => {
      // Try setting config properties after style loads
      try {
        map.setConfigProperty("basemap", "lightPreset", "night");
        map.setConfigProperty("basemap", "showPlaceLabels", false);
        map.setConfigProperty("basemap", "showPointOfInterestLabels", false);
        map.setConfigProperty("basemap", "showTransitLabels", false);
        map.setConfigProperty("basemap", "showRoadLabels", false);
      } catch (e) {
        // Fallback if Standard config API not available
      }
      map.setFog({
        color: "rgb(8, 8, 14)",
        "high-color": "rgb(15, 18, 40)",
        "horizon-blend": 0.04,
        "space-color": "rgb(4, 4, 10)",
        "star-intensity": 0.3,
      });
    });

    // Spin logic
    map.on("mousedown", () => { userInteracting.current = true; });
    map.on("dragstart", () => { userInteracting.current = true; });
    map.on("mouseup", () => {
      userInteracting.current = false;
      spinGlobe();
    });
    map.on("touchstart", () => { userInteracting.current = true; });
    map.on("touchend", () => {
      userInteracting.current = false;
      spinGlobe();
    });
    map.on("moveend", () => {
      if (!userInteracting.current) spinGlobe();
    });

    map.on("load", () => {
      spinGlobe();
      updateMarkers();

      // Expose flyTo for parent control
      if (flyToRef) {
        flyToRef.current = (lat: number, lng: number, zoom = 5) => {
          userInteracting.current = true;
          map.flyTo({
            center: [lng, lat],
            zoom,
            duration: 2000,
            essential: true,
          });
          setTimeout(() => {
            userInteracting.current = false;
          }, 3000);
        };
      }
    });

    // Update label visibility based on zoom
    function updateLabelVisibility() {
      const zoom = map.getZoom();
      const showLabels = zoom > 2.5;
      markersRef.current.forEach((m) => {
        const el = m.getElement();
        const label = el?.querySelector(".pin-label") as HTMLElement;
        if (label) {
          label.style.opacity = showLabels ? "1" : "0";
        }
      });
    }
    map.on("zoom", updateLabelVisibility);

    function updateMarkers() {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      pinsRef.current.forEach((pin) => {
        const isVisited = pin.status === "visited";
        const color = isVisited ? "#F59E0B" : "#06B6D4";

        const el = document.createElement("div");
        el.style.cssText = "cursor:pointer;";
        el.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
            <div class="pin-label" style="
              font-size:10px;font-weight:500;letter-spacing:0.02em;
              font-family:Inter,system-ui,sans-serif;
              color:rgba(255,255,255,0.85);
              text-shadow:0 1px 6px rgba(0,0,0,0.9),0 0 3px rgba(0,0,0,0.8);
              white-space:nowrap;opacity:0;transition:opacity 0.3s;
            ">${pin.name}</div>
            <div style="position:relative;width:18px;height:18px;display:flex;align-items:center;justify-content:center;">
              <div style="
                position:absolute;width:18px;height:18px;border-radius:50%;
                background:${color}20;
                animation:pin-pulse 2.5s ease-out infinite;
              "></div>
              <div style="
                width:10px;height:10px;border-radius:50%;
                background:${color};
                border:2px solid rgba(255,255,255,0.95);
                box-shadow:0 0 10px ${color}60, 0 2px 6px rgba(0,0,0,0.4);
                position:relative;z-index:1;
              "></div>
            </div>
          </div>
        `;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onPinClickRef.current?.(pin, e as MouseEvent);

          // Fly to pin
          mapRef.current?.flyTo({
            center: [pin.longitude, pin.latitude],
            zoom: 4,
            duration: 1200,
          });
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([pin.longitude, pin.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    return () => {
      spinEnabled.current = false;
      markersRef.current.forEach((m) => m.remove());
      map.remove();
    };
  }, [spinGlobe]);

  // Update markers when pins change
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.loaded()) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    pins.forEach((pin) => {
      const isVisited = pin.status === "visited";
      const color = isVisited ? "#F59E0B" : "#06B6D4";

      const el = document.createElement("div");
      el.style.cssText = "cursor:pointer;";
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <div style="
            font-size:10px;font-weight:500;letter-spacing:0.02em;
            font-family:Inter,system-ui,sans-serif;
            color:rgba(255,255,255,0.8);
            text-shadow:0 1px 6px rgba(0,0,0,0.9),0 0 3px rgba(0,0,0,0.8);
            white-space:nowrap;
          ">${pin.name}</div>
          <div style="
            width:8px;height:8px;border-radius:50%;
            background:${color};
            border:1.5px solid rgba(255,255,255,0.9);
            box-shadow:0 0 6px ${color}40;
          "></div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onPinClickRef.current?.(pin, e as MouseEvent);
        mapRef.current?.flyTo({
          center: [pin.longitude, pin.latitude],
          zoom: 4,
          duration: 1200,
        });
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [pins]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", position: "relative" }}
    />
  );
}
