"use client";

import { useState, useRef, useCallback } from "react";
import { cleanTextForSpeech, splitIntoSpeechChunks } from "@/lib/speech";

const TTS_TIMEOUT_MS = 12000;
const TTS_MAX_ATTEMPTS = 2;
const AUDIO_CACHE_LIMIT = 24;

const PREFERRED_FEMALE_VOICES = [
  "id-id-gadisneural",
  "id-id-ayuneural",
  "id-id-sitineural",
  "id-id-dewineural",
  "id-id-indahneural",
  "microsoftgadisonline(natural)-indonesian(indonesia)",
  "googlebahasaindonesia",
];

const MALE_MARKERS = ["ardi", "david", "andrew", "brandon", "pria", "guy"];
const FEMALE_MARKERS = [
  "gadis",
  "female",
  "wanita",
  "perempuan",
  "ayu",
  "siti",
  "dewi",
  "indah",
];

function isIndonesian(v: SpeechSynthesisVoice): boolean {
  return v.lang?.toLowerCase().startsWith("id") ?? false;
}

function isFemaleName(name: string): boolean {
  const n = name.toLowerCase();
  return FEMALE_MARKERS.some((m) => n.includes(m));
}

function isMaleName(name: string): boolean {
  const n = name.toLowerCase();
  if (n.includes("female")) return false;
  return MALE_MARKERS.some((m) => n.includes(m));
}

function pickIndonesianFemaleVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const byNormalized = new Map<string, SpeechSynthesisVoice>();
  for (const v of voices) {
    byNormalized.set(v.name.toLowerCase().replace(/\s+/g, ""), v);
  }
  for (const wanted of PREFERRED_FEMALE_VOICES) {
    const hit = byNormalized.get(wanted);
    if (hit) return hit;
  }
  return (
    voices
      .filter((v) => isIndonesian(v) && !isMaleName(v.name))
      .sort((a, b) => {
        const femaleA = isFemaleName(a.name) ? 0 : 1;
        const femaleB = isFemaleName(b.name) ? 0 : 1;
        if (femaleA !== femaleB) return femaleA - femaleB;
        return a.name.localeCompare(b.name);
      })[0] ?? null
  );
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
  utterance.rate = 0.95;
  utterance.pitch = 1;
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
        : pickIndonesianFemaleVoice(voices);

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

export function useFiskaSpeech(
  isAudioEnabled: boolean,
  onTranscriptUpdate: (text: string) => void,
) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const softSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const softTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const speakSeqRef = useRef(0);
  const speakAbortRef = useRef<AbortController | null>(null);
  const spokenTextRef = useRef<string | null>(null);
  const audioBlobCacheRef = useRef<Map<string, Blob>>(new Map());

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
    async (
      cleanText: string,
      signal: AbortSignal,
      provider?: "elevenlabs" | "edge",
      key?: 1 | 2,
    ): Promise<Blob | null> => {
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
            body: JSON.stringify({ text: cleanText, provider, key }),
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

      let provider: "elevenlabs" | "edge" | undefined;
      let key: 1 | 2 | undefined;
      try {
        const probe = await fetch(
          `/api/tts?chars=${encodeURIComponent(cleanText.length)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (probe.ok) {
          const data = (await probe.json()) as {
            provider?: "elevenlabs" | "edge";
            key?: 1 | 2;
          };
          provider = data.provider;
          key = data.key === 2 ? 2 : data.key === 1 ? 1 : undefined;
        }
      } catch {
        provider = undefined;
        key = undefined;
      }
      if (!isActive()) return;

      const pending: Array<Promise<Blob | null> | undefined> = [];
      const ensure = (index: number): Promise<Blob | null> | undefined => {
        if (index >= chunks.length) return undefined;
        if (!pending[index]) {
          pending[index] = fetchTtsBlob(
            chunks[index],
            controller.signal,
            provider,
            key,
          );
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

  const toggleListening = useCallback(() => {
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
        onTranscriptUpdate(transcript);
      }
    };

    recognition.start();
  }, [isListening, onTranscriptUpdate]);

  return {
    isSpeaking,
    isVoiceLoading,
    isListening,
    speak,
    stopAudio,
    toggleListening,
    recognitionRef,
    spokenTextRef, // <-- Tambahkan ini!
  };
}
