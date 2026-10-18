"use client";

import { useRef, useState, useEffect } from "react";

const QUICK_REPLIES = [
  "Info PPDB 2027 🏫",
  "Syarat Pendaftaran 📋",
  "Ada jurusan apa aja? 🎓",
  "Biaya SPP & Pendaftaran 💰",
  "Info Beasiswa 🎁",
  "Fasilitas & Lab 💻",
  "Info Asrama Sekolah 🏠",
  "Peluang Kerja Lulusan 💼",
  "Program PKL & Magang 🏢",
  "Ekstrakurikuler (Ekskul) ⚽",
  "Lokasi & Kontak Sekolah 📍",
];

type Props = {
  isLoading: boolean;
  onSendMessage: (msg: string) => void;
  isFullscreen: boolean;
};

export default function QuickReplies({
  isLoading,
  onSendMessage,
  isFullscreen,
}: Props) {
  const quickRepliesRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    distance: 0,
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = quickRepliesRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: e.clientX - el.getBoundingClientRect().left,
      scrollLeft: el.scrollLeft,
      distance: 0,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const el = quickRepliesRef.current;
    if (!el) return;

    const onPointerMove = (e: PointerEvent) => {
      const state = dragRef.current;
      if (!state.active) return;
      const x = e.clientX - el.getBoundingClientRect().left;
      const walk = (x - state.startX) * 1.5;
      state.distance = Math.abs(walk);
      el.scrollLeft = state.scrollLeft - walk;
    };

    const stopDragging = () => {
      dragRef.current.active = false;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [isDragging]);

  const handleWheel = (e: React.WheelEvent) => {
    if (quickRepliesRef.current && !isFullscreen)
      quickRepliesRef.current.scrollLeft += e.deltaY;
  };

  return (
    <div className="shrink-0 border-t border-white/5 bg-[#021024]/80">
      <div
        ref={quickRepliesRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        className={`mx-auto flex w-full max-w-[42rem] snap-x gap-2 select-none px-3.5 py-2.5 sm:px-4 ${
          isFullscreen
            ? "max-h-36 flex-wrap justify-center overflow-y-auto"
            : "cursor-grab touch-pan-x overflow-x-auto overscroll-x-contain active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        }`}
      >
        {QUICK_REPLIES.map((text, i) => (
          <button
            key={i}
            type="button"
            disabled={isLoading}
            onClick={() => {
              if (dragRef.current.distance >= 5) return;
              dragRef.current.distance = 0;
              onSendMessage(text);
            }}
            className="shrink-0 snap-start rounded-xl border border-[#7DA0CA]/30 bg-[#052659]/60 px-3.5 py-2 text-[13px] leading-none font-medium text-[#C1E8FF] transition-colors hover:bg-[#7DA0CA]/30 hover:text-white active:bg-[#7DA0CA]/40 disabled:opacity-50"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
