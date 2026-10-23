"use client";

import { useEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import {
  Angry,
  ChevronDown,
  ChevronUp,
  Frown,
  HelpCircle,
  Smile,
  Sparkles,
} from "lucide-react";

import { FiskaLiveFace, type FiskaEmotion } from "./FiskaFace";
import { botImages } from "./FiskaAvatar";

const emotionMeta = {
  Netral: { label: "Tenang", Icon: Sparkles },
  Happy: { label: "Senang", Icon: Smile },
  Sad: { label: "Sedih", Icon: Frown },
  Angry: { label: "Kesal", Icon: Angry },
  Bingung: { label: "Berpikir", Icon: HelpCircle },
} as const;

type Props = {
  botEmotion: FiskaEmotion;
  isSpeaking: boolean;
  /** Bukaan mulut 0..1 dari useFiskaSpeech. */
  mouthLevelRef: RefObject<number>;
  /** Efektif: manual, keyboard terbuka, atau layar pendek. */
  isCollapsed: boolean;
  /** Tombol lipat disembunyikan saat lipatan dipaksa (keyboard/lanskap). */
  canToggle: boolean;
  onToggle: () => void;
};

/**
 * Versi ringkas panggung Fiska untuk HP/tablet di mode layar penuh.
 * Kartu mengambil tinggi sendiri di antara header dan pesan, jadi tidak pernah
 * menutupi chat maupun kolom input. Bisa dilipat jadi strip tipis.
 */
export default function FiskaStage({
  botEmotion,
  isSpeaking,
  mouthLevelRef,
  isCollapsed,
  canToggle,
  onToggle,
}: Props) {
  const meta = emotionMeta[botEmotion] ?? emotionMeta.Netral;
  const EmotionIcon = meta.Icon;
  const status = isSpeaking ? "Sedang berbicara..." : "Asisten Virtual Sekolah";

  const portrait = botImages[botEmotion] ?? botImages.Netral;
  const mouthLayerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Lip-sync potret besar: frame mulut terbuka ditumpuk di atas frame diam,
  // opacity mengikuti volume suara. Sama seperti panggung desktop.
  useEffect(() => {
    if (isCollapsed) return;
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
      const raw = Math.min(1, Math.max(0, mouthLevelRef.current ?? 0));
      const shaped = Math.min(1, Math.max(0, (raw - 0.16) / 0.24));
      shown += (shaped - shown) * (1 - Math.exp(-dt / 28));
      layer.style.opacity =
        shown < 0.03 ? "0" : shown > 0.97 ? "1" : shown.toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isCollapsed, mouthLevelRef, reduceMotion]);

  return (
    <section
      aria-label="Fiska"
      className="mx-auto w-full max-w-[42rem] shrink-0 px-3 pt-2.5 lg:hidden"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border border-[#7DA0CA]/25 bg-[linear-gradient(135deg,rgba(5,38,89,0.92),rgba(2,16,36,0.97))] shadow-[0_18px_40px_-24px_rgba(84,131,179,0.6)] transition-[height] duration-300 ease-out motion-reduce:transition-none ${
          isCollapsed ? "h-12" : "h-[clamp(7rem,20dvh,11rem)]"
        }`}
      >
        {/* Ambience ringan: glow + grid halus */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-1/2 size-40 -translate-y-1/2 rounded-full bg-[#1b5b96]/35 blur-2xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(125,160,202,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,160,202,0.09)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_30%_50%,black,transparent_75%)]" />
        </div>

        {isCollapsed ? (
          /* ---------- Strip ringkas ---------- */
          <div className="relative flex h-full items-center gap-2.5 px-3">
            <div className="relative size-8 shrink-0 overflow-hidden rounded-lg border border-[#7DA0CA]/30 bg-[#0a2749]/70">
              <FiskaLiveFace
                emotion={botEmotion}
                mouthLevelRef={mouthLevelRef}
                className="size-full"
                sizes="32px"
                alt=""
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-[family-name:var(--font-space-grotesk)] text-xs font-semibold tracking-tight text-white">
                Fiska
              </p>
              <p className="truncate text-[10px] text-[#C1E8FF]/70">
                {status}
              </p>
            </div>
            {isSpeaking && (
              <span
                aria-hidden
                className="flex h-3 items-end gap-0.5 text-[#C1E8FF]"
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="fiska-eq w-0.5 rounded-full bg-current"
                    style={{
                      height: "100%",
                      animationDelay: `${i * 120}ms`,
                    }}
                  />
                ))}
              </span>
            )}
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#7DA0CA]/30 bg-[#021024]/60 px-2 py-0.5 text-[10px] font-medium text-[#C1E8FF]">
              <EmotionIcon size={11} />
              {meta.label}
            </span>
            {canToggle && (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={false}
                aria-label="Tampilkan Fiska"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-[#C1E8FF] transition-colors hover:bg-white/10"
              >
                <ChevronDown size={16} />
              </button>
            )}
          </div>
        ) : (
          /* ---------- Kartu bust ---------- */
          <div className="relative flex h-full items-stretch gap-3 p-2.5">
            <div className="relative aspect-square h-full shrink-0 overflow-hidden rounded-xl border border-[#7DA0CA]/25 bg-[#0a2749]/70">
              <Image
                src={portrait.diam}
                alt="Fiska, asisten virtual sekolah"
                fill
                sizes="176px"
                priority
                className="object-cover object-top"
              />
              <div
                ref={mouthLayerRef}
                aria-hidden
                className="absolute inset-0 will-change-[opacity]"
                style={{ opacity: 0 }}
              >
                <Image
                  src={portrait.buka}
                  alt=""
                  fill
                  sizes="176px"
                  className="object-cover object-top"
                />
              </div>
              {/* Fade tipis supaya tepi dada menyatu dengan kartu */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/6 bg-gradient-to-t from-[#021024]/80 to-transparent"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-0.5 pr-7">
              <div className="flex items-center gap-2">
                <span className="truncate font-[family-name:var(--font-space-grotesk)] text-sm font-semibold tracking-tight text-white">
                  Fiska
                </span>
                <span className="relative flex size-1.5 shrink-0" aria-hidden>
                  {isSpeaking && (
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#C1E8FF] opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex size-1.5 rounded-full ${
                      isSpeaking ? "bg-[#C1E8FF]" : "bg-[#7DA0CA]"
                    }`}
                  />
                </span>
                {isSpeaking && (
                  <span
                    aria-hidden
                    className="flex h-3 items-end gap-0.5 text-[#C1E8FF]"
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="fiska-eq w-0.5 rounded-full bg-current"
                        style={{
                          height: "100%",
                          animationDelay: `${i * 110}ms`,
                          animationDuration: `${700 + i * 90}ms`,
                        }}
                      />
                    ))}
                  </span>
                )}
              </div>
              <p className="truncate text-[11px] text-[#C1E8FF]/70">{status}</p>
              <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#7DA0CA]/30 bg-[#021024]/60 px-2 py-0.5 text-[10px] font-medium text-[#C1E8FF]">
                <EmotionIcon size={12} />
                {meta.label}
              </span>
            </div>

            {canToggle && (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded
                aria-label="Ringkas Fiska"
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg border border-[#7DA0CA]/20 bg-[#021024]/60 text-[#C1E8FF] backdrop-blur transition-colors hover:bg-white/10"
              >
                <ChevronUp size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
