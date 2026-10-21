"use client";

import { useEffect, useRef, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Angry, Frown, HelpCircle, Smile, Sparkles } from "lucide-react";

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
    diam: "/images/EkspresiBot/BingungTutup.png",
    setengah: "/images/EkspresiBot/BingungBuka.png",
    buka: "/images/EkspresiBot/BingungBuka.png",
  },
} as const;

const emotionMeta = {
  Netral: { label: "Tenang", Icon: Sparkles },
  Happy: { label: "Senang", Icon: Smile },
  Sad: { label: "Sedih", Icon: Frown },
  Angry: { label: "Kesal", Icon: Angry },
  Bingung: { label: "Berpikir", Icon: HelpCircle },
} as const;

/** Debu cahaya di area kosong sekitar kartu avatar. */
const PARTICLES = [
  { left: "2%", top: "14%", size: 3, delay: "-1.2s", duration: "6.5s" },
  { left: "8%", top: "38%", size: 2, delay: "-3.4s", duration: "5.2s" },
  { left: "0%", top: "62%", size: 4, delay: "-2.1s", duration: "7.4s" },
  { left: "12%", top: "80%", size: 2, delay: "-4.6s", duration: "6s" },
  { left: "92%", top: "22%", size: 3, delay: "-2.8s", duration: "6.8s" },
  { left: "97%", top: "46%", size: 2, delay: "-0.6s", duration: "5.6s" },
  { left: "88%", top: "68%", size: 4, delay: "-3.9s", duration: "7.8s" },
  { left: "96%", top: "88%", size: 2, delay: "-5.2s", duration: "5.9s" },
];

/** Kepingan kecil yang mengapung naik di sisi kiri & kanan panggung. */
const SHARDS = [
  { left: "1%", top: "18%", size: 9, delay: "-0.8s", duration: "11s" },
  { left: "-1%", top: "44%", size: 6, delay: "-3.4s", duration: "13s" },
  { left: "7%", top: "66%", size: 7, delay: "-5.8s", duration: "9.5s" },
  { left: "4%", top: "86%", size: 5, delay: "-2.2s", duration: "12.5s" },
  { left: "96%", top: "12%", size: 7, delay: "-4.6s", duration: "12s" },
  { left: "90%", top: "38%", size: 9, delay: "-1.4s", duration: "10.5s" },
  { left: "98%", top: "60%", size: 5, delay: "-6.2s", duration: "13.5s" },
  { left: "92%", top: "82%", size: 6, delay: "-3s", duration: "9.8s" },
];

/** Garis cahaya yang naik di kedua sisi kartu. */
const STREAKS = [
  { left: "6%", top: "48%", height: 96, delay: "0s" },
  { left: "10%", top: "58%", height: 64, delay: "-2.4s" },
  { left: "88%", top: "42%", height: 84, delay: "-1.2s" },
  { left: "93%", top: "54%", height: 108, delay: "-3.8s" },
];

type FiskaAvatarProps = {
  isFullscreen: boolean;
  isSpeaking: boolean;
  botEmotion: keyof typeof botImages;
  /** Bukaan mulut 0..1 dari useFiskaSpeech (diperbarui tiap frame). */
  mouthLevelRef: RefObject<number>;
};

export default function FiskaAvatar({
  isFullscreen,
  isSpeaking,
  botEmotion,
  mouthLevelRef,
}: FiskaAvatarProps) {
  const mouthLayerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const emotion = botImages[botEmotion] ?? botImages.Netral;
  const meta = emotionMeta[botEmotion] ?? emotionMeta.Netral;
  const EmotionIcon = meta.Icon;

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
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -14 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative hidden h-full w-full max-w-lg flex-col items-center justify-end md:flex"
    >
      {/* ---------- Ambience di sekitar kartu ---------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Cahaya dasar */}
        <div className="fiska-halo absolute left-[-15%] top-[2%] h-[62%] w-[130%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(84,131,179,0.45),rgba(5,38,89,0.18)_48%,transparent_72%)] blur-2xl" />
        <div className="fiska-orb absolute -left-16 top-[20%] size-56 rounded-full bg-[#1b5b96]/35 blur-3xl" />
        <div className="fiska-orb fiska-orb-slow absolute -right-14 top-[50%] size-48 rounded-full bg-[#5483B3]/30 blur-3xl" />

        {/* Grid halus */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(125,160,202,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,160,202,0.10)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_at_50%_62%,black,transparent_72%)]" />

        {/* Cincin orbit di sudut kiri-bawah & kanan-atas */}
        <div className="fiska-orbit absolute -bottom-24 -left-28 size-72 rounded-full border border-dashed border-[#7DA0CA]/30" />
        <div className="fiska-orbit fiska-orbit-rev absolute -bottom-14 -left-16 size-44 rounded-full border border-[#C1E8FF]/20">
          <span className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C1E8FF]/90 shadow-[0_0_10px_rgba(193,232,255,0.9)]" />
        </div>
        <div className="fiska-orbit fiska-orbit-rev absolute -right-24 -top-20 size-64 rounded-full border border-dashed border-[#5483B3]/30" />
        <div className="fiska-orbit absolute -right-12 -top-10 size-36 rounded-full border border-[#C1E8FF]/20">
          <span className="absolute bottom-0 left-1/2 size-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#C1E8FF]/80 shadow-[0_0_10px_rgba(193,232,255,0.8)]" />
        </div>

        {/* Bracket sudut panggung, berdenyut bergantian */}
        <div className="absolute inset-x-1 top-1 bottom-6">
          <span className="fiska-corner absolute left-0 top-0 h-10 w-10 rounded-tl-lg border-l border-t border-[#C1E8FF]/40" />
          <span
            className="fiska-corner absolute right-0 top-0 h-10 w-10 rounded-tr-lg border-r border-t border-[#C1E8FF]/40"
            style={{ animationDelay: "-1.1s" }}
          />
          <span
            className="fiska-corner absolute bottom-0 left-0 h-10 w-10 rounded-bl-lg border-b border-l border-[#C1E8FF]/40"
            style={{ animationDelay: "-2.3s" }}
          />
          <span
            className="fiska-corner absolute bottom-0 right-0 h-10 w-10 rounded-br-lg border-b border-r border-[#C1E8FF]/40"
            style={{ animationDelay: "-3.4s" }}
          />
        </div>

        {/* Kepingan mengapung di sisi kiri & kanan */}
        {SHARDS.map((s, i) => (
          <span
            key={`shard-${i}`}
            className="fiska-drift absolute rotate-45 rounded-[2px] border border-[#C1E8FF]/45 bg-[#C1E8FF]/12"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}

        {/* Garis cahaya naik di kedua sisi */}
        {STREAKS.map((s, i) => (
          <span
            key={`streak-${i}`}
            className="fiska-streak absolute w-px bg-gradient-to-t from-transparent via-[#C1E8FF]/70 to-transparent"
            style={{
              left: s.left,
              top: s.top,
              height: s.height,
              animationDelay: s.delay,
            }}
          />
        ))}

        {/* Sapuan scan horizontal */}
        <div className="fiska-scan absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#C1E8FF]/45 to-transparent" />

        {/* Partikel */}
        {PARTICLES.map((p, i) => (
          <span
            key={`particle-${i}`}
            className="fiska-spark absolute rounded-full bg-[#C1E8FF] shadow-[0_0_8px_rgba(193,232,255,0.9)]"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}

        <div className="absolute inset-x-4 bottom-0 h-28 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(193,232,255,0.22),transparent_70%)] blur-xl" />
      </div>

      {/* ---------- Kartu avatar ---------- */}
      <div className="relative flex h-[88%] w-full items-end justify-center">
        <div className="fiska-float relative h-full">
          {/* Bayangan di bawah kartu */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 -bottom-3 h-10 rounded-[50%] bg-[#7DA0CA]/35 blur-2xl"
          />

          <div
            className={`relative h-full overflow-hidden rounded-[1.75rem] border bg-[#021024] transition-[box-shadow,border-color] duration-500 ${
              isSpeaking
                ? "border-[#C1E8FF]/45 shadow-[0_0_0_1px_rgba(193,232,255,0.14),0_28px_80px_-22px_rgba(125,160,202,0.55)]"
                : "border-[#7DA0CA]/25 shadow-[0_26px_70px_-26px_rgba(84,131,179,0.45)]"
            }`}
          >
            <Image
              src={emotion.diam}
              alt="Fiska, asisten virtual sekolah"
              width={1189}
              height={1600}
              sizes="(max-width: 767px) 0px, (max-width: 1280px) 42vw, 460px"
              priority
              className="h-full w-auto max-w-full object-contain object-bottom"
            />
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
                sizes="(max-width: 767px) 0px, (max-width: 1280px) 42vw, 460px"
                priority
                className="object-contain object-bottom"
              />
            </div>

            {/* Fade lembut supaya tepi gambar menyatu dengan kartu */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#010912]/80 to-transparent"
            />

            {/* Sudut bingkai */}
            <div aria-hidden className="pointer-events-none absolute inset-2.5">
              <span className="absolute left-0 top-0 size-4 rounded-tl-[0.45rem] border-l border-t border-[#C1E8FF]/45" />
              <span className="absolute right-0 top-0 size-4 rounded-tr-[0.45rem] border-r border-t border-[#C1E8FF]/45" />
              <span className="absolute bottom-0 left-0 size-4 rounded-bl-[0.45rem] border-b border-l border-[#C1E8FF]/45" />
              <span className="absolute bottom-0 right-0 size-4 rounded-br-[0.45rem] border-b border-r border-[#C1E8FF]/45" />
            </div>

            {/* HUD atas */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3.5">
              <div className="flex items-center gap-2 rounded-full border border-[#C1E8FF]/25 bg-[#021024]/70 px-2.5 py-1 backdrop-blur-md">
                <span className="relative flex size-1.5">
                  {isSpeaking && !reduceMotion && (
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#C1E8FF] opacity-80" />
                  )}
                  <span
                    className={`relative inline-flex size-1.5 rounded-full ${
                      isSpeaking ? "bg-[#C1E8FF]" : "bg-[#7DA0CA]"
                    }`}
                  />
                </span>
                <span className="font-[family-name:var(--font-space-grotesk)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F4F9FF]">
                  Fiska
                </span>
              </div>

              <div
                aria-hidden
                className="flex h-6 items-end gap-[3px] rounded-full border border-[#C1E8FF]/20 bg-[#021024]/70 px-2.5 py-1.5 backdrop-blur-md"
              >
                {isSpeaking ? (
                  [0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="fiska-eq w-[2px] rounded-full bg-[#C1E8FF]"
                      style={{
                        height: "100%",
                        animationDelay: `${i * 110}ms`,
                        animationDuration: `${700 + i * 90}ms`,
                      }}
                    />
                  ))
                ) : (
                  [0.4, 0.7, 0.5, 0.85, 0.35].map((h, i) => (
                    <span
                      key={i}
                      className="w-[2px] rounded-full bg-[#7DA0CA]/70"
                      style={{ height: `${h * 100}%` }}
                    />
                  ))
                )}
              </div>
            </div>

            {/* HUD bawah */}
            <div className="absolute inset-x-0 bottom-0 flex items-end p-3.5">
              <motion.div
                key={botEmotion}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-center gap-1.5 rounded-full border border-[#7DA0CA]/30 bg-[#021024]/75 px-2.5 py-1 text-[11px] font-medium text-[#C1E8FF] backdrop-blur-md"
              >
                <EmotionIcon size={12} />
                <span>{meta.label}</span>
              </motion.div>
            </div>
          </div>

          {/* Denyut bingkai saat berbicara */}
          {isSpeaking && !reduceMotion && (
            <span
              aria-hidden
              className="fiska-ring pointer-events-none absolute inset-0 rounded-[1.75rem] border border-[#C1E8FF]/50"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
