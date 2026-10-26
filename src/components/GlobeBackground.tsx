"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import type { GlobeConfig } from "./ui/Globe";

const World = dynamic(() => import("./ui/Globe").then((module) => module.World), {
  ssr: false,
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
      <div className="absolute -top-48 left-1/2 h-[840px] w-[1080px] -translate-x-1/2 opacity-90 sm:-top-64 sm:h-[1100px] sm:w-[1450px] lg:left-[42%]">
        <World data={globeArcs} globeConfig={globeConfig} />
      </div>
    </motion.div>
  );
}
