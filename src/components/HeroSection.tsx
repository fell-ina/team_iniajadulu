"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Cog,
  Video,
} from "lucide-react";

const slides = [
  {
    image: "/images/school/hero-lab.jpg",
    eyebrow: "SAFETY AND TECHNOLOGY",
    title: "Belajar. Berkarya. Berkembang.",
    text: "Ruang belajar vokasi yang dekat dengan teknologi, karakter, dan dunia industri.",
  },
  {
    image: "/images/school/hero-courtyard.jpg",
    eyebrow: "ACTIVE LEARNING AND GROWTH",
    title: "Tumbuh bersama Tunas Harapan.",
    text: "Lingkungan sekolah yang aktif, nyaman, dan memberi ruang untuk mengeksplorasi potensi.",
  },
  {
    image: "/images/school/hero-lapangan.jpg",
    eyebrow: "COLLABORATIVE EXPERIENCE",
    title: "Berkembang di Lingkungan Positif.",
    text: "Membangun pengalaman belajar yang aktif, kolaboratif, dan mendorong setiap siswa untuk berkembang.",
  },
];

export default function HeroSection() {
  const [active, setActive] = useState(0);
  const slide = slides[active];
  const go = (direction: number) =>
    setActive((value) => (value + direction + slides.length) % slides.length);

  useEffect(() => {
    const timer = setInterval(() => go(1), 7000);
    return () => clearInterval(timer);
  }, [active]);

  return (
    <>
      <section
        id="hero"
        className="relative min-h-[720px] overflow-hidden bg-[#021024] text-white sm:min-h-[760px] lg:min-h-screen"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={slide.image}
            src={slide.image}
            alt="Aktivitas sekolah"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-r from-[#021024]/90 via-[#021024]/62 to-[#021024]/28" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#021024]/90 via-[#021024]/10 to-[#021024]/20" />

        <div className="relative z-10 mx-auto flex min-h-[720px] max-w-[1500px] flex-col px-5 pb-24 pt-28 sm:min-h-[760px] sm:px-8 sm:pt-32 lg:min-h-screen lg:px-12">

          <div className="flex flex-1 items-center py-14 sm:py-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.55 }}
                className="max-w-xl"
              >
                <div className="mb-6 grid size-11 place-items-center rounded-xl border border-white/30 bg-white/90 p-2 shadow-lg sm:size-12">
                  <img
                    src="/images/school/logo-transparent.png"
                    alt="Logo SMK Telekomunikasi Tunas Harapan"
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#C1E8FF]/85">
                  {slide.eyebrow}
                </p>
                <h1 className="mt-4 max-w-3xl text-[clamp(2.45rem,5.3vw,5rem)] font-semibold leading-[.97] tracking-[-.045em]">
                  {slide.title}
                </h1>
                <p className="mt-6 max-w-lg text-sm leading-7 text-white/72 sm:text-base sm:leading-8">
                  {slide.text}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href="#profil"
                    className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#021024]"
                  >
                    Jelajahi sekolah <ArrowUpRight size={15} />
                  </a>
                  <a
                    href="https://spmb.tunasharapan.info"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 py-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/85"
                  >
                    PPDB / SPMB
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="grid items-end gap-5 border-t border-white/15 pt-5 lg:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-3">
              {slides.map((item, index) => {
                const isActive = active === index;
                return (
                  <button
                    key={item.image}
                    onClick={() => setActive(index)}
                    aria-label={`Slide ${index + 1}`}
                    className="group flex items-center gap-2"
                  >
                    <span className="relative h-1 overflow-hidden rounded-full bg-white/20 transition-all duration-300">
                      {isActive ? (
                        <span className="relative block h-full w-12">
                          <motion.span
                            key={active}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 7, ease: "linear" }}
                            className="absolute inset-y-0 left-0 rounded-full bg-white"
                          />
                        </span>
                      ) : (
                        <span className="block h-full w-5 bg-white/30 transition-colors group-hover:bg-white/50" />
                      )}
                    </span>
                    <span
                      className={`font-mono text-[10px] transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-white/40 group-hover:text-white/70"
                      }`}
                    >
                      0{index + 1}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="hidden gap-2 lg:flex">
              <button
                onClick={() => go(-1)}
                aria-label="Slide sebelumnya"
                className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/5 transition hover:bg-white/10"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => go(1)}
                aria-label="Slide berikutnya"
                className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/5 transition hover:bg-white/10"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <a
              href="#profil"
              className="flex justify-end gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-white/55"
            >
              Scroll{" "}
              <span className="grid size-8 place-items-center rounded-full border border-white/20">
                <ArrowDown size={13} />
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
