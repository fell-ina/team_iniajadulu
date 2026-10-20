"use client";

import { useEffect, useRef, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

const botImages = {
  Netral: {
    diam: "/images/EkspresiBot/netral.png",
    setengah: "/images/EkspresiBot/netralBuka.png",
    buka: "/images/EkspresiBot/netralBuka.png",
  },
  Happy: {
    diam: "/images/EkspresiBot/happyDiam.png",
    setengah: "/images/EkspresiBot/HappyBuka.png",
    buka: "/images/EkspresiBot/HappyBuka.png",
  },
  Sad: {
    diam: "/images/EkspresiBot/SadDiam.png",
    setengah: "/images/EkspresiBot/SadBuka.png",
    buka: "/images/EkspresiBot/SadBuka.png",
  },
  Angry: {
    diam: "/images/EkspresiBot/AngryTutup.png",
    setengah: "/images/EkspresiBot/AngryBuka.png",
    buka: "/images/EkspresiBot/AngryBuka.png",
  },
  Bingung: {
    diam: "/images/EkspresiBot/BingungDiam.png",
    setengah: "/images/EkspresiBot/BingungBuka.png",
    buka: "/images/EkspresiBot/BingungBuka.png",
  },
};

type FiskaAvatarProps = {
  isFullscreen: boolean;
  botEmotion: keyof typeof botImages;
  /** Bukaan mulut 0..1 dari useFiskaSpeech (diperbarui tiap frame). */
  mouthLevelRef: RefObject<number>;
};

export default function FiskaAvatar({
  isFullscreen,
  botEmotion,
  mouthLevelRef,
}: FiskaAvatarProps) {
  const mouthLayerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const emotion = botImages[botEmotion] ?? botImages.Netral;

  // Gambar diam jadi alas, gambar buka ditumpuk di atasnya dengan opacity yang
  // mengikuti volume suara. Tidak ada pergantian gambar dan tidak ada React
  // render per frame, jadi gerakannya benar-benar mulus.
  useEffect(() => {
    if (!isFullscreen) return;
    const layer = mouthLayerRef.current;
    if (!layer) return;

    if (reduceMotion) {
      layer.style.opacity = "0";
      return;
    }

    let raf = 0;
    let shown = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(50, Math.max(1, now - last));
      last = now;
      const target = Math.min(1, Math.max(0, mouthLevelRef.current ?? 0));
      // Easing berbasis waktu: perubahan opacity selalu halus, baik di layar
      // 60Hz maupun 120Hz.
      shown += (target - shown) * (1 - Math.exp(-dt / 45));
      layer.style.opacity = shown.toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // botEmotion sengaja tidak jadi dependency: layer mulut tidak ikut di-mount
    // ulang saat emosi berganti, jadi animasinya tidak perlu di-reset.
  }, [isFullscreen, mouthLevelRef, reduceMotion]);

  if (!isFullscreen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="hidden md:flex flex-1 h-full w-full max-w-lg relative flex-col items-center justify-end"
    >
      <div
        className="relative w-full h-[85%] pointer-events-none select-none"
        style={{ filter: "drop-shadow(0 0 35px rgba(125,160,202,0.25))" }}
      >
        <motion.div
          key={botEmotion}
          initial={reduceMotion ? false : { opacity: 0.85 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={emotion.diam}
            alt="Fiska Avatar Streamer Mode"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full h-full object-contain object-bottom"
            priority
          />
        </motion.div>
        <div
          ref={mouthLayerRef}
          aria-hidden
          className="absolute inset-0 will-change-[opacity]"
          style={{ opacity: 0 }}
        >
          <Image
            src={emotion.buka}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full h-full object-contain object-bottom"
            priority
          />
        </div>
      </div>
    </motion.div>
  );
}
