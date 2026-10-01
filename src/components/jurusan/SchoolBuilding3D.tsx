'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { CameraControls, Environment, useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import type { CameraControls as CameraControlsImpl } from 'camera-controls';

const views = {
  front: { position: [0, 6.2, 27] as [number, number, number], target: [0, 3.0, 0] as [number, number, number] },
  side: { position: [25, 7.0, 2] as [number, number, number], target: [0, 3.0, 0] as [number, number, number] },
  detail: { position: [14, 10.5, 18] as [number, number, number], target: [0, 3.8, 0] as [number, number, number] },
};

type ViewKey = keyof typeof views;

function Building() {
  const { scene } = useGLTF('/models/gedung_lowpoly_v2.glb');
  return <primitive object={scene} scale={1.05} position={[0, 0, 0]} />;
}

function CameraRig({ active }: { active: ViewKey }) {
  const controls = useRef<CameraControlsImpl | null>(null);
  const { size } = useThree();

  useEffect(() => {
    const view = views[active];
    const mobile = size.width < 640;
    const distanceMultiplier = mobile ? 0.78 : 1;
    const x = view.position[0] * distanceMultiplier;
    const z = view.position[2] * distanceMultiplier;

    controls.current?.setLookAt(
      x,
      mobile ? Math.max(5.5, view.position[1] - 0.6) : view.position[1],
      z,
      view.target[0],
      mobile ? 2.6 : view.target[1],
      view.target[2],
      true,
    );
  }, [active, size.width]);

  return (
    <CameraControls
      ref={controls}
      enabled
      smoothTime={0.7}
      minDistance={13}
      maxDistance={34}
      minPolarAngle={Math.PI * 0.22}
      maxPolarAngle={Math.PI * 0.48}
      azimuthRotateSpeed={0.7}
      polarRotateSpeed={0.45}
      dollyToCursor={false}
    />
  );
}

export default function SchoolBuilding3D({ active }: { active: ViewKey }) {
  return (
    <div className="building-3d-mask relative mx-auto h-[390px] w-full max-w-[760px] sm:h-[500px] lg:h-[650px]">
      <Canvas
        camera={{ position: views.front.position, fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.7} />
        <directionalLight position={[8, 14, 12]} intensity={3.2} />
        <directionalLight position={[-12, 7, -8]} intensity={1.3} />
        <Suspense fallback={null}>
          <Building />
          <Environment preset="city" environmentIntensity={0.45} />
        </Suspense>
        <CameraRig active={active} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_36%,rgba(2,16,36,.22)_67%,#021024_100%)]" />
      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[#021024]/55 px-4 py-2 text-[9px] font-bold uppercase tracking-[.2em] text-white/35 backdrop-blur-md">
        Drag to explore 360°
      </div>
    </div>
  );
}

useGLTF.preload('/models/gedung_lowpoly_v2.glb');
