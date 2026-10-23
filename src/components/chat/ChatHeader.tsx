"use client";

import type { RefObject } from "react";
import {
  Trash2,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Minus,
} from "lucide-react";

import { FiskaLiveFace, type FiskaEmotion } from "./FiskaFace";

type Props = {
  isSpeaking: boolean;
  isVoiceLoading: boolean;
  isAudioEnabled: boolean;
  isFullscreen: boolean;
  botEmotion: FiskaEmotion;
  mouthLevelRef: RefObject<number>;
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
  botEmotion,
  mouthLevelRef,
  onClearChat,
  onToggleAudio,
  onToggleFullscreen,
  onToggleOpen,
}: Props) {
  const iconBtn = (active: boolean, danger = false) =>
    `grid size-10 shrink-0 place-items-center rounded-xl transition-colors pointer-coarse:size-11 sm:pointer-coarse:size-10 ${
      danger
        ? "text-white/60 hover:bg-red-500/15 hover:text-red-400"
        : active
          ? "text-[#C1E8FF] bg-[#5483B3]/25 hover:bg-[#5483B3]/45"
          : "text-white/60 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="relative flex shrink-0 items-center justify-between gap-1.5 border-b border-white/10 bg-gradient-to-r from-[#052659] via-[#052659]/70 to-[#021024] px-2 py-3 sm:gap-2 sm:px-5 sm:py-3.5">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
        {/* Avatar mini yang ikut berbicara - "PNGTuber" di chat mengambang.
            Tanpa kartu/lingkaran/latar: hanya potret kepala sampai dada yang
            tepinya melebur ke gradient header, jadi tidak terlihat seperti
            kotak dan tidak pernah menutupi pesan. Saat layar penuh di HP,
            avatar ini disembunyikan karena perannya digantikan kartu Fiska
            (FiskaStage) di bawah header. Ukuran desktop tetap 88px. */}
        <div
          className={`relative shrink-0 ${
            isFullscreen
              ? "hidden lg:block lg:-my-2 lg:-ml-1"
              : "-my-2 -ml-1"
          }`}
        >
          <FiskaLiveFace
            emotion={botEmotion}
            mouthLevelRef={mouthLevelRef}
            className="size-[clamp(5rem,28vw,6.5rem)] sm:size-[5.5rem]"
            sizes="(min-width: 640px) 88px, 150px"
          />
          {isSpeaking && (
            <span
              className="absolute -right-0.5 top-1.5 z-10 flex size-2.5" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#C1E8FF] opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-[#5483B3]" />
            </span>
          )}
        </div>
        {/* Di layar sangat sempit (window chat ~286px) nama disembunyikan
            supaya avatar besar + tombol aksi tidak saling menghimpit. Saat
            layar penuh avatar sudah pindah ke kartu Fiska, jadi teks selalu
            tampil. */}
        <div
          className={`min-w-0 ${
            isFullscreen ? "block" : "hidden min-[360px]:block"
          }`}
        >
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-space-grotesk)] text-sm font-semibold tracking-tight text-white">
            <span className="truncate">Fiska</span>
            {isSpeaking && (
              <span
                className="inline-flex h-3 shrink-0 items-end gap-0.5"
                aria-hidden="true"
              >
                <span className="h-full w-0.5 animate-pulse bg-[#C1E8FF]" />
                <span className="h-2/3 w-0.5 animate-bounce bg-[#C1E8FF]" />
                <span className="h-full w-0.5 animate-pulse bg-[#C1E8FF]" />
              </span>
            )}
          </h2>
          <p
            className={`${
              isFullscreen ? "block" : "hidden min-[420px]:block"
            } truncate text-[11px] text-[#C1E8FF]/70`}
          >
            {isVoiceLoading
              ? "Menyiapkan suara..."
              : isSpeaking
                ? "Sedang berbicara..."
                : "Asisten Virtual Sekolah"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center sm:gap-1">
        <button
          type="button"
          onClick={onClearChat}
          aria-label="Hapus riwayat chat"
          className={iconBtn(false, true)}
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          onClick={onToggleAudio}
          aria-label={isAudioEnabled ? "Matikan suara" : "Nyalakan suara"}
          aria-pressed={isAudioEnabled}
          className={iconBtn(isAudioEnabled)}
        >
          {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
          className={iconBtn(false)}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button
          type="button"
          onClick={onToggleOpen}
          aria-label="Kecilkan chat"
          className={iconBtn(false)}
        >
          <Minus size={16} />
        </button>
      </div>
    </div>
  );
}
