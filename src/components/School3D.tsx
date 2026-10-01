'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import { Suspense } from 'react';

function Model({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  return <Center><primitive object={scene} scale={0.24} /></Center>;
}

export default function School3D({
  model = '/models/gedung_lowpoly_v2.glb',
  title,
  description,
}: {
  model?: string;
  title?: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[#021024] px-6 py-20 text-white sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_38%_48%,rgba(84,131,179,.13),transparent_34%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.35fr_.65fr] lg:gap-12">
        <div className="order-2 lg:order-1">
          <p className="eyebrow text-[#7DA0CA]">03 / 3D EXPERIENCE</p>
          <div className="mt-4 h-[330px] w-full sm:h-[390px] lg:h-[440px]">
            <Canvas camera={{ position: [7.5, 4.8, 11.5], fov: 48 }} dpr={[1, 1.5]}>
              <Suspense fallback={null}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 8, 5]} intensity={2} />
                <Environment preset="city" environmentIntensity={0.5} />
                <Model src={model} />
                <OrbitControls enablePan={false} minDistance={8} maxDistance={16} minPolarAngle={Math.PI * .24} maxPolarAngle={Math.PI * .72} enableDamping dampingFactor={0.06} />
              </Suspense>
            </Canvas>
          </div>
          <p className="mt-1 text-center text-[9px] font-bold uppercase tracking-[.2em] text-white/30">Drag untuk memutar model</p>
        </div>

        <div className="order-1 lg:order-2 lg:pl-2">
          <p className="eyebrow text-[#7DA0CA]">EXPLORE THE SPACE</p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">{title ? `Ruang ${title}.` : 'Eksplorasi ruang.'}</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/50">
            {description || 'Eksplorasi model ruang secara interaktif. Model jurusan dapat diganti manual melalui file GLB.'}
          </p>
          <div className="mt-7 h-px w-20 bg-[#7DA0CA]/50" />
          <p className="mt-5 max-w-sm text-xs leading-6 text-white/35">Model dapat diputar bebas untuk melihat area dari berbagai sisi.</p>
        </div>
      </div>
    </section>
  );
}
