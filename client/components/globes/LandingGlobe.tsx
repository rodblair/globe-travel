"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

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

export default function LandingGlobe() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const mountNode = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      mountNode.clientWidth / mountNode.clientHeight,
      0.1,
      1000,
    );

    const getCameraZ = () => {
      const width = mountNode.clientWidth;
      if (width < 400) return 9.0;
      if (width < 480) return 8.0;
      if (width < 768) return 7.0;
      if (width < 1024) return 5.5;
      return 4.5;
    };

    camera.position.set(0, 0.3, getCameraZ());

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);

    mountNode.appendChild(renderer.domElement);

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationY = 0;
    let targetRotationX = 0;
    let currentRotationY = 0;
    let currentRotationX = 0;

    const textureLoader = new THREE.TextureLoader();
    const bumpTexture = textureLoader.load("/texture1.jpg");
    const specTexture = textureLoader.load("/texture2.jpg");
    const rainbowTexture = textureLoader.load("/texture3.jpg");

    const globeGroup = new THREE.Group();
    globeGroup.position.set(0, -0.4, 0);
    scene.add(globeGroup);

    camera.lookAt(0, -0.3, 0);

    const radius = 1.3;
    const scale = 1.4;

    const pointsGeo = new THREE.IcosahedronGeometry(radius, 160);
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        rainbowTexture: { value: rainbowTexture },
        bumpTexture: { value: bumpTexture },
        specTexture: { value: specTexture },
        bumpScale: { value: 0.04 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });

    const pointsMesh = new THREE.Points(pointsGeo, shaderMaterial);
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

    function onMouseMove(evt: MouseEvent) {
      if (isDragging) {
        const deltaX = evt.clientX - previousMousePosition.x;
        const deltaY = evt.clientY - previousMousePosition.y;

        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;

        previousMousePosition = { x: evt.clientX, y: evt.clientY };
      }
    }

    function onMouseDown(evt: MouseEvent) {
      isDragging = true;
      previousMousePosition = { x: evt.clientX, y: evt.clientY };
      if (mountNode) mountNode.style.cursor = "grabbing";
    }

    function onMouseUp() {
      isDragging = false;
      if (mountNode) mountNode.style.cursor = "grab";
    }

    function onTouchStart(evt: TouchEvent) {
      if (evt.touches.length === 1) {
        isDragging = true;
        previousMousePosition = {
          x: evt.touches[0].clientX,
          y: evt.touches[0].clientY,
        };
      }
    }

    function onTouchMove(evt: TouchEvent) {
      if (isDragging && evt.touches.length === 1) {
        const deltaX = evt.touches[0].clientX - previousMousePosition.x;
        const deltaY = evt.touches[0].clientY - previousMousePosition.y;

        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;

        previousMousePosition = {
          x: evt.touches[0].clientX,
          y: evt.touches[0].clientY,
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

    return () => {
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
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    />
  );
}
