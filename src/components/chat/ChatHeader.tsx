"use client";

import Image from "next/image";
import {
  Trash2,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Minus,
} from "lucide-react";

type Props = {
  isSpeaking: boolean;
  isVoiceLoading: boolean;
  isAudioEnabled: boolean;
  isFullscreen: boolean;
  onClearChat: () => void;
  onToggleAudio: () => void;
  onToggleFullscreen: () => void;
  onToggleOpen: () => void;
};

export default function ChatHeader({
  isSpeaking,
  isVoiceLoading,
  isAudioEnabled,
  isFullscreen,
  onClearChat,
  onToggleAudio,
  onToggleFullscreen,
  onToggleOpen,
}: Props) {
  const iconBtn = (active: boolean, danger = false) =>
    `grid size-10 shrink-0 place-items-center rounded-xl transition-colors ${
      danger
        ? "text-white/60 hover:bg-red-500/15 hover:text-red-400"
        : active
          ? "text-[#C1E8FF] bg-[#5483B3]/25 hover:bg-[#5483B3]/45"
          : "text-white/60 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="relative flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-[#052659] via-[#052659]/70 to-[#021024] px-3 py-3 sm:px-5 sm:py-3.5">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <div className="relative size-9 shrink-0 overflow-hidden rounded-xl border border-[#7DA0CA]/30 bg-[#052659] sm:size-10 sm:rounded-2xl">
          <Image
            src="/images/school/bot.png"
            alt="Fiska Avatar"
            fill
            sizes="40px"
            className="object-cover"
          />
          {isSpeaking && (
            <span className="absolute -top-1 -right-1 z-10 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#C1E8FF] opacity-75"></span>
              <span className="relative inline-flex size-3 rounded-full bg-[#5483B3]"></span>
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-space-grotesk)] text-sm font-semibold tracking-tight text-white">
            <span className="truncate">Fiska</span>
            {isSpeaking && (
              <span
                className="inline-flex h-3 items-end gap-0.5"
                aria-hidden="true"
              >
                <span className="h-full w-0.5 animate-pulse bg-[#C1E8FF]"></span>
                <span className="h-2/3 w-0.5 animate-bounce bg-[#C1E8FF]"></span>
                <span className="h-full w-0.5 animate-pulse bg-[#C1E8FF]"></span>
              </span>
            )}
          </h2>
          <p className="truncate text-[11px] text-[#C1E8FF]/70">
            {isVoiceLoading
              ? "Menyiapkan suara..."
              : isSpeaking
                ? "Sedang berbicara..."
                : "Asisten Virtual Sekolah"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <button
          type="button"
          onClick={onClearChat}
          aria-label="Hapus Chat"
          className={iconBtn(false, true)}
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          onClick={onToggleAudio}
          aria-label="Toggle Audio"
          className={iconBtn(isAudioEnabled)}
        >
          {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label="Fullscreen"
          className={iconBtn(false)}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button
          type="button"
          onClick={onToggleOpen}
          aria-label="Tutup"
          className={iconBtn(false)}
        >
          <Minus size={16} />
        </button>
      </div>
    </div>
  );
}
