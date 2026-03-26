(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/globes/LandingGlobe.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LandingGlobe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.module.js [app-client] (ecmascript) <locals>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const vertexShader = `
  uniform sampler2D bumpTexture;
  uniform float bumpScale;

  varying vec2 vUv;
  varying float vDisplacement;

  void main() {
    vUv = uv;
    vec3 sphereNormal = normalize(position);
    vec4 bumpData = texture2D(bumpTexture, uv);
    vDisplacement = bumpData.r;
    float displacement = bumpData.r * bumpScale;
    vec3 newPosition = position + sphereNormal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    gl_PointSize = 1.4;
  }
`;
const fragmentShader = `
  uniform sampler2D rainbowTexture;
  uniform sampler2D specTexture;

  varying vec2 vUv;
  varying float vDisplacement;

  void main() {
    vec4 rainbow = texture2D(rainbowTexture, vUv);
    vec4 spec = texture2D(specTexture, vUv);
    float isLand = 1.0 - spec.r;

    vec3 landColor = vec3(0.15, 0.35, 0.2) + rainbow.rgb * 0.3 * (0.7 + vDisplacement * 0.5);
    vec3 oceanColor = vec3(0.04, 0.07, 0.15);

    vec3 finalColor = mix(oceanColor, landColor, isLand);
    float alpha = mix(0.15, 1.0, isLand);

    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
function LandingGlobe() {
    _s();
    const mountRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LandingGlobe.useEffect": ()=>{
            if (!mountRef.current) return;
            const mountNode = mountRef.current;
            const scene = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scene"]();
            const camera = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerspectiveCamera"](45, mountNode.clientWidth / mountNode.clientHeight, 0.1, 1000);
            const getCameraZ = {
                "LandingGlobe.useEffect.getCameraZ": ()=>{
                    const width = mountNode.clientWidth;
                    if (width < 400) return 9.0;
                    if (width < 480) return 8.0;
                    if (width < 768) return 7.0;
                    if (width < 1024) return 5.5;
                    return 4.5;
                }
            }["LandingGlobe.useEffect.getCameraZ"];
            camera.position.set(0, 0.3, getCameraZ());
            const renderer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WebGLRenderer"]({
                antialias: true,
                alpha: true
            });
            renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setClearColor(0x000000, 1);
            mountNode.appendChild(renderer.domElement);
            let isDragging = false;
            let previousMousePosition = {
                x: 0,
                y: 0
            };
            let targetRotationY = 0;
            let targetRotationX = 0;
            let currentRotationY = 0;
            let currentRotationX = 0;
            const textureLoader = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextureLoader"]();
            const bumpTexture = textureLoader.load("/texture1.jpg");
            const specTexture = textureLoader.load("/texture2.jpg");
            const rainbowTexture = textureLoader.load("/texture3.jpg");
            const globeGroup = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
            globeGroup.position.set(0, -0.4, 0);
            scene.add(globeGroup);
            camera.lookAt(0, -0.3, 0);
            const radius = 1.3;
            const scale = 1.4;
            const pointsGeo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IcosahedronGeometry"](radius, 160);
            const shaderMaterial = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShaderMaterial"]({
                uniforms: {
                    rainbowTexture: {
                        value: rainbowTexture
                    },
                    bumpTexture: {
                        value: bumpTexture
                    },
                    specTexture: {
                        value: specTexture
                    },
                    bumpScale: {
                        value: 0.04
                    }
                },
                vertexShader,
                fragmentShader,
                transparent: true,
                depthWrite: false
            });
            const pointsMesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Points"](pointsGeo, shaderMaterial);
            pointsMesh.scale.set(scale, scale, scale);
            globeGroup.add(pointsMesh);
            function animate() {
                if (!isDragging) {
                    targetRotationY += 0.001;
                }
                // Smooth lerp for rotation
                currentRotationY += (targetRotationY - currentRotationY) * 0.05;
                currentRotationX += (targetRotationX - currentRotationX) * 0.05;
                globeGroup.rotation.y = currentRotationY;
                globeGroup.rotation.x = currentRotationX;
                renderer.render(scene, camera);
                requestAnimationFrame(animate);
            }
            animate();
            function onMouseMove(evt) {
                if (isDragging) {
                    const deltaX = evt.clientX - previousMousePosition.x;
                    const deltaY = evt.clientY - previousMousePosition.y;
                    targetRotationY += deltaX * 0.005;
                    targetRotationX += deltaY * 0.005;
                    previousMousePosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                }
            }
            function onMouseDown(evt) {
                isDragging = true;
                previousMousePosition = {
                    x: evt.clientX,
                    y: evt.clientY
                };
                if (mountNode) mountNode.style.cursor = "grabbing";
            }
            function onMouseUp() {
                isDragging = false;
                if (mountNode) mountNode.style.cursor = "grab";
            }
            function onTouchStart(evt) {
                if (evt.touches.length === 1) {
                    isDragging = true;
                    previousMousePosition = {
                        x: evt.touches[0].clientX,
                        y: evt.touches[0].clientY
                    };
                }
            }
            function onTouchMove(evt) {
                if (isDragging && evt.touches.length === 1) {
                    const deltaX = evt.touches[0].clientX - previousMousePosition.x;
                    const deltaY = evt.touches[0].clientY - previousMousePosition.y;
                    targetRotationY += deltaX * 0.005;
                    targetRotationX += deltaY * 0.005;
                    previousMousePosition = {
                        x: evt.touches[0].clientX,
                        y: evt.touches[0].clientY
                    };
                }
            }
            function onTouchEnd() {
                isDragging = false;
            }
            function onResize() {
                if (!mountNode) return;
                camera.aspect = mountNode.clientWidth / mountNode.clientHeight;
                camera.position.z = getCameraZ();
                camera.updateProjectionMatrix();
                renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
            }
            mountNode.style.cursor = "grab";
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mousedown", onMouseDown);
            window.addEventListener("mouseup", onMouseUp);
            window.addEventListener("touchstart", onTouchStart);
            window.addEventListener("touchmove", onTouchMove);
            window.addEventListener("touchend", onTouchEnd);
            window.addEventListener("resize", onResize);
            return ({
                "LandingGlobe.useEffect": ()=>{
                    window.removeEventListener("mousemove", onMouseMove);
                    window.removeEventListener("mousedown", onMouseDown);
                    window.removeEventListener("mouseup", onMouseUp);
                    window.removeEventListener("touchstart", onTouchStart);
                    window.removeEventListener("touchmove", onTouchMove);
                    window.removeEventListener("touchend", onTouchEnd);
                    window.removeEventListener("resize", onResize);
                    if (mountNode.contains(renderer.domElement)) {
                        mountNode.style.cursor = "default";
                        mountNode.removeChild(renderer.domElement);
                    }
                    renderer.dispose();
                }
            })["LandingGlobe.useEffect"];
        }
    }["LandingGlobe.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: mountRef,
        style: {
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0
        }
    }, void 0, false, {
        fileName: "[project]/components/globes/LandingGlobe.tsx",
        lineNumber: 228,
        columnNumber: 5
    }, this);
}
_s(LandingGlobe, "V9/qkEdV8GfsDZk7lMTA1T8g5Ps=");
_c = LandingGlobe;
var _c;
__turbopack_context__.k.register(_c, "LandingGlobe");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/globes/LandingGlobe.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/globes/LandingGlobe.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=components_globes_LandingGlobe_tsx_b3ff2ab9._.js.map