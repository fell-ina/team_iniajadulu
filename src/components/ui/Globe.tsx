"use client";

import { useEffect, useRef, useState } from "react";
import { Color, Fog, Group, PerspectiveCamera, Scene, Vector3 } from "three";
import ThreeGlobe from "three-globe";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

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

export function Globe({ globeConfig, data }: WorldProps) {
  const globeRef = useRef<ThreeGlobe | null>(null);
  const groupRef = useRef<Group>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [countryFeatures, setCountryFeatures] = useState<object[]>([]);

  const config = {
    pointSize: 1,
    atmosphereColor: "#ffffff",
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,255,0.7)",
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
      globeRef.current = new ThreeGlobe();
      groupRef.current.add(globeRef.current);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    fetch("/data/world-countries.geojson")
      .then((response) => response.json())
      .then((geoJson: { features?: object[] }) => {
        setCountryFeatures(geoJson.features ?? []);
      })
      .catch(() => setCountryFeatures([]));
  }, []);

  useEffect(() => {
    if (!globeRef.current || !isInitialized) return;

    const material = globeRef.current.globeMaterial() as unknown as {
      color: Color;
      emissive: Color;
      emissiveIntensity: number;
      shininess: number;
    };
    material.color = new Color(config.globeColor);
    material.emissive = new Color(config.emissive);
    material.emissiveIntensity = config.emissiveIntensity ?? 0.1;
    material.shininess = config.shininess ?? 0.9;
  }, [config.emissive, config.emissiveIntensity, config.globeColor, config.shininess, isInitialized]);

  useEffect(() => {
    if (!globeRef.current || !isInitialized) return;

    const points = data.flatMap((arc) => [
      { size: config.pointSize, order: arc.order, color: arc.color, lat: arc.startLat, lng: arc.startLng },
      { size: config.pointSize, order: arc.order, color: arc.color, lat: arc.endLat, lng: arc.endLng },
    ]);
    const filteredPoints = points.filter(
      (point, index, all) =>
        all.findIndex((other) => other.lat === point.lat && other.lng === point.lng) === index,
    );

    globeRef.current
      .hexPolygonsData(countryFeatures)
      .showAtmosphere(config.showAtmosphere)
      .atmosphereColor(config.atmosphereColor)
      .atmosphereAltitude(config.atmosphereAltitude)
      .hexPolygonColor(() => config.polygonColor);

    globeRef.current
      .arcsData(data)
      .arcStartLat((arc) => (arc as Position).startLat)
      .arcStartLng((arc) => (arc as Position).startLng)
      .arcEndLat((arc) => (arc as Position).endLat)
      .arcEndLng((arc) => (arc as Position).endLng)
      .arcColor((arc: unknown) => (arc as Position).color)
      .arcAltitude((arc: unknown) => (arc as Position).arcAlt)
      .arcStroke(() => 0.35)
      .arcDashLength(config.arcLength)
      .arcDashInitialGap((arc: unknown) => (arc as Position).order)
      .arcDashGap(15)
      .arcDashAnimateTime(() => config.arcTime);

    globeRef.current
      .pointsData(filteredPoints)
      .pointColor((point) => (point as { color: string }).color)
      .pointsMerge(true)
      .pointAltitude(0)
      .pointRadius(2);

    globeRef.current
      .ringsData([])
      .ringColor(() => config.polygonColor)
      .ringMaxRadius(config.maxRings)
      .ringPropagationSpeed(RING_PROPAGATION_SPEED)
      .ringRepeatPeriod((config.arcTime * config.arcLength) / (config.rings || 1));
  }, [config, countryFeatures, data, isInitialized]);

  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data.length) return;

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
  }, [data, isInitialized]);

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

  return (
    <Canvas scene={scene} camera={new PerspectiveCamera(50, 1.2, 180, 1800)}>
      <RendererConfig />
      <ambientLight color={globeConfig.ambientLight} intensity={0.6} />
      <directionalLight color={globeConfig.directionalLeftLight} position={new Vector3(-400, 100, 400)} />
      <directionalLight color={globeConfig.directionalTopLight} position={new Vector3(-200, 500, 200)} />
      <pointLight color={globeConfig.pointLight} position={new Vector3(-200, 500, 200)} intensity={0.8} />
      <Globe globeConfig={globeConfig} data={data} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
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
