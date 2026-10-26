"use client";

import { useEffect, useRef, useState } from "react";
import { Color, Fog, Group, PerspectiveCamera, Scene, Vector3 } from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

let ThreeGlobeModule: any = undefined;
function getThreeGlobe() {
  if (typeof window === "undefined") return undefined;
  if (ThreeGlobeModule) return ThreeGlobeModule;
  try {
    // @ts-ignore
    const mod = require("three-globe");
    ThreeGlobeModule = mod.default || mod.ThreeGlobe || mod;
  } catch (e) {
    return undefined;
  }
  return ThreeGlobeModule;
}

const RING_PROPAGATION_SPEED = 3;
const CAMERA_Z = 300;

type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
};

type WorldProps = {
  globeConfig: GlobeConfig;
  data: Position[];
};

const regionalPoints = [
  { lat: 31.2, lng: 29.9, color: "#22d3ee" },
  { lat: 30.0, lng: 31.2, color: "#60a5fa" },
  { lat: 14.7, lng: -17.5, color: "#818cf8" },
  { lat: 9.1, lng: 7.4, color: "#22d3ee" },
  { lat: 6.5, lng: 3.4, color: "#60a5fa" },
  { lat: 0.3, lng: 32.6, color: "#818cf8" },
  { lat: -1.3, lng: 36.8, color: "#22d3ee" },
  { lat: -6.8, lng: 39.3, color: "#60a5fa" },
  { lat: -15.4, lng: 28.3, color: "#818cf8" },
  { lat: -26.2, lng: 28.0, color: "#22d3ee" },
  { lat: -33.9, lng: 18.4, color: "#60a5fa" },
  { lat: 33.6, lng: -7.6, color: "#818cf8" },
  { lat: 5.6, lng: -0.2, color: "#22d3ee" },
  { lat: -4.3, lng: 15.3, color: "#60a5fa" },
];

export function Globe({ globeConfig, data }: WorldProps) {
  const globeRef = useRef<any>(null);
  const groupRef = useRef<Group>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [countryFeatures, setCountryFeatures] = useState<object[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const defaultConfig = {
    pointSize: 1,
    atmosphereColor: "#ffffff",
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,193,0.7)",
    globeColor: "#1d072e",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig,
  };

  useEffect(() => {
    if (!globeRef.current && groupRef.current) {
      const TG = getThreeGlobe();
      if (!TG) return;
      const Ctor = TG.default || TG.ThreeGlobe || TG;
      if (typeof Ctor !== "function") return;
      globeRef.current = new Ctor();
      groupRef.current.add(globeRef.current);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!globeRef.current || !isInitialized) return;
    let cancelled = false;

    fetch("/data/world-countries.geojson")
      .then((r) => r.json())
      .then((geoJson) => {
        if (cancelled) return;
        const features = (geoJson && (geoJson as any).features) ?? [];
        setCountryFeatures(features);
      })
      .catch(() => {
        if (cancelled) return;
        setCountryFeatures([]);
      });

    const material = globeRef.current.globeMaterial() as any;
    material.color = new Color(defaultConfig.globeColor);
    material.emissive = new Color(defaultConfig.emissive);
    material.emissiveIntensity = defaultConfig.emissiveIntensity ?? 0.1;
    material.shininess = defaultConfig.shininess ?? 0.9;

    return () => {
      cancelled = true;
    };
  }, [
    defaultConfig.emissive,
    defaultConfig.emissiveIntensity,
    defaultConfig.globeColor,
    defaultConfig.shininess,
    isInitialized,
  ]);

  useEffect(() => {
    if (!globeRef.current || !isInitialized) return;

    const effectiveData = isMobile ? [] : data;
    const effectiveRegionalPoints = isMobile ? [] : regionalPoints;

    const points = effectiveData
      .flatMap((arc) => [
        {
          size: defaultConfig.pointSize,
          order: arc.order,
          color: arc.color,
          lat: arc.startLat,
          lng: arc.startLng,
        },
        {
          size: defaultConfig.pointSize,
          order: arc.order,
          color: arc.color,
          lat: arc.endLat,
          lng: arc.endLng,
        },
      ])
      .concat(
        effectiveRegionalPoints.map((point, index) => ({
          ...point,
          size: defaultConfig.pointSize,
          order: index + 10,
        })),
      );

    const filteredPoints = points.filter(
      (p, i, all) =>
        all.findIndex((o) => o.lat === p.lat && o.lng === p.lng) === i,
    );

    globeRef.current
      .hexPolygonsData(isMobile ? [] : countryFeatures)
      .showAtmosphere(defaultConfig.showAtmosphere)
      .atmosphereColor(defaultConfig.atmosphereColor)
      .atmosphereAltitude(defaultConfig.atmosphereAltitude)
      .hexPolygonColor(() => defaultConfig.polygonColor);

    globeRef.current
      .pointsData(filteredPoints)
      .pointColor((d: any) => d.color)
      .pointsMerge(true)
      .pointAltitude(0)
      .pointRadius(2);

    globeRef.current
      .arcsData(effectiveData)
      .arcStartLat((d: Position) => d.startLat)
      .arcStartLng((d: Position) => d.startLng)
      .arcEndLat((d: Position) => d.endLat)
      .arcEndLng((d: Position) => d.endLng)
      .arcColor((d: Position) => d.color)
      .arcAltitude((d: Position) => d.arcAlt)
      .arcStroke(() => 0.35)
      .arcDashLength(defaultConfig.arcLength)
      .arcDashInitialGap((d: Position) => d.order)
      .arcDashGap(15)
      .arcDashAnimateTime(() => defaultConfig.arcTime);

    globeRef.current
      .ringsData([])
      .ringColor(() => defaultConfig.polygonColor)
      .ringMaxRadius(defaultConfig.maxRings)
      .ringPropagationSpeed(RING_PROPAGATION_SPEED)
      .ringRepeatPeriod(
        (defaultConfig.arcTime * defaultConfig.arcLength) /
          (defaultConfig.rings ?? 1),
      );
  }, [defaultConfig, countryFeatures, data, isInitialized, isMobile]);

  useEffect(() => {
    if (!globeRef.current || !isInitialized || isMobile || !data.length) return;
    const interval = window.setInterval(() => {
      if (!globeRef.current) return;
      globeRef.current.ringsData(
        data.slice(0, Math.min(data.length, 5)).map((arc) => ({
          lat: arc.startLat,
          lng: arc.startLng,
          color: arc.color,
        })),
      );
    }, 2000);
    return () => window.clearInterval(interval);
  }, [data, isInitialized, isMobile]);

  return <group ref={groupRef} />;
}

function RendererConfig() {
  const { gl, size } = useThree();
  useEffect(() => {
    gl.setPixelRatio(window.devicePixelRatio);
    gl.setSize(size.width, size.height);
    gl.setClearColor(0x000000, 0);
  }, [gl, size.height, size.width]);
  return null;
}

export function World({ globeConfig, data }: WorldProps) {
  const scene = new Scene();
  scene.fog = new Fog(0x021024, 400, 2000);
  const camera = new PerspectiveCamera(50, 1.2, 180, 1800);
  camera.position.set(0, 34, CAMERA_Z);

  return (
    <Canvas scene={scene} camera={camera}>
      <RendererConfig />
      <ambientLight color={globeConfig.ambientLight} intensity={0.6} />
      <directionalLight
        color={globeConfig.directionalLeftLight}
        position={new Vector3(-400, 100, 400)}
      />
      <directionalLight
        color={globeConfig.directionalTopLight}
        position={new Vector3(-200, 500, 200)}
      />
      <pointLight
        color={globeConfig.pointLight}
        position={new Vector3(-200, 500, 200)}
        intensity={0.8}
      />
      <Globe globeConfig={globeConfig} data={data} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
        minDistance={CAMERA_Z}
        maxDistance={CAMERA_Z}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI - Math.PI / 3}
      />
    </Canvas>
  );
}
