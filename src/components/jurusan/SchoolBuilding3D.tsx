"use client";

import { Canvas, useThree } from "@react-three/fiber";
import {
  CameraControls,
  Environment,
  useGLTF,
  Center,
} from "@react-three/drei";

import { Suspense, useEffect, useRef } from "react";
type Props = {
  model: string;
};

const cameraPosition: [number, number, number] = [0, 6.2, 27];
const cameraTarget: [number, number, number] = [0, 3, 0];

function Building({ model }: { model: string }) {
  const { scene } = useGLTF(model);

  return (
    <Center>
      <primitive object={scene} scale={1} position={[0, 0, 0]} />
    </Center>
  );
}

function CameraRig() {
  const controls = useRef<any>(null);
  const { size } = useThree();

  useEffect(() => {
    const mobile = size.width < 640;

    controls.current?.setLookAt(
      mobile ? 0 : 0,
      mobile ? 5.5 : 6.2,
      mobile ? 31 : 27,
      0,
      mobile ? 2.8 : 3,
      0,
      true,
    );
  }, [size.width]);

  return (
    <CameraControls
      ref={controls}
      enabled
      smoothTime={0.7}
      minDistance={14}
      maxDistance={38}
      minPolarAngle={Math.PI * 0.22}
      maxPolarAngle={Math.PI * 0.52}
      azimuthRotateSpeed={0.7}
      polarRotateSpeed={0.45}
      dollyToCursor={false}
    />
  );
}

export default function SchoolBuilding3D({ model }: Props) {
  return (
    <div className="building-3d-mask relative mx-auto h-[430px] w-full max-w-[1100px] sm:h-[540px] lg:h-[680px]">
      <Canvas
        camera={{
          position: cameraPosition,
          fov: 38,
        }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <ambientLight intensity={1.5} />

        <directionalLight position={[8, 14, 12]} intensity={2.8} />

        <directionalLight position={[-12, 7, -8]} intensity={1.2} />

        <Suspense fallback={null}>
          <Building model={model} />

          <Environment preset="city" environmentIntensity={0.4} />
        </Suspense>

        <CameraRig />
      </Canvas>

      {/* Soft fade supaya tepi model menyatu dengan background */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(2,16,36,.18)_68%,#021024_100%)]
        "
      />

      {/* Petunjuk interaksi */}
      <div
        className="
          pointer-events-none
          absolute
          bottom-5
          left-1/2
          -translate-x-1/2
          rounded-full
          border
          border-white/10
          bg-[#021024]/55
          px-4
          py-2
          text-[9px]
          font-bold
          uppercase
          tracking-[.2em]
          text-white/35
          backdrop-blur-md
        "
      >
        Drag untuk memutar model
      </div>
    </div>
  );
}
