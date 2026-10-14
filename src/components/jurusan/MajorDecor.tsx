"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Slug = "pplg" | "tjkt" | "dkv" | "tkr";
type Tone = "light" | "dark";

const BLUE = "#5483B3";
const SOFT = "#7DA0CA";
const PALE = "#C1E8FF";
const NAVY = "#052659";

function CornerWrap({
  className,
  children,
  drift,
}: {
  className: string;
  children: ReactNode;
  drift?: { y?: number[]; x?: number[]; rotate?: number[]; duration?: number };
}) {
  const reduce = useReducedMotion();
  if (reduce || !drift) return <div aria-hidden="true" className={className}>{children}</div>;
  return (
    <motion.div
      aria-hidden="true"
      className={className}
      animate={{ y: drift.y ?? [0, -10, 0], x: drift.x ?? [0, 0, 0], rotate: drift.rotate ?? [0, 0, 0] }}
      transition={{ duration: drift.duration ?? 9, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

function PplgDecor({ tone }: { tone: Tone }) {
  const op = tone === "light" ? 0.5 : 0.55;
  const grid = tone === "light" ? "rgba(5,38,89,.07)" : "rgba(193,232,255,.07)";
  return (
    <>
      <CornerWrap className="pointer-events-none absolute -right-10 -top-10 z-0 w-72 opacity-100 sm:w-96" drift={{ y: [0, -12, 0], duration: 9 }}>
        <svg viewBox="0 0 320 260" fill="none" className="h-auto w-full" style={{ opacity: op }}>
          <defs>
            <pattern id="pplg-grid" width="26" height="26" patternUnits="userSpaceOnUse">
              <path d="M26 0H0v26" fill="none" stroke={grid} strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="40" y="10" width="270" height="240" fill="url(#pplg-grid)" rx="12" />
          <path d="M20 200 L110 120 L180 160 L260 60" stroke={BLUE} strokeWidth="1.5" strokeDasharray="5 6" opacity=".6" />
          <circle cx="110" cy="120" r="5" fill={SOFT} opacity=".7" />
          <circle cx="180" cy="160" r="5" fill={PALE} opacity=".7" />
          <circle cx="260" cy="60" r="6" fill="none" stroke={SOFT} strokeWidth="1.5" />
          <text x="52" y="72" fontFamily="monospace" fontSize="34" fill={tone === "light" ? NAVY : PALE} opacity=".22">{"{ }"}</text>
          <text x="58" y="112" fontFamily="monospace" fontSize="18" fill={BLUE} opacity=".35">{"</>"}</text>
          <text x="62" y="142" fontFamily="monospace" fontSize="13" fill={SOFT} opacity=".4">{"; _"}</text>
        </svg>
      </CornerWrap>
      <CornerWrap className="pointer-events-none absolute -bottom-8 -left-8 z-0 hidden w-56 sm:block" drift={{ y: [0, 10, 0], duration: 11 }}>
        <svg viewBox="0 0 220 140" fill="none" className="h-auto w-full" style={{ opacity: op * 0.8 }}>
          <path d="M8 120 H150 M8 96 H110 M8 72 H170" stroke={SOFT} strokeWidth="1.5" opacity=".5" strokeLinecap="round" />
          <circle cx="168" cy="120" r="3.5" fill={BLUE} opacity=".6" />
          <circle cx="128" cy="96" r="3.5" fill={SOFT} opacity=".6" />
        </svg>
      </CornerWrap>
    </>
  );
}

function TjktDecor({ tone }: { tone: Tone }) {
  const op = tone === "light" ? 0.55 : 0.6;
  return (
    <>
      <CornerWrap className="pointer-events-none absolute -left-12 -top-12 z-0 w-72 sm:w-96" drift={{ y: [0, -10, 0], x: [0, 8, 0], duration: 10 }}>
        <svg viewBox="0 0 320 280" fill="none" className="h-auto w-full" style={{ opacity: op }}>
          <circle cx="70" cy="70" r="1.8" fill={BLUE} opacity=".5" />
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={40 + c * 32} cy={40 + r * 32} r="1.6" fill={r % 2 ? SOFT : BLUE} opacity=".35" />
            )),
          )}
          <path d="M60 210 L140 140 L210 170 L280 90" stroke={SOFT} strokeWidth="1.5" opacity=".65" />
          <path d="M60 210 L140 140 L210 170 L280 90" stroke={PALE} strokeWidth="1.5" strokeDasharray="6 10" opacity=".5">
            <animate attributeName="stroke-dashoffset" from="0" to="-64" dur="6s" repeatCount="indefinite" />
          </path>
          <circle cx="60" cy="210" r="6" fill="none" stroke={BLUE} strokeWidth="1.5" />
          <circle cx="140" cy="140" r="5" fill={SOFT} opacity=".8" />
          <circle cx="210" cy="170" r="5" fill={PALE} opacity=".9" />
          <circle cx="280" cy="90" r="6" fill="none" stroke={SOFT} strokeWidth="1.5" />
        </svg>
      </CornerWrap>
      <CornerWrap className="pointer-events-none absolute -bottom-6 -right-6 z-0 w-64 sm:w-80" drift={{ y: [0, 12, 0], duration: 8 }}>
        <svg viewBox="0 0 300 120" fill="none" className="h-auto w-full" style={{ opacity: op * 0.9 }}>
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M0 ${30 + i * 22} C 60 ${14 + i * 22}, 120 ${46 + i * 22}, 180 ${30 + i * 22} S 270 ${20 + i * 22}, 300 ${30 + i * 22}`}
              stroke={i === 1 ? PALE : SOFT}
              strokeWidth="1.5"
              opacity={0.55 - i * 0.12}
            />
          ))}
        </svg>
      </CornerWrap>
    </>
  );
}

function DkvDecor({ tone }: { tone: Tone }) {
  const op = tone === "light" ? 0.55 : 0.6;
  return (
    <>
      <CornerWrap className="pointer-events-none absolute -right-14 -top-14 z-0 w-72 sm:w-[26rem]" drift={{ y: [0, -14, 0], rotate: [0, 4, 0], duration: 10 }}>
        <svg viewBox="0 0 340 300" fill="none" className="h-auto w-full" style={{ opacity: op }}>
          <circle cx="250" cy="90" r="64" fill={PALE} opacity={tone === "light" ? ".35" : ".18"} />
          <circle cx="250" cy="90" r="64" stroke={BLUE} strokeWidth="1.5" opacity=".5" strokeDasharray="4 6" />
          <rect x="30" y="150" width="120" height="80" rx="6" fill={BLUE} opacity={tone === "light" ? ".16" : ".22"} transform="rotate(-8 90 190)" />
          <path d="M20 60 C 90 20, 150 110, 230 70" stroke={SOFT} strokeWidth="2" opacity=".6" strokeLinecap="round" />
          <path d="M40 250 L180 230" stroke={tone === "light" ? NAVY : PALE} strokeWidth="1.5" opacity=".4" strokeLinecap="round" />
          <circle cx="90" cy="70" r="10" fill="none" stroke={SOFT} strokeWidth="1.5" opacity=".6" />
          <rect x="190" y="190" width="14" height="14" fill={SOFT} opacity=".5" transform="rotate(14 197 197)" />
        </svg>
      </CornerWrap>
      <CornerWrap className="pointer-events-none absolute -bottom-10 -left-10 z-0 hidden w-52 sm:block" drift={{ y: [0, 10, 0], rotate: [0, -5, 0], duration: 12 }}>
        <svg viewBox="0 0 200 160" fill="none" className="h-auto w-full" style={{ opacity: op * 0.8 }}>
          <path d="M10 130 C 60 90, 90 140, 150 80" stroke={BLUE} strokeWidth="2" opacity=".5" strokeLinecap="round" />
          <circle cx="160" cy="50" r="22" fill={SOFT} opacity=".3" />
        </svg>
      </CornerWrap>
    </>
  );
}

function TkrDecor({ tone }: { tone: Tone }) {
  const op = tone === "light" ? 0.55 : 0.6;
  const line = tone === "light" ? "rgba(5,38,89,.14)" : "rgba(193,232,255,.14)";
  return (
    <>
      <CornerWrap className="pointer-events-none absolute -right-10 -top-10 z-0 w-72 sm:w-96" drift={{ y: [0, -10, 0], duration: 9 }}>
        <svg viewBox="0 0 320 280" fill="none" className="h-auto w-full" style={{ opacity: op }}>
          <defs>
            <pattern id="tkr-blue" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0H0v30" fill="none" stroke={line} strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="30" y="10" width="280" height="250" fill="url(#tkr-blue)" rx="10" />
          <circle cx="210" cy="110" r="58" stroke={tone === "light" ? NAVY : PALE} strokeWidth="1.5" opacity=".5" />
          <circle cx="210" cy="110" r="38" stroke={BLUE} strokeWidth="1.5" strokeDasharray="5 5" opacity=".6" />
          <circle cx="210" cy="110" r="8" fill={SOFT} opacity=".6" />
          {[0, 45, 90, 135].map((a) => (
            <line key={a} x1="210" y1="110" x2={210 + 52 * Math.cos((a * Math.PI) / 180)} y2={110 + 52 * Math.sin((a * Math.PI) / 180)} stroke={SOFT} strokeWidth="1.2" opacity=".5" />
          ))}
          <path d="M40 230 H280 M40 224 V236 M120 224 V236 M200 224 V236 M280 224 V236" stroke={SOFT} strokeWidth="1.2" opacity=".55" />
        </svg>
      </CornerWrap>
      <CornerWrap className="pointer-events-none absolute -bottom-8 -left-8 z-0 hidden w-56 sm:block" drift={{ y: [0, 10, 0], duration: 11 }}>
        <svg viewBox="0 0 220 120" fill="none" className="h-auto w-full" style={{ opacity: op * 0.8 }}>
          <circle cx="60" cy="60" r="34" stroke={BLUE} strokeWidth="1.5" opacity=".55" />
          <circle cx="60" cy="60" r="12" stroke={SOFT} strokeWidth="1.2" strokeDasharray="3 4" opacity=".6" />
          <path d="M110 60 H210 M110 54 V66 M160 54 V66 M210 54 V66" stroke={SOFT} strokeWidth="1.2" opacity=".5" />
        </svg>
      </CornerWrap>
    </>
  );
}

export default function MajorDecor({ slug, tone = "dark" }: { slug: Slug; tone?: Tone }) {
  if (slug === "pplg") return <PplgDecor tone={tone} />;
  if (slug === "tjkt") return <TjktDecor tone={tone} />;
  if (slug === "dkv") return <DkvDecor tone={tone} />;
  return <TkrDecor tone={tone} />;
}
