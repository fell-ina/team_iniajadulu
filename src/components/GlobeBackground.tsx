"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import type { GlobeConfig } from "./ui/Globe";

// World is already client-only; keep it on client but allow Next to defer code fetch.
const World = dynamic(() => import("./ui/Globe").then((module) => module.World), {
  ssr: false,
  loading: () => null,
});

const globeConfig: GlobeConfig = {
  pointSize: 1.4,
  globeColor: "#0b3168",
  showAtmosphere: true,
  atmosphereColor: "#c1e8ff",
  atmosphereAltitude: 0.12,
  emissive: "#052659",
  emissiveIntensity: 0.2,
  shininess: 0.9,
  polygonColor: "rgba(193,232,255,0.7)",
  ambientLight: "#38bdf8",
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 1800,
  arcLength: 0.85,
  rings: 1,
  maxRings: 3,
};

const globeArcs = [
  { order: 1, startLat: -6.2088, startLng: 106.8456, endLat: 1.3521, endLng: 103.8198, arcAlt: 0.2, color: "#22d3ee" },
  { order: 1, startLat: -6.2088, startLng: 106.8456, endLat: 35.6762, endLng: 139.6503, arcAlt: 0.3, color: "#60a5fa" },
  { order: 2, startLat: -6.2088, startLng: 106.8456, endLat: 51.5072, endLng: -0.1276, arcAlt: 0.5, color: "#818cf8" },
  { order: 2, startLat: 1.3521, startLng: 103.8198, endLat: 40.7128, endLng: -74.006, arcAlt: 0.5, color: "#22d3ee" },
  { order: 3, startLat: 35.6762, startLng: 139.6503, endLat: 37.5665, endLng: 126.978, arcAlt: 0.1, color: "#60a5fa" },
  { order: 3, startLat: 51.5072, startLng: -0.1276, endLat: 48.8566, endLng: 2.3522, arcAlt: 0.1, color: "#818cf8" },
  { order: 4, startLat: -6.2088, startLng: 106.8456, endLat: -33.8688, endLng: 151.2093, arcAlt: 0.3, color: "#22d3ee" },
  { order: 4, startLat: 40.7128, startLng: -74.006, endLat: 34.0522, endLng: -118.2437, arcAlt: 0.2, color: "#60a5fa" },
  { order: 5, startLat: 30.0444, startLng: 31.2357, endLat: 41.0082, endLng: 28.9784, arcAlt: 0.2, color: "#22d3ee" },
  { order: 5, startLat: 14.7167, startLng: -17.4677, endLat: 48.8566, endLng: 2.3522, arcAlt: 0.35, color: "#818cf8" },
  { order: 5, startLat: 6.5244, startLng: 3.3792, endLat: 51.5072, endLng: -0.1276, arcAlt: 0.45, color: "#60a5fa" },
  { order: 6, startLat: 0.3476, startLng: 32.5825, endLat: 25.2048, endLng: 55.2708, arcAlt: 0.3, color: "#22d3ee" },
  { order: 6, startLat: -1.2921, startLng: 36.8219, endLat: 28.6139, endLng: 77.209, arcAlt: 0.45, color: "#60a5fa" },
  { order: 6, startLat: -6.7924, startLng: 39.2083, endLat: 1.3521, endLng: 103.8198, arcAlt: 0.4, color: "#818cf8" },
  { order: 7, startLat: -26.2041, startLng: 28.0473, endLat: 35.6762, endLng: 139.6503, arcAlt: 0.6, color: "#22d3ee" },
  { order: 7, startLat: -33.9249, startLng: 18.4241, endLat: 40.7128, endLng: -74.006, arcAlt: 0.7, color: "#60a5fa" },
  { order: 8, startLat: -4.4419, startLng: 15.2663, endLat: -23.5505, endLng: -46.6333, arcAlt: 0.45, color: "#818cf8" },
  { order: 8, startLat: 5.6037, startLng: -0.187, endLat: 19.4326, endLng: -99.1332, arcAlt: 0.65, color: "#22d3ee" },
  { order: 9, startLat: 33.5731, startLng: -7.5898, endLat: 40.4168, endLng: -3.7038, arcAlt: 0.2, color: "#60a5fa" },
];

export default function GlobeBackground() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.04 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      className="absolute inset-0"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,38,89,.35),rgba(2,16,36,.98)_72%)]" />
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[840px] w-[1080px] -translate-x-1/2 opacity-90 sm:-top-64 sm:h-[1100px] sm:w-[1450px] lg:left-[42%]">
        <World data={globeArcs} globeConfig={globeConfig} />
      </div>
    </motion.div>
  );
}
