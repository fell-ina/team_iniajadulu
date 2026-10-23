"use client";

import { useEffect, useRef, type RefObject } from "react";
import Image from "next/image";

/** Avatar bot sekolah (public/images/school/bot.png). */
export const FISKA_AVATAR = "/images/school/bot.png";

export const FISKA_EMOTIONS = [
  "Netral",
  "Happy",
  "Sad",
  "Angry",
  "Bingung",
] as const;

export type FiskaEmotion = (typeof FISKA_EMOTIONS)[number];

/** Emosi dari API bisa berupa string apa pun - jangan sampai bocor ke UI. */
export function normalizeEmotion(value: unknown): FiskaEmotion {
  return typeof value === "string" &&
    (FISKA_EMOTIONS as readonly string[]).includes(value)
    ? (value as FiskaEmotion)
    : "Netral";
}

/** Potongan kepala-bahu (256x256) - dipakai avatar kecil yang beranimasi. */
export const FISKA_FACES = {
  Netral: "/images/school/fiska-face-netral.jpg",
  Happy: "/images/school/fiska-face-happy.jpg",
  Sad: "/images/school/fiska-face-sad.jpg",
  Angry: "/images/school/fiska-face-angry.jpg",
  Bingung: "/images/school/fiska-face-bingung.jpg",
} as const;

/** Frame mulut terbuka untuk lip-sync. */
export const FISKA_FACES_OPEN = {
  Netral: "/images/school/fiska-face-netral-buka.jpg",
  Happy: "/images/school/fiska-face-happy-buka.jpg",
  Sad: "/images/school/fiska-face-sad-buka.jpg",
  Angry: "/images/school/fiska-face-angry-buka.jpg",
  Bingung: "/images/school/fiska-face-bingung-buka.jpg",
} as const;

/**
 * Versi transparan dari crop yang sama (latar navy dibuang) - dipakai avatar
 * "PNGTuber" di header, supaya Fiska tampil tanpa kotak/latar apa pun.
 */
export const FISKA_CUTOUTS = {
  Netral: "/images/school/fiska-cut-netral.png",
  Happy: "/images/school/fiska-cut-happy.png",
  Sad: "/images/school/fiska-cut-sad.png",
  Angry: "/images/school/fiska-cut-angry.png",
  Bingung: "/images/school/fiska-cut-bingung.png",
} as const;

export const FISKA_CUTOUTS_OPEN = {
  Netral: "/images/school/fiska-cut-netral-buka.png",
  Happy: "/images/school/fiska-cut-happy-buka.png",
  Sad: "/images/school/fiska-cut-sad-buka.png",
  Angry: "/images/school/fiska-cut-angry-buka.png",
  Bingung: "/images/school/fiska-cut-bingung-buka.png",
} as const;

type Props = {
  /** Diterima demi kompatibilitas call site; avatar memakai satu gambar. */
  emotion?: FiskaEmotion;
  /**
   * Dulu dipakai untuk animasi mulut. Sekarang avatar memakai bot.png statis,
   * jadi prop ini tidak berpengaruh lagi.
   */
  mouthLevelRef?: RefObject<number>;
  className?: string;
  sizes?: string;
  priority?: boolean;
  alt?: string;
  /** Hilangkan vignette kalau avatar berada di kartu yang sudah punya frame. */
  vignette?: boolean;
};

export default function FiskaFace({
  className = "size-10",
  sizes = "48px",
  priority = false,
  alt = "Fiska",
  vignette = true,
}: Props) {
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <Image
        src={FISKA_AVATAR}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
      {vignette && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_46%,rgba(2,16,36,0.6))]"
        />
      )}
    </span>
  );
}

type LiveProps = {
  emotion?: FiskaEmotion;
  /** Bukaan mulut 0..1 dari useFiskaSpeech (diperbarui tiap frame). */
  mouthLevelRef?: RefObject<number>;
  className?: string;
  sizes?: string;
  priority?: boolean;
  alt?: string;
};

/**
 * Avatar kecil yang "hidup": frame mulut terbuka menimpa frame diam mengikuti
 * mouthLevelRef. Dipakai di header chat supaya Fiska tetap terasa hadir di HP
 * tanpa memakan ruang pesan. Memakai cutout transparan: tidak ada kotak,
 * lingkaran, atau latar di belakang Fiska.
 */
export function FiskaLiveFace({
  emotion = "Netral",
  mouthLevelRef,
  className = "size-10",
  sizes = "56px",
  priority = false,
  alt = "Fiska",
}: LiveProps) {
  const layerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!mouthLevelRef) return;
    const layer = layerRef.current;
    if (!layer) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      layer.style.opacity = "0";
      return;
    }

    let raf = 0;
    let shown = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(50, Math.max(1, now - last));
      last = now;
      const raw = Math.min(1, Math.max(0, mouthLevelRef.current ?? 0));
      // Dorong ke 0/1 supaya dua frame yang pose-nya beda tidak saling tembus.
      const shaped = Math.min(1, Math.max(0, (raw - 0.16) / 0.24));
      shown += (shaped - shown) * (1 - Math.exp(-dt / 28));
      layer.style.opacity =
        shown < 0.03 ? "0" : shown > 0.97 ? "1" : shown.toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mouthLevelRef]);

  const src = FISKA_CUTOUTS[emotion] ?? FISKA_CUTOUTS.Netral;
  const openSrc = FISKA_CUTOUTS_OPEN[emotion] ?? FISKA_CUTOUTS_OPEN.Netral;
  const isLive = Boolean(mouthLevelRef);

  return (
    <span className={`relative block ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain [filter:drop-shadow(0_10px_18px_rgba(2,16,36,0.55))]"
      />
      {isLive && (
        <span
          ref={layerRef}
          aria-hidden
          className="absolute inset-0 will-change-[opacity]"
          style={{ opacity: 0 }}
        >
          <Image
            src={openSrc}
            alt=""
            fill
            sizes={sizes}
            className="object-contain"
          />
        </span>
      )}
    </span>
  );
}
