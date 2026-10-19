"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import type { ComponentType, KeyboardEvent } from "react";
import {
  ArrowUpRight,
  Brush,
  Camera,
  CarFront,
  ChartNetwork,
  Clapperboard,
  Code,
  Cog,
  Database,
  Gamepad2,
  Gauge,
  GitBranch,
  Globe,
  Network,
  Palette,
  PenTool,
  RadioTower,
  ScanLine,
  Server,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Type,
  Wrench,
  Zap,
} from "lucide-react";

type Slug = "pplg" | "tjkt" | "dkv" | "tkr";
type Icon = ComponentType<{
  size?: string | number;
  className?: string;
  strokeWidth?: string | number;
}>;

const SKILL_ICONS: Record<Slug, Icon[]> = {
  pplg: [Code, Globe, Smartphone, Database, Gamepad2, GitBranch],
  tjkt: [Network, ServerCog, RadioTower, Server, ShieldCheck, ChartNetwork],
  dkv: [PenTool, Brush, Camera, Type, Palette, Clapperboard],
  tkr: [Wrench, Cog, Zap, ScanLine, Gauge, CarFront],
};

const BLUE = "#5483B3";
const SOFT = "#7DA0CA";
const PALE = "#C1E8FF";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SIZE_DURATION = 0.55;
const CONTENT_DURATION = 0.45;

function Drift({
  className,
  drift,
  children,
}: {
  className: string;
  drift: { y: number[]; x?: number[]; rotate?: number[]; duration: number };
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce)
    return (
      <div aria-hidden="true" className={className}>
        {children}
      </div>
    );
  return (
    <motion.div
      aria-hidden="true"
      className={className}
      animate={{ y: drift.y, x: drift.x ?? [0, 0, 0], rotate: drift.rotate ?? [0, 0, 0] }}
      transition={{ duration: drift.duration, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

function PulseDot({
  cx,
  cy,
  r,
  fill,
  delay,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  delay: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <circle cx={cx} cy={cy} r={r} fill={fill} opacity=".7" />;
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      initial={{ opacity: 0.35 }}
      animate={{ opacity: [0.35, 0.95, 0.35] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function PplgArt() {
  return (
    <>
      <Drift
        className="pointer-events-none absolute right-0 top-6 z-0 hidden w-72 opacity-30 sm:block lg:w-[24rem] lg:opacity-35"
        drift={{ y: [0, -12, 0], duration: 10 }}
      >
        <svg viewBox="0 0 360 300" fill="none" className="h-auto w-full">
          <rect x="30" y="20" width="300" height="220" rx="14" stroke={BLUE} strokeWidth="1.5" opacity=".45" />
          <circle cx="56" cy="44" r="4" fill={SOFT} opacity=".5" />
          <circle cx="72" cy="44" r="4" fill={BLUE} opacity=".5" />
          <circle cx="88" cy="44" r="4" fill={PALE} opacity=".5" />
          <line x1="30" y1="60" x2="330" y2="60" stroke={BLUE} strokeWidth="1" opacity=".35" />
          <rect x="52" y="82" width="120" height="8" rx="4" fill={BLUE} opacity=".35" />
          <rect x="52" y="102" width="200" height="8" rx="4" fill={SOFT} opacity=".28" />
          <rect x="72" y="122" width="150" height="8" rx="4" fill={BLUE} opacity=".3" />
          <rect x="72" y="142" width="220" height="8" rx="4" fill={PALE} opacity=".25" />
          <rect x="52" y="162" width="90" height="8" rx="4" fill={SOFT} opacity=".3" />
          <rect x="52" y="182" width="170" height="8" rx="4" fill={BLUE} opacity=".28" />
          <text x="238" y="130" fontFamily="monospace" fontSize="52" fill={PALE} opacity=".22">
            {"{ }"}
          </text>
          <text x="240" y="168" fontFamily="monospace" fontSize="22" fill={SOFT} opacity=".35">
            {"</>"}
          </text>
          <text x="52" y="222" fontFamily="monospace" fontSize="12" fill={SOFT} opacity=".4">
            {"const skill = () => build();"}
          </text>
        </svg>
      </Drift>
      <Drift
        className="pointer-events-none absolute bottom-0 left-0 z-0 hidden w-48 opacity-25 md:block lg:w-56"
        drift={{ y: [0, 10, 0], duration: 12 }}
      >
        <svg viewBox="0 0 200 140" fill="none" className="h-auto w-full">
          <path d="M10 110 H150 M10 86 H110 M10 62 H170 M10 38 H90" stroke={SOFT} strokeWidth="2" opacity=".45" strokeLinecap="round" />
          <text x="160" y="116" fontFamily="monospace" fontSize="26" fill={BLUE} opacity=".5">
            {";"}
          </text>
        </svg>
      </Drift>
    </>
  );
}

function TjktArt() {
  return (
    <>
      <Drift
        className="pointer-events-none absolute left-0 top-6 z-0 hidden w-72 opacity-30 sm:block lg:w-[24rem] lg:opacity-35"
        drift={{ y: [0, -10, 0], x: [0, 8, 0], duration: 11 }}
      >
        <svg viewBox="0 0 360 300" fill="none" className="h-auto w-full">
          <line x1="180" y1="150" x2="70" y2="70" stroke={SOFT} strokeWidth="1.5" opacity=".5" />
          <line x1="180" y1="150" x2="290" y2="70" stroke={SOFT} strokeWidth="1.5" opacity=".5" />
          <line x1="180" y1="150" x2="60" y2="230" stroke={SOFT} strokeWidth="1.5" opacity=".5" />
          <line x1="180" y1="150" x2="300" y2="230" stroke={SOFT} strokeWidth="1.5" opacity=".5" />
          <line x1="180" y1="150" x2="180" y2="50" stroke={PALE} strokeWidth="1.5" strokeDasharray="5 6" opacity=".55" />
          <circle cx="180" cy="150" r="26" stroke={BLUE} strokeWidth="1.5" opacity=".6" />
          <circle cx="180" cy="150" r="40" stroke={BLUE} strokeWidth="1" strokeDasharray="4 6" opacity=".4" />
          <PulseDot cx={180} cy={150} r={7} fill={PALE} delay={0} />
          <PulseDot cx={70} cy={70} r={6} fill={SOFT} delay={0.5} />
          <PulseDot cx={290} cy={70} r={6} fill={SOFT} delay={1} />
          <PulseDot cx={60} cy={230} r={6} fill={BLUE} delay={1.5} />
          <PulseDot cx={300} cy={230} r={6} fill={BLUE} delay={2} />
          <PulseDot cx={180} cy={50} r={5} fill={PALE} delay={2.5} />
          <circle cx="70" cy="70" r="13" stroke={SOFT} strokeWidth="1.2" opacity=".5" />
          <circle cx="290" cy="70" r="13" stroke={SOFT} strokeWidth="1.2" opacity=".5" />
          <circle cx="60" cy="230" r="13" stroke={SOFT} strokeWidth="1.2" opacity=".5" />
          <circle cx="300" cy="230" r="13" stroke={SOFT} strokeWidth="1.2" opacity=".5" />
        </svg>
      </Drift>
      <Drift
        className="pointer-events-none absolute bottom-0 right-0 z-0 hidden w-52 opacity-25 md:block lg:w-64"
        drift={{ y: [0, 12, 0], duration: 9 }}
      >
        <svg viewBox="0 0 240 120" fill="none" className="h-auto w-full">
          <path d="M20 100 A 90 90 0 0 1 220 100" stroke={SOFT} strokeWidth="1.5" opacity=".5" />
          <path d="M45 100 A 65 65 0 0 1 195 100" stroke={PALE} strokeWidth="1.5" opacity=".5" />
          <path d="M70 100 A 40 40 0 0 1 170 100" stroke={BLUE} strokeWidth="1.5" opacity=".55" />
          <circle cx="120" cy="100" r="5" fill={PALE} opacity=".7" />
          {[60, 90, 150, 180].map((x) => (
            <circle key={x} cx={x} cy={112} r="2" fill={SOFT} opacity=".5" />
          ))}
        </svg>
      </Drift>
    </>
  );
}

function DkvArt() {
  return (
    <>
      <Drift
        className="pointer-events-none absolute right-0 top-6 z-0 hidden w-72 opacity-30 sm:block lg:w-[24rem] lg:opacity-35"
        drift={{ y: [0, -14, 0], rotate: [0, 3, 0], duration: 11 }}
      >
        <svg viewBox="0 0 360 300" fill="none" className="h-auto w-full">
          <circle cx="240" cy="110" r="78" fill={PALE} opacity=".12" />
          <circle cx="240" cy="110" r="78" stroke={BLUE} strokeWidth="1.5" strokeDasharray="5 7" opacity=".5" />
          <circle cx="240" cy="110" r="52" stroke={SOFT} strokeWidth="1.2" opacity=".45" />
          <rect x="30" y="170" width="130" height="70" rx="4" fill={BLUE} opacity=".18" transform="rotate(-8 95 205)" />
          <rect x="30" y="170" width="130" height="70" rx="4" stroke={SOFT} strokeWidth="1.2" opacity=".4" transform="rotate(-8 95 205)" />
          <path d="M20 60 C 100 20, 160 120, 250 60" stroke={SOFT} strokeWidth="2" opacity=".55" strokeLinecap="round" />
          <line x1="30" y1="262" x2="200" y2="244" stroke={PALE} strokeWidth="1.5" opacity=".45" strokeLinecap="round" />
          <circle cx="90" cy="70" r="12" stroke={SOFT} strokeWidth="1.5" opacity=".55" />
          <rect x="296" y="200" width="16" height="16" fill={SOFT} opacity=".45" transform="rotate(14 304 208)" />
          <line x1="300" y1="120" x2="330" y2="120" stroke={BLUE} strokeWidth="2" opacity=".5" strokeLinecap="round" />
          <line x1="300" y1="132" x2="322" y2="132" stroke={BLUE} strokeWidth="2" opacity=".4" strokeLinecap="round" />
        </svg>
      </Drift>
      <Drift
        className="pointer-events-none absolute bottom-0 left-0 z-0 hidden w-44 opacity-25 md:block lg:w-56"
        drift={{ y: [0, 10, 0], rotate: [0, -4, 0], duration: 13 }}
      >
        <svg viewBox="0 0 200 150" fill="none" className="h-auto w-full">
          <path d="M10 130 C 60 80, 100 140, 170 60" stroke={BLUE} strokeWidth="2" opacity=".5" strokeLinecap="round" />
          <circle cx="165" cy="45" r="24" fill={SOFT} opacity=".22" />
          <circle cx="165" cy="45" r="24" stroke={SOFT} strokeWidth="1.2" opacity=".45" />
          {[20, 34, 48].map((x) => (
            <circle key={x} cx={x} cy={20} r="2.5" fill={PALE} opacity=".5" />
          ))}
        </svg>
      </Drift>
    </>
  );
}

function TkrArt() {
  return (
    <>
      <Drift
        className="pointer-events-none absolute right-0 top-6 z-0 hidden w-72 opacity-30 sm:block lg:w-[24rem] lg:opacity-35"
        drift={{ y: [0, -10, 0], duration: 10 }}
      >
        <svg viewBox="0 0 360 300" fill="none" className="h-auto w-full">
          <circle cx="220" cy="130" r="72" stroke={PALE} strokeWidth="1.5" opacity=".5" />
          <circle cx="220" cy="130" r="50" stroke={BLUE} strokeWidth="1.5" strokeDasharray="6 6" opacity=".55" />
          <circle cx="220" cy="130" r="28" stroke={SOFT} strokeWidth="1.5" opacity=".55" />
          <circle cx="220" cy="130" r="7" fill={SOFT} opacity=".6" />
          {[0, 30, 60, 90, 120, 150].map((a) => (
            <line
              key={a}
              x1={220 + 50 * Math.cos((a * Math.PI) / 180)}
              y1={130 + 50 * Math.sin((a * Math.PI) / 180)}
              x2={220 + 72 * Math.cos((a * Math.PI) / 180)}
              y2={130 + 72 * Math.sin((a * Math.PI) / 180)}
              stroke={SOFT}
              strokeWidth="1.5"
              opacity=".5"
            />
          ))}
          <path d="M40 250 H320 M40 244 V256 M120 244 V256 M200 244 V256 M280 244 V256 M320 244 V256" stroke={SOFT} strokeWidth="1.2" opacity=".5" />
          <text x="44" y="238" fontFamily="monospace" fontSize="13" fill={SOFT} opacity=".5">
            {"Ø 72 · R 50"}
          </text>
          <path d="M60 60 H140 M60 54 V66 M140 54 V66" stroke={BLUE} strokeWidth="1.2" opacity=".5" />
        </svg>
      </Drift>
      <Drift
        className="pointer-events-none absolute bottom-0 left-0 z-0 hidden w-48 opacity-25 md:block lg:w-60"
        drift={{ y: [0, 10, 0], duration: 12 }}
      >
        <svg viewBox="0 0 220 130" fill="none" className="h-auto w-full">
          <rect x="14" y="40" width="120" height="50" rx="6" stroke={BLUE} strokeWidth="1.5" opacity=".5" />
          <line x1="134" y1="52" x2="200" y2="52" stroke={SOFT} strokeWidth="1.5" opacity=".5" />
          <line x1="134" y1="78" x2="200" y2="78" stroke={SOFT} strokeWidth="1.5" opacity=".5" />
          <circle cx="60" cy="65" r="12" stroke={SOFT} strokeWidth="1.2" strokeDasharray="3 4" opacity=".6" />
          <path d="M14 112 H206 M14 107 V117 M70 107 V117 M130 107 V117 M206 107 V117" stroke={SOFT} strokeWidth="1.1" opacity=".45" />
        </svg>
      </Drift>
    </>
  );
}

function CompetencyArt({ slug }: { slug: Slug }) {
  if (slug === "pplg") return <PplgArt />;
  if (slug === "tjkt") return <TjktArt />;
  if (slug === "dkv") return <DkvArt />;
  return <TkrArt />;
}

export default function CompetencyShowcase({
  slug,
  name,
  desc,
  about,
  skills,
  activity,
}: {
  slug: Slug;
  name: string;
  desc: string;
  about: string;
  skills: string[];
  activity: string;
}) {
  const icons = SKILL_ICONS[slug];
  const total = String(skills.length).padStart(2, "0");
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  const onGridKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    setActive((prev) => (prev + dir + skills.length) % skills.length);
  };

  return (
    <section className="relative overflow-hidden overflow-x-clip bg-[#021024] px-5 py-16 sm:px-6 sm:py-24 lg:py-28">
      <CompetencyArt slug={slug} />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(84,131,179,.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-56 bg-gradient-to-b from-[#021024] via-[#021024]/60 to-transparent" />
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="border-t border-white/10 pt-8 sm:pt-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[clamp(11px,0.7rem+0.2vw,12px)] uppercase tracking-[0.2em] text-[#7DA0CA]">
                05 / Kompetensi
              </p>
              <h2 className="mt-4 max-w-2xl text-[clamp(30px,1.9rem+2.5vw,52px)] font-medium leading-[1.05] tracking-tight text-white">
                Yang dipelajari di {name}.
              </h2>
            </div>
            <div className="shrink-0 lg:max-w-sm">
              <p className="max-w-[65ch] text-[clamp(15px,0.94rem+0.2vw,17px)] leading-[1.7] text-white/60">
                {desc}
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#7DA0CA]/60">
                {total} kompetensi — ketuk kartu untuk melihat fokus
              </p>
            </div>
          </div>
        </motion.div>

        <ul
          onKeyDown={onGridKeyDown}
          className="mt-10 flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:flex lg:flex-row lg:items-stretch"
        >
          {skills.map((skill, i) => {
            const num = String(i + 1).padStart(2, "0");
            const Icon = icons[i] ?? Code;
            const isActive = i === active;
            return (
              <motion.li
                key={skill}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: reduce ? 0 : 0.45,
                  delay: reduce ? 0 : 0.04 + i * 0.06,
                }}
                className={`min-w-0 transition-[flex-grow,flex-basis] duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  isActive
                    ? "sm:col-span-2 lg:min-w-[300px] lg:flex-[3_1_0%]"
                    : "lg:min-w-[140px] lg:flex-[1_1_0%]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-expanded={isActive}
                  aria-label={`Kompetensi ${num}: ${skill}`}
                  className={`relative flex min-h-[64px] w-full cursor-pointer flex-col justify-between gap-4 overflow-hidden rounded-3xl border p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C1E8FF] active:scale-[0.99] motion-reduce:transition-none sm:p-5 lg:h-full lg:min-h-[320px] ${
                    isActive
                      ? "border-[#7DA0CA]/60 bg-white/[0.06] shadow-[0_24px_60px_-24px_rgba(84,131,179,0.4)]"
                      : "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-[#7DA0CA]/40 hover:bg-white/[0.05] motion-reduce:hover:translate-y-0"
                  }`}
                >
                  <AnimatePresence>
                    {isActive && activity ? (
                      <motion.span
                        key="activity-background"
                        aria-hidden="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduce ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className="pointer-events-none absolute inset-0 block"
                      >
                        <Image
                          src={activity}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 60vw, 100vw"
                          loading="lazy"
                          className="object-cover opacity-40 [mask-image:linear-gradient(to_top,black_25%,transparent_80%)] lg:opacity-55 lg:[mask-image:linear-gradient(to_right,transparent_5%,black_60%)]"
                        />
                        <span className="absolute inset-0 block bg-gradient-to-t from-[#021024]/95 via-[#021024]/50 to-[#021024]/20 lg:bg-gradient-to-r lg:from-[#021024]/95 lg:via-[#021024]/55 lg:to-[#021024]/10" />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                  <span className="relative z-10 flex items-start justify-between gap-2">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl border transition-colors duration-300 ${
                        isActive
                          ? "border-[#C1E8FF]/50 bg-[#052659] text-white"
                          : "border-white/10 bg-[#052659]/70 text-[#C1E8FF]"
                      }`}
                    >
                      <Icon size={18} strokeWidth={1.5} />
                    </span>
                    <span className="shrink-0 font-mono text-[11px] tracking-[0.14em] text-[#7DA0CA]/70">
                      {num} / {total}
                    </span>
                  </span>
                  <span className="relative z-10 block min-w-0">
                    <span
                      className={`block min-w-0 tracking-tight transition-[font-size,line-height] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                        isActive
                          ? "max-w-md text-balance text-[clamp(24px,1.5rem+1.6vw,38px)] font-medium leading-[1.12] text-white"
                          : "text-[13px] font-medium leading-[1.5] break-words text-white/85"
                      }`}
                    >
                      {skill}
                    </span>
                    <AnimatePresence mode="wait" initial={false}>
                    {isActive ? (
                      <motion.span
                        key="active-details"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: reduce ? 0 : 0.3, ease: "easeOut" }}
                        className="mt-4 block max-w-md"
                      >
                        <span className="block h-px w-full bg-gradient-to-r from-[#7DA0CA]/60 to-transparent" />
                        <span className="mt-3 flex items-center justify-between gap-3">
                          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C1E8FF]/80">
                            Foto kegiatan {name}
                          </span>
                          <ArrowUpRight size={17} className="shrink-0 text-[#C1E8FF]" />
                        </span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="inactive-details"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduce ? 0 : 0.2 }}
                        className="mt-3 flex items-center justify-between gap-2"
                      >
                        <span className="h-px w-8 shrink-0 bg-white/15" />
                        <ArrowUpRight
                          size={15}
                          className="shrink-0 text-[#7DA0CA]/50"
                        />
                      </motion.span>
                    )}
                    </AnimatePresence>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.15 }}
          className="mt-10 border-t border-white/10 pt-6"
        >
          <p className="max-w-[65ch] text-[clamp(15px,0.94rem+0.2vw,17px)] leading-[1.7] text-white/55">
            {about}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">
              {name} — {total} bidang kompetensi
            </p>
            <div className="flex gap-1.5" aria-hidden="true">
              {skills.map((s, i) => (
                <span
                  key={s}
                  className={`h-1 rounded-full transition-colors duration-300 ${
                    i === active ? "w-8 bg-[#7DA0CA]" : "w-4 bg-white/15"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
