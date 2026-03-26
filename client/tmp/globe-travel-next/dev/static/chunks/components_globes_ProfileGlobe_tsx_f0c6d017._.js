(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/globes/ProfileGlobe.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProfileGlobe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/mapbox-gl/dist/mapbox-gl.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function ProfileGlobe({ pins = [], className, onPinClick, flyToRef }) {
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const markersRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const pinsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(pins);
    const onPinClickRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(onPinClick);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProfileGlobe.useEffect": ()=>{
            pinsRef.current = pins;
        }
    }["ProfileGlobe.useEffect"], [
        pins
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProfileGlobe.useEffect": ()=>{
            onPinClickRef.current = onPinClick;
        }
    }["ProfileGlobe.useEffect"], [
        onPinClick
    ]);
    // Spin globe
    const spinEnabled = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(true);
    const userInteracting = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const spinGlobe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ProfileGlobe.useCallback[spinGlobe]": ()=>{
            const map = mapRef.current;
            if (!map || userInteracting.current || !spinEnabled.current) return;
            const center = map.getCenter();
            center.lng -= 0.2;
            map.easeTo({
                center,
                duration: 1000,
                easing: {
                    "ProfileGlobe.useCallback[spinGlobe]": (n)=>n
                }["ProfileGlobe.useCallback[spinGlobe]"]
            });
        }
    }["ProfileGlobe.useCallback[spinGlobe]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProfileGlobe.useEffect": ()=>{
            if (!containerRef.current) return;
            // Inject pulse animation CSS
            if (!document.getElementById("pin-pulse-css")) {
                const style = document.createElement("style");
                style.id = "pin-pulse-css";
                style.textContent = `@keyframes pin-pulse { 0% { transform:scale(1);opacity:0.6; } 100% { transform:scale(2.5);opacity:0; } }`;
                document.head.appendChild(style);
            }
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].accessToken = ("TURBOPACK compile-time value", "pk.eyJ1Ijoid2lsbDA3MDgiLCJhIjoiY21tcno5dXAxMWZmNjJxcTY3NDNvNGZhbSJ9.k-9ORP8DXlW-ljJVHAn08g");
            const map = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Map({
                container: containerRef.current,
                style: "mapbox://styles/mapbox/standard",
                config: {
                    basemap: {
                        lightPreset: "night",
                        showPointOfInterestLabels: false,
                        showTransitLabels: false,
                        showPlaceLabels: false,
                        showRoadLabels: false
                    }
                },
                projection: "globe",
                zoom: 1.5,
                center: [
                    20,
                    30
                ],
                attributionControl: false
            });
            mapRef.current = map;
            map.on("style.load", {
                "ProfileGlobe.useEffect": ()=>{
                    // Try setting config properties after style loads
                    try {
                        map.setConfigProperty("basemap", "lightPreset", "night");
                        map.setConfigProperty("basemap", "showPlaceLabels", false);
                        map.setConfigProperty("basemap", "showPointOfInterestLabels", false);
                        map.setConfigProperty("basemap", "showTransitLabels", false);
                        map.setConfigProperty("basemap", "showRoadLabels", false);
                    } catch  {
                    // Fallback if Standard config API not available
                    }
                    map.setFog({
                        color: "rgb(8, 8, 14)",
                        "high-color": "rgb(15, 18, 40)",
                        "horizon-blend": 0.04,
                        "space-color": "rgb(4, 4, 10)",
                        "star-intensity": 0.3
                    });
                }
            }["ProfileGlobe.useEffect"]);
            // Spin logic
            map.on("mousedown", {
                "ProfileGlobe.useEffect": ()=>{
                    userInteracting.current = true;
                }
            }["ProfileGlobe.useEffect"]);
            map.on("dragstart", {
                "ProfileGlobe.useEffect": ()=>{
                    userInteracting.current = true;
                }
            }["ProfileGlobe.useEffect"]);
            map.on("mouseup", {
                "ProfileGlobe.useEffect": ()=>{
                    userInteracting.current = false;
                    spinGlobe();
                }
            }["ProfileGlobe.useEffect"]);
            map.on("touchstart", {
                "ProfileGlobe.useEffect": ()=>{
                    userInteracting.current = true;
                }
            }["ProfileGlobe.useEffect"]);
            map.on("touchend", {
                "ProfileGlobe.useEffect": ()=>{
                    userInteracting.current = false;
                    spinGlobe();
                }
            }["ProfileGlobe.useEffect"]);
            map.on("moveend", {
                "ProfileGlobe.useEffect": ()=>{
                    if (!userInteracting.current) spinGlobe();
                }
            }["ProfileGlobe.useEffect"]);
            map.on("load", {
                "ProfileGlobe.useEffect": ()=>{
                    spinGlobe();
                    updateMarkers();
                    // Expose flyTo for parent control
                    if (flyToRef) {
                        flyToRef.current = ({
                            "ProfileGlobe.useEffect": (lat, lng, zoom = 5)=>{
                                userInteracting.current = true;
                                map.flyTo({
                                    center: [
                                        lng,
                                        lat
                                    ],
                                    zoom,
                                    duration: 2000,
                                    essential: true
                                });
                                setTimeout({
                                    "ProfileGlobe.useEffect": ()=>{
                                        userInteracting.current = false;
                                    }
                                }["ProfileGlobe.useEffect"], 3000);
                            }
                        })["ProfileGlobe.useEffect"];
                    }
                }
            }["ProfileGlobe.useEffect"]);
            // Update label visibility based on zoom
            function updateLabelVisibility() {
                const zoom = map.getZoom();
                const showLabels = zoom > 2.5;
                markersRef.current.forEach({
                    "ProfileGlobe.useEffect.updateLabelVisibility": (m)=>{
                        const el = m.getElement();
                        const label = el?.querySelector(".pin-label");
                        if (label) {
                            label.style.opacity = showLabels ? "1" : "0";
                        }
                    }
                }["ProfileGlobe.useEffect.updateLabelVisibility"]);
            }
            map.on("zoom", updateLabelVisibility);
            function updateMarkers() {
                markersRef.current.forEach({
                    "ProfileGlobe.useEffect.updateMarkers": (m)=>m.remove()
                }["ProfileGlobe.useEffect.updateMarkers"]);
                markersRef.current = [];
                pinsRef.current.forEach({
                    "ProfileGlobe.useEffect.updateMarkers": (pin)=>{
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
                        el.addEventListener("click", {
                            "ProfileGlobe.useEffect.updateMarkers": (e)=>{
                                e.stopPropagation();
                                onPinClickRef.current?.(pin, e);
                                // Fly to pin
                                mapRef.current?.flyTo({
                                    center: [
                                        pin.longitude,
                                        pin.latitude
                                    ],
                                    zoom: 4,
                                    duration: 1200
                                });
                            }
                        }["ProfileGlobe.useEffect.updateMarkers"]);
                        const marker = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Marker({
                            element: el,
                            anchor: "bottom"
                        }).setLngLat([
                            pin.longitude,
                            pin.latitude
                        ]).addTo(map);
                        markersRef.current.push(marker);
                    }
                }["ProfileGlobe.useEffect.updateMarkers"]);
            }
            return ({
                "ProfileGlobe.useEffect": ()=>{
                    spinEnabled.current = false;
                    markersRef.current.forEach({
                        "ProfileGlobe.useEffect": (m)=>m.remove()
                    }["ProfileGlobe.useEffect"]);
                    map.remove();
                }
            })["ProfileGlobe.useEffect"];
        }
    }["ProfileGlobe.useEffect"], [
        flyToRef,
        spinGlobe
    ]);
    // Update markers when pins change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProfileGlobe.useEffect": ()=>{
            if (!mapRef.current || !mapRef.current.loaded()) return;
            markersRef.current.forEach({
                "ProfileGlobe.useEffect": (m)=>m.remove()
            }["ProfileGlobe.useEffect"]);
            markersRef.current = [];
            pins.forEach({
                "ProfileGlobe.useEffect": (pin)=>{
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
                    el.addEventListener("click", {
                        "ProfileGlobe.useEffect": (e)=>{
                            e.stopPropagation();
                            onPinClickRef.current?.(pin, e);
                            mapRef.current?.flyTo({
                                center: [
                                    pin.longitude,
                                    pin.latitude
                                ],
                                zoom: 4,
                                duration: 1200
                            });
                        }
                    }["ProfileGlobe.useEffect"]);
                    const marker = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mapbox$2d$gl$2f$dist$2f$mapbox$2d$gl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Marker({
                        element: el,
                        anchor: "bottom"
                    }).setLngLat([
                        pin.longitude,
                        pin.latitude
                    ]).addTo(mapRef.current);
                    markersRef.current.push(marker);
                }
            }["ProfileGlobe.useEffect"]);
        }
    }["ProfileGlobe.useEffect"], [
        pins
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: className,
        style: {
            width: "100%",
            height: "100%",
            position: "relative"
        }
    }, void 0, false, {
        fileName: "[project]/components/globes/ProfileGlobe.tsx",
        lineNumber: 270,
        columnNumber: 5
    }, this);
}
_s(ProfileGlobe, "BCVQzCHHaYqLGk9zSRAVo5rvrDw=");
_c = ProfileGlobe;
var _c;
__turbopack_context__.k.register(_c, "ProfileGlobe");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/globes/ProfileGlobe.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/globes/ProfileGlobe.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=components_globes_ProfileGlobe_tsx_f0c6d017._.js.map