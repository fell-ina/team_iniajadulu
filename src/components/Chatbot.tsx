"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Send,
  X,
  Minus,
  Loader2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Trash2,
  Maximize2,
  Minimize2,
  ChevronDown,
  Square,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Image from "next/image";

type ChatMessage = {
  sender: "bot" | "user";
  text: string;
};

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

const INITIAL_CHAT: ChatMessage[] = [
  {
    sender: "bot",
    text: "Halo! Aku Fiska, asisten sekolah SMK Telekomunikasi Tunas Harapan. Kalau mau nanya sesuatu, ketik aja di bawah ya~~",
  },
];

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~`#]/g, "")
    .replace(/[-*]\s+/g, "")
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

const SPEECH_CHUNK_TARGET = 220;
const SPEECH_CHUNK_MAX = 320;
const TTS_TIMEOUT_MS = 12000;
const TTS_MAX_ATTEMPTS = 2;
const AUDIO_CACHE_LIMIT = 24;

function splitIntoSpeechChunks(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  const hardSplit = (sentence: string) => {
    let part = "";
    for (const word of sentence.split(/\s+/)) {
      const candidate = part ? `${part} ${word}` : word;
      if (candidate.length > SPEECH_CHUNK_MAX && part) {
        chunks.push(part);
        part = word;
      } else {
        part = candidate;
      }
    }
    if (part.trim()) chunks.push(part.trim());
  };

  for (const sentence of parts) {
    if (sentence.length > SPEECH_CHUNK_MAX) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      hardSplit(sentence);
      continue;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > SPEECH_CHUNK_TARGET && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text];
}

const FEMALE_MARKERS = [
  "gadis",
  "female",
  "wanita",
  "perempuan",
  "google bahasa indonesia",
];
const MALE_MARKERS = ["ardi", "david", "andrew", "brandon", "pria", "guy"];

const PREFERRED_FEMALE_VOICES = [
  "id-id-gadisneural",
  "id-id-ayuneural",
  "id-id-sitineural",
  "id-id-dewineural",
  "id-id-indahneural",
];

const NATURAL_MARKERS = ["neural", "natural", "online", "premium", "enhanced"];

function isFemaleName(name: string): boolean {
  const n = name.toLowerCase();
  return FEMALE_MARKERS.some((m) => n.includes(m));
}

function isMaleName(name: string): boolean {
  const n = name.toLowerCase();
  if (n.includes("female")) return false;
  return MALE_MARKERS.some((m) => n.includes(m));
}

function isIndonesian(v: SpeechSynthesisVoice): boolean {
  return v.lang?.toLowerCase().startsWith("id") ?? false;
}

function isNaturalVoice(name: string): boolean {
  const n = name.toLowerCase();
  return NATURAL_MARKERS.some((m) => n.includes(m));
}

function pickFemaleVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  for (const wanted of PREFERRED_FEMALE_VOICES) {
    const hit = voices.find(
      (v) => v.name.toLowerCase().replace(/\s+/g, "") === wanted,
    );
    if (hit) return hit;
  }

  const safe = voices.filter((v) => !isMaleName(v.name));

  const idFemale = safe.filter((v) => isIndonesian(v) && isFemaleName(v.name));
  if (idFemale.length > 0) {
    return idFemale.find((v) => isNaturalVoice(v.name)) ?? idFemale[0];
  }

  const idAny = safe.filter((v) => isIndonesian(v));
  if (idAny.length > 0) {
    return idAny.find((v) => isNaturalVoice(v.name)) ?? idAny[0];
  }

  const anyFemale = safe.filter((v) => isFemaleName(v.name));
  if (anyFemale.length > 0) {
    return anyFemale.find((v) => isNaturalVoice(v.name)) ?? anyFemale[0];
  }

  return null;
}

let cachedFemaleVoice: SpeechSynthesisVoice | null = null;

function getVoicesWhenReady(onReady: (voices: SpeechSynthesisVoice[]) => void) {
  const synth = window.speechSynthesis;
  const existing = synth.getVoices();
  if (existing.length > 0) {
    onReady(existing);
    return;
  }

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    synth.onvoiceschanged = null;
    window.clearTimeout(safetyTimer);
    onReady(synth.getVoices());
  };

  const safetyTimer = window.setTimeout(finish, 2000);
  synth.onvoiceschanged = finish;
}

function playFallbackSpeech(text: string, onEnd: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  utterance.rate = 0.92;
  utterance.pitch = 1.1;
  utterance.volume = 1;

  let finished = false;
  let safetyTimer: number | null = null;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (safetyTimer !== null) window.clearTimeout(safetyTimer);
    onEnd();
  };

  getVoicesWhenReady((voices) => {
    const voice =
      cachedFemaleVoice && voices.includes(cachedFemaleVoice)
        ? cachedFemaleVoice
        : pickFemaleVoice(voices);

    if (voice) {
      cachedFemaleVoice = voice;
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onend = finish;
    utterance.onerror = finish;
    safetyTimer = window.setTimeout(finish, 60000);
    window.speechSynthesis.speak(utterance);
  });
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    try {
      sharedAudioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  return sharedAudioCtx;
}

async function playSoftAudio(
  blob: Blob,
  isActive: () => boolean,
  registerSource: (source: AudioBufferSourceNode | null) => void,
  registerTimer: (timer: number | null) => void,
): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const arrayBuffer = await blob.arrayBuffer();
    if (!isActive()) return true;
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    if (!isActive()) return true;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 180;
    highpass.Q.value = 0.7;

    const warmth = ctx.createBiquadFilter();
    warmth.type = "lowshelf";
    warmth.frequency.value = 300;
    warmth.gain.value = -2.5;

    const soften = ctx.createBiquadFilter();
    soften.type = "highshelf";
    soften.frequency.value = 5500;
    soften.gain.value = -5;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 20;
    compressor.ratio.value = 2.5;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.25;

    source.connect(highpass);
    highpass.connect(warmth);
    warmth.connect(soften);
    soften.connect(compressor);
    compressor.connect(ctx.destination);

    return await new Promise<boolean>((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        registerTimer(null);
        registerSource(null);
        resolve(true);
      };

      source.onended = finish;
      registerSource(source);
      registerTimer(window.setTimeout(finish, (buffer.duration + 1.5) * 1000));
      source.start();
    });
  } catch {
    return false;
  }
}

const MARKDOWN_COMPONENTS = {
  a: ({
    href = "",
    children,
  }: {
    href?: string;
    children?: React.ReactNode;
  }) => {
    const isInternal = href.startsWith("/");
    const className =
      "font-medium text-[#7DA0CA] underline decoration-[#7DA0CA]/40 underline-offset-2 transition-colors hover:text-[#C1E8FF] hover:decoration-[#C1E8FF]";

    if (isInternal) {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  },
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-2 w-full overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
      <table className="w-full min-w-[18rem] border-collapse text-left text-[0.85em]">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border-b border-[#7DA0CA]/30 px-2 py-1.5 font-semibold text-[#C1E8FF]">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border-b border-white/5 px-2 py-1.5 align-top">
      {children}
    </td>
  ),
};

const MARKDOWN_WRAPPER =
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 " +
  "[&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 " +
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 " +
  "[&_li]:my-1 [&_li::marker]:text-[#7DA0CA] " +
  "[&_strong]:font-semibold [&_strong]:text-white " +
  "[&_em]:text-white/80 " +
  "[&_h1]:my-2 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-white " +
  "[&_h2]:my-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white " +
  "[&_h3]:my-2 [&_h3]:text-[0.95em] [&_h3]:font-semibold [&_h3]:text-white " +
  "[&_code]:rounded-md [&_code]:bg-black/40 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:text-[#C1E8FF] " +
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre]:text-[0.8em] " +
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[#7DA0CA]/60 [&_blockquote]:pl-3 [&_blockquote]:text-white/70 " +
  "[&_hr]:my-3 [&_hr]:border-white/10";

const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:#5483B3_transparent] " +
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#5483B3]/60";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(INITIAL_CHAT);

  const isLoadedRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const softSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const softTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isScrolledUpRef = useRef(false);

  const speakSeqRef = useRef(0);
  const speakAbortRef = useRef<AbortController | null>(null);
  const spokenTextRef = useRef<string | null>(null);
  const audioBlobCacheRef = useRef<Map<string, Blob>>(new Map());

  const quickRepliesRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    distance: 0,
  });

  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setIsCoarsePointer(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

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
    if (quickRepliesRef.current && !isFullscreen) {
      quickRepliesRef.current.scrollLeft += e.deltaY;
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("fiska_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatHistory(parsed);
        }
      } catch (err) {
        console.error("Gagal memuat riwayat obrolan:", err);
      }
    }
    isLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (isLoadedRef.current) {
      localStorage.setItem("fiska_chat_history", JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  const stopAudio = useCallback(() => {
    speakSeqRef.current += 1;
    if (speakAbortRef.current) {
      try {
        speakAbortRef.current.abort();
      } catch {}
      speakAbortRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (softSourceRef.current) {
      softSourceRef.current.onended = null;
      try {
        softSourceRef.current.stop();
      } catch {}
      softSourceRef.current = null;
    }
    if (softTimerRef.current !== null) {
      window.clearTimeout(softTimerRef.current);
      softTimerRef.current = null;
    }
    spokenTextRef.current = null;
    setIsSpeaking(false);
    setIsVoiceLoading(false);
  }, []);

  const fetchTtsBlob = useCallback(
    async (cleanText: string, signal: AbortSignal): Promise<Blob | null> => {
      const cached = audioBlobCacheRef.current.get(cleanText);
      if (cached) return cached;

      for (let attempt = 0; attempt < TTS_MAX_ATTEMPTS; attempt++) {
        if (signal.aborted) return null;

        const controller = new AbortController();
        const onAbort = () => controller.abort();
        signal.addEventListener("abort", onAbort, { once: true });
        const timeoutId = window.setTimeout(
          () => controller.abort(),
          TTS_TIMEOUT_MS,
        );

        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: cleanText }),
            signal: controller.signal,
          });

          if (res.ok) {
            const blob = await res.blob();
            const cache = audioBlobCacheRef.current;
            cache.delete(cleanText);
            cache.set(cleanText, blob);
            while (cache.size > AUDIO_CACHE_LIMIT) {
              const oldest = cache.keys().next().value;
              if (oldest === undefined) break;
              cache.delete(oldest);
            }
            return blob;
          }
        } catch {
        } finally {
          window.clearTimeout(timeoutId);
          signal.removeEventListener("abort", onAbort);
        }
      }

      return null;
    },
    [],
  );

  const playAudioElement = useCallback(
    (blob: Blob, isActive: () => boolean): Promise<void> =>
      new Promise((resolve) => {
        if (!isActive()) {
          resolve();
          return;
        }

        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        let done = false;
        const cleanup = () => {
          if (done) return;
          done = true;
          if (audioRef.current === audio) audioRef.current = null;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onended = cleanup;
        audio.onerror = cleanup;
        audio.play().catch(cleanup);
      }),
    [],
  );

  const speak = useCallback(
    async (text: string) => {
      if (!isAudioEnabled) return;

      const cleanText = cleanTextForSpeech(text);
      if (!cleanText) return;

      if (isVoiceLoading && spokenTextRef.current === cleanText) return;
      if (isSpeaking && spokenTextRef.current === cleanText) {
        stopAudio();
        return;
      }

      stopAudio();

      const myId = speakSeqRef.current;
      const controller = new AbortController();
      speakAbortRef.current = controller;
      const isActive = () =>
        speakSeqRef.current === myId && !controller.signal.aborted;

      spokenTextRef.current = cleanText;
      setIsSpeaking(true);
      setIsVoiceLoading(true);

      const chunks = splitIntoSpeechChunks(cleanText);

      const pending: Array<Promise<Blob | null> | undefined> = [];
      const ensure = (index: number): Promise<Blob | null> | undefined => {
        if (index >= chunks.length) return undefined;
        if (!pending[index]) {
          pending[index] = fetchTtsBlob(chunks[index], controller.signal);
        }
        return pending[index];
      };

      ensure(0);
      ensure(1);

      try {
        for (let i = 0; i < chunks.length; i++) {
          if (!isActive()) return;

          const blob = await ensure(i);
          if (!isActive()) return;

          ensure(i + 1);
          ensure(i + 2);

          if (!blob) {
            if (i === 0) {
              setIsVoiceLoading(false);
              playFallbackSpeech(cleanText, () => {
                if (!isActive()) return;
                spokenTextRef.current = null;
                speakAbortRef.current = null;
                setIsSpeaking(false);
                setIsVoiceLoading(false);
              });
              return;
            }
            continue;
          }

          setIsVoiceLoading(false);

          const playedSoftly = await playSoftAudio(
            blob,
            isActive,
            (source) => {
              if (isActive()) softSourceRef.current = source;
            },
            (timer) => {
              if (isActive()) softTimerRef.current = timer;
            },
          );
          if (!isActive()) return;

          if (!playedSoftly) {
            await playAudioElement(blob, isActive);
            if (!isActive()) return;
          }
        }

        if (isActive()) {
          spokenTextRef.current = null;
          speakAbortRef.current = null;
          setIsSpeaking(false);
          setIsVoiceLoading(false);
        }
      } catch {
        if (!isActive()) return;
        setIsVoiceLoading(false);
        playFallbackSpeech(cleanText, () => {
          if (!isActive()) return;
          spokenTextRef.current = null;
          speakAbortRef.current = null;
          setIsSpeaking(false);
          setIsVoiceLoading(false);
        });
      }
    },
    [
      isAudioEnabled,
      isSpeaking,
      isVoiceLoading,
      stopAudio,
      fetchTtsBlob,
      playAudioElement,
    ],
  );

  const toggleListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser kamu belum mendukung Speech Recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "id-ID";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setMessage(transcript);
      }
    };

    recognition.start();
  };

  const handleClearChat = () => {
    stopAudio();
    setChatHistory(INITIAL_CHAT);
    setIsScrolledUp(false);
    localStorage.removeItem("fiska_chat_history");
  };

  const toggleOpen = useCallback(() => {
    stopAudio();
    if (open) {
      setIsFullscreen(false);
      setIsScrolledUp(false);
    }
    setOpen((prev) => !prev);
  }, [open, stopAudio]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          toggleOpen();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isFullscreen, toggleOpen]);

  useEffect(() => {
    if (!open || !isFullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, isFullscreen]);

  useEffect(() => {
    if (!open || isCoarsePointer) return;
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 250);
    return () => window.clearTimeout(timer);
  }, [open, isCoarsePointer]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [message, open]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = contentRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setIsScrolledUp(false);
  }, []);

  const handleContentScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsScrolledUp(distance > 80);
  };

  useEffect(() => {
    isScrolledUpRef.current = isScrolledUp;
  }, [isScrolledUp]);

  useEffect(() => {
    if (open && !isScrolledUpRef.current) {
      scrollToBottom(reduceMotion ? "auto" : "smooth");
    }
  }, [chatHistory, isLoading, open, scrollToBottom, reduceMotion]);

  useEffect(() => {
    return () => {
      stopAudio();
      recognitionRef.current?.stop();
    };
  }, [stopAudio]);

  const sendMessageToBot = async (userMsg: string) => {
    if (!userMsg.trim() || isLoading) return;

    stopAudio();

    setMessage("");
    setIsScrolledUp(false);
    setChatHistory((prev) => [...prev, { sender: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: chatHistory }),
      });

      const data = await res.json();
      const botReply = data.reply || "Maaf, sistem sedang error.";

      setChatHistory((prev) => [...prev, { sender: "bot", text: botReply }]);
      speak(botReply);
    } catch {
      const errorReply =
        "Ck, koneksinya putus nih! Coba cek internetmu sendiri deh. 🙄";
      setChatHistory((prev) => [...prev, { sender: "bot", text: errorReply }]);
      speak(errorReply);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageToBot(message);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isCoarsePointer) {
      e.preventDefault();
      sendMessageToBot(message);
    }
  };

  const iconBtn = (active: boolean, danger = false) =>
    `grid size-10 shrink-0 place-items-center rounded-xl transition-colors ${
      danger
        ? "text-white/60 hover:bg-red-500/15 hover:text-red-400"
        : active
          ? "text-[#C1E8FF] bg-[#5483B3]/25 hover:bg-[#5483B3]/45"
          : "text-white/60 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div
      className={
        open && isFullscreen
          ? "fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-0 pt-[env(safe-area-inset-top)] backdrop-blur-sm transition-all duration-300 sm:p-4"
          : "fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-[80]"
      }
    >
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal={isFullscreen}
            aria-label="Obrolan Asisten Virtual Fiska"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className={`flex flex-col overflow-hidden border border-[#7DA0CA]/25 bg-[#021024]/95 text-[#F4F9FF] shadow-[0_24px_70px_-20px_rgba(2,16,36,0.75)] backdrop-blur-2xl transition-all duration-300 ${
              isFullscreen
                ? "h-full max-h-none w-full max-w-4xl rounded-none sm:h-[calc(100dvh_-_2rem)] sm:rounded-3xl"
                : "mb-3 h-[clamp(18rem,75dvh,38rem)] max-h-[calc(100dvh_-_6.5rem)] w-[min(26rem,calc(100vw_-_2rem))] rounded-[1.75rem]"
            }`}
          >
            {/* Header */}
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
                  onClick={handleClearChat}
                  aria-label="Hapus Riwayat Chat"
                  title="Hapus Riwayat Chat"
                  className={iconBtn(false, true)}
                >
                  <Trash2 size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) {
                      stopAudio();
                    }
                    setIsAudioEnabled(!isAudioEnabled);
                  }}
                  aria-label={
                    isAudioEnabled
                      ? "Matikan Suara Fiska"
                      : "Aktifkan Suara Fiska"
                  }
                  aria-pressed={isAudioEnabled}
                  title={isAudioEnabled ? "Suara Fiska Aktif" : "Suara Muted"}
                  className={iconBtn(isAudioEnabled)}
                >
                  {isAudioEnabled ? (
                    <Volume2 size={16} />
                  ) : (
                    <VolumeX size={16} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={
                    isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"
                  }
                  aria-pressed={isFullscreen}
                  title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                  className={iconBtn(false)}
                >
                  {isFullscreen ? (
                    <Minimize2 size={16} />
                  ) : (
                    <Maximize2 size={16} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleOpen}
                  aria-label="Tutup Obrolan"
                  title="Tutup Obrolan"
                  className={iconBtn(false)}
                >
                  <Minus size={16} />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                ref={contentRef}
                onScroll={handleContentScroll}
                className={`min-h-0 flex-1 overflow-y-auto px-3.5 py-4 sm:px-4 ${SCROLLBAR}`}
                aria-live="polite"
              >
                <div className="mx-auto w-full max-w-[42rem] space-y-3.5">
                  {chatHistory.map((chat, index) =>
                    chat.sender === "bot" ? (
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={index}
                        className="flex items-start gap-2.5"
                      >
                        <div className="relative mt-1 size-7 shrink-0 overflow-hidden rounded-full border border-[#7DA0CA]/30 bg-[#052659]">
                          <Image
                            src="/images/school/bot.png"
                            alt="Bot Avatar"
                            fill
                            sizes="28px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-[92%] break-words [overflow-wrap:anywhere] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-[15px] leading-relaxed text-white/90 sm:max-w-[85%]">
                          <div className={MARKDOWN_WRAPPER}>
                            <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                              {chat.text}
                            </ReactMarkdown>
                          </div>

                          <button
                            type="button"
                            onClick={() => speak(chat.text)}
                            aria-label="Dengarkan pesan Fiska ini"
                            title="Dengarkan Suara Fiska"
                            className="mt-1.5 flex items-center gap-1 text-[11px] text-[#C1E8FF] opacity-70 transition-opacity hover:opacity-100"
                          >
                            {isVoiceLoading &&
                            spokenTextRef.current ===
                              cleanTextForSpeech(chat.text) ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                <span>Memuat suara...</span>
                              </>
                            ) : isSpeaking &&
                              spokenTextRef.current ===
                                cleanTextForSpeech(chat.text) ? (
                              <>
                                <Square size={12} />
                                <span>Berhenti</span>
                              </>
                            ) : (
                              <>
                                <Volume2 size={12} />
                                <span>Dengar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={index}
                        className="ml-auto max-w-[90%] break-words [overflow-wrap:anywhere] rounded-2xl rounded-tr-sm bg-[#C1E8FF] px-3.5 py-2.5 text-[15px] leading-relaxed font-medium break-words text-[#021024] sm:max-w-[80%] sm:text-sm"
                      >
                        {chat.text}
                      </motion.div>
                    ),
                  )}

                  {isLoading && (
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-7 shrink-0 place-items-center rounded-full bg-[#5483B3]/20 text-[#C1E8FF]">
                        <Loader2 size={14} className="animate-spin" />
                      </div>
                      <div
                        className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-xs text-white/60"
                        aria-live="polite"
                      >
                        <span>Fiska sedang berpikir</span>
                        <span
                          className="flex items-center gap-1"
                          aria-hidden="true"
                        >
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className={`size-1.5 rounded-full bg-[#C1E8FF]/70 ${
                                reduceMotion ? "" : "animate-bounce"
                              }`}
                              style={{ animationDelay: `${i * 150}ms` }}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tombol scroll ke pesan terbaru */}
              <AnimatePresence>
                {isScrolledUp && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    transition={{ duration: reduceMotion ? 0 : 0.15 }}
                    onClick={() => scrollToBottom()}
                    aria-label="Gulir ke pesan terbaru"
                    title="Pesan terbaru"
                    className="absolute right-3.5 bottom-3 z-10 grid size-9 place-items-center rounded-full border border-[#7DA0CA]/40 bg-[#052659]/90 text-[#C1E8FF] shadow-lg backdrop-blur transition-colors hover:bg-[#5483B3]/50 sm:right-4"
                  >
                    <ChevronDown size={16} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Replies */}
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
                      sendMessageToBot(text);
                    }}
                    className="shrink-0 snap-start rounded-xl border border-[#7DA0CA]/30 bg-[#052659]/60 px-3.5 py-2 text-[13px] leading-none font-medium text-[#C1E8FF] transition-colors hover:bg-[#7DA0CA]/30 hover:text-white active:bg-[#7DA0CA]/40 disabled:opacity-50"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Input */}
            <form
              onSubmit={handleFormSubmit}
              className="shrink-0 border-t border-white/10 bg-[#021024] px-3.5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
            >
              <div className="mx-auto w-full max-w-[42rem]">
                <div className="flex items-end gap-1.5 rounded-2xl border border-white/15 bg-black/40 p-1.5 transition-colors focus-within:border-[#C1E8FF]/60 sm:gap-2">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={
                      isListening
                        ? "Sedang mendengarkan ucapanmu..."
                        : isLoading
                          ? "Tunggu bentar ya..."
                          : "Tanya Fiska sesuatu..."
                    }
                    disabled={isLoading}
                    aria-label="Ketik pertanyaan"
                    autoComplete="off"
                    className="max-h-32 min-h-9 min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-base leading-6 text-white outline-none placeholder:text-white/40 disabled:opacity-50 sm:text-sm"
                  />

                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isLoading}
                    aria-label="Bicara dengan mikrofon"
                    aria-pressed={isListening}
                    title={isListening ? "Sedang Merekam..." : "Gunakan Suara"}
                    className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors sm:size-10 ${
                      isListening
                        ? "animate-pulse bg-red-500/80 text-white"
                        : "text-[#C1E8FF] hover:bg-white/10"
                    }`}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || !message.trim()}
                    aria-label="Kirim Pesan"
                    title="Kirim"
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#C1E8FF] text-[#021024] transition-colors hover:bg-white disabled:opacity-30 sm:size-10"
                  >
                    <Send size={15} />
                  </button>
                </div>
                <p className="mt-1.5 hidden text-center text-[10px] text-white/30 sm:block">
                  Enter untuk kirim · Shift+Enter untuk baris baru
                </p>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!isFullscreen && (
        <motion.button
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          onClick={toggleOpen}
          aria-label={open ? "Tutup Chat" : "Buka Obrolan Fiska"}
          aria-expanded={open}
          className="relative ml-auto grid size-14 place-items-center rounded-full border border-[#C1E8FF]/50 bg-[#052659] text-[#C1E8FF] shadow-[0_8px_30px_rgba(125,160,202,0.35)] transition-colors hover:border-[#C1E8FF] sm:size-16"
        >
          {!open && !reduceMotion && (
            <span className="absolute inset-0 animate-ping rounded-full border border-[#7DA0CA]/50 [animation-duration:3s]" />
          )}
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="close"
                initial={reduceMotion ? false : { rotate: -90 }}
                animate={{ rotate: 0 }}
                exit={reduceMotion ? undefined : { rotate: 90 }}
              >
                <X size={22} />
              </motion.span>
            ) : (
              <motion.span
                key="bot"
                initial={reduceMotion ? false : { rotate: 90 }}
                animate={{ rotate: 0 }}
                exit={reduceMotion ? undefined : { rotate: -90 }}
                className="relative size-8 overflow-hidden rounded-full sm:size-9"
              >
                <Image
                  src="/images/school/bot.png"
                  alt="Buka Chat Fiska"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </div>
  );
}
