"use client";

import { useState, useRef, useCallback } from "react";
import { cleanTextForSpeech, splitIntoSpeechChunks } from "@/lib/speech";

const TTS_TIMEOUT_MS = 12000;
const TTS_MAX_ATTEMPTS = 2;
const AUDIO_CACHE_LIMIT = 24;

// Mouth animation: level suara (0-255, rata-rata frekuensi rendah) dihaluskan
// lalu dipetakan ke 0..1 (tertutup..terbuka). Karena kontinu, mulut tidak
// pernah "loncat" antar pose seperti animasi 2-3 frame.
const MOUTH_LOW = 6; // di bawah ini mulut tertutup
const MOUTH_HIGH = 40; // di atas ini mulut terbuka penuh
// Konstanta waktu (ms) untuk smoothing: buka mulut responsif, menutup lebih
// pelan seperti mulut yang rileks. Berbasis waktu, jadi tetap halus di layar
// 60Hz maupun 120Hz.
const MOUTH_ATTACK_TAU = 55;
const MOUTH_RELEASE_TAU = 110;

type MouthMeter = { level: number; at: number };

/** Update level bukaan mulut 0..1 dari volume audio mentah. */
function updateMouthLevel(
  meter: MouthMeter,
  rawLevel: number,
  now: number,
): number {
  const dt = meter.at === 0 ? 16 : Math.min(50, Math.max(1, now - meter.at));
  meter.at = now;

  const tau = rawLevel > meter.level ? MOUTH_ATTACK_TAU : MOUTH_RELEASE_TAU;
  meter.level += (rawLevel - meter.level) * (1 - Math.exp(-dt / tau));

  const open = (meter.level - MOUTH_LOW) / (MOUTH_HIGH - MOUTH_LOW);
  return open < 0 ? 0 : open > 1 ? 1 : open;
}

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

function playFallbackSpeech(
  text: string,
  onEnd: () => void,
): { cancel: () => void } {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd();
    return { cancel: () => {} };
  }

  // Kalau ada sintesis lain yang lagi jalan, matikan dulu biar nggak tumpang tindih.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  let finished = false;
  let safetyTimer: number | null = null;
  let cancelled = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (safetyTimer !== null) window.clearTimeout(safetyTimer);
    onEnd();
  };

  getVoicesWhenReady((voices) => {
    if (cancelled) return;
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

  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    if (safetyTimer !== null) window.clearTimeout(safetyTimer);
    try {
      window.speechSynthesis.cancel();
    } catch {}
    onEnd();
  };

  return { cancel };
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

// Tambahkan parameter onAnalyserReady untuk menyambungkan detektor volume
async function playSoftAudio(
  blob: Blob,
  isActive: () => boolean,
  registerSource: (source: AudioBufferSourceNode | null) => void,
  registerTimer: (timer: number | null) => void,
  onAnalyserReady?: (analyser: AnalyserNode) => void,
): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === "suspended") await ctx.resume();

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

    // Volume analyzer untuk menggerakkan mulut secara real-time.
    // Smoothing tinggi berguna supaya level suara tidak melonjak-lonjak.
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;

    source.connect(highpass);
    highpass.connect(warmth);
    warmth.connect(soften);
    soften.connect(compressor);
    compressor.connect(analyser); // Audio masuk ke analyzer dulu
    analyser.connect(ctx.destination); // Baru dibuang ke speaker

    if (onAnalyserReady) onAnalyserReady(analyser);

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

  // Level bukaan mulut 0..1. Disimpan di ref (bukan state) supaya animasi bisa
  // diperbarui tiap frame tanpa me-render ulang seluruh chat.
  const mouthLevelRef = useRef(0);
  const mouthMeterRef = useRef<MouthMeter>({ level: 0, at: 0 });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const softSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const softTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const speakSeqRef = useRef(0);
  const speakAbortRef = useRef<AbortController | null>(null);
  const spokenTextRef = useRef<string | null>(null);
  const audioBlobCacheRef = useRef<Map<string, Blob>>(new Map());

  const reqAnimRef = useRef<number>(0);

  // Membaca volume suara secara real-time dan menerjemahkannya ke bukaan mulut
  const monitorAudioVolume = useCallback((analyser: AnalyserNode) => {
    // Pastikan hanya ada satu loop animasi mulut yang berjalan.
    cancelAnimationFrame(reqAnimRef.current);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const length = Math.floor(dataArray.length / 2);
    const meter = mouthMeterRef.current;

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      // Hanya menghitung rata-rata frekuensi suara manusia
      for (let i = 0; i < length; i++) sum += dataArray[i];
      mouthLevelRef.current = updateMouthLevel(
        meter,
        sum / length,
        performance.now(),
      );

      reqAnimRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  // Animasi mulut palsu untuk fallback kalau Web Audio API gagal dipakai.
  // Nilainya tetap kontinu (sine yang dihaluskan), bukan kedip tutup-buka.
  const startFakeTalking = useCallback(() => {
    cancelAnimationFrame(reqAnimRef.current);
    const startedAt = performance.now();

    const tick = () => {
      const t = (performance.now() - startedAt) / 1000;
      const syllable = (Math.sin(t * Math.PI * 2 * 3.2) + 1) / 2;
      const breath = 0.7 + 0.3 * Math.sin(t * 1.9);
      mouthLevelRef.current = 0.18 + 0.72 * syllable * breath;
      reqAnimRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  // Hentikan semua animasi mulut
  const stopMouthAnimation = useCallback(() => {
    cancelAnimationFrame(reqAnimRef.current);
    mouthMeterRef.current.level = 0;
    mouthMeterRef.current.at = 0;
    mouthLevelRef.current = 0;
  }, []);

  // Biat fallback speech synthesis bisa dimati dari stopAudio.
  const fallbackRef = useRef<{ cancel: () => void } | null>(null);

  const stopAudio = useCallback(() => {
    speakSeqRef.current += 1;
    if (speakAbortRef.current) {
      try {
        speakAbortRef.current.abort();
      } catch {}
      speakAbortRef.current = null;
    }
    // Matikan sintesis yang lagi jalan (mis. fallback yang lagi bicara).
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (fallbackRef.current) {
      try {
        fallbackRef.current.cancel();
      } catch {}
      fallbackRef.current = null;
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
    stopMouthAnimation();
  }, [stopMouthAnimation]);

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
              fallbackRef.current = playFallbackSpeech(cleanText, () => {
                if (!isActive()) return;
                spokenTextRef.current = null;
                speakAbortRef.current = null;
                setIsSpeaking(false);
                setIsVoiceLoading(false);
                stopMouthAnimation();
                fallbackRef.current = null;
              });
              startFakeTalking();
              return;
            }
            continue;
          }

          setIsVoiceLoading(false);

          // AUDIO DI-PLAY SEKALIGUS DIANALISA VOLUMENYA DI SINI
          const playedSoftly = await playSoftAudio(
            blob,
            isActive,
            (source) => {
              if (isActive()) softSourceRef.current = source;
            },
            (timer) => {
              if (isActive()) softTimerRef.current = timer;
            },
            (analyser) => {
              if (isActive()) monitorAudioVolume(analyser);
            },
          );
          if (!isActive()) return;

          if (!playedSoftly) {
            startFakeTalking();
            await playAudioElement(blob, isActive);
            stopMouthAnimation();
            if (!isActive()) return;
          }
        }

        if (isActive()) {
          spokenTextRef.current = null;
          speakAbortRef.current = null;
          setIsSpeaking(false);
          setIsVoiceLoading(false);
          stopMouthAnimation();
        }
      } catch {
        if (!isActive()) return;
        setIsVoiceLoading(false);
        fallbackRef.current = playFallbackSpeech(cleanText, () => {
          if (!isActive()) return;
          spokenTextRef.current = null;
          speakAbortRef.current = null;
          setIsSpeaking(false);
          setIsVoiceLoading(false);
          stopMouthAnimation();
          fallbackRef.current = null;
        });
        startFakeTalking();
      }
    },
    [
      isAudioEnabled,
      isSpeaking,
      isVoiceLoading,
      stopAudio,
      fetchTtsBlob,
      playAudioElement,
      monitorAudioVolume,
      startFakeTalking,
      stopMouthAnimation,
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
      if (transcript) onTranscriptUpdate(transcript);
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
    spokenTextRef,
    mouthLevelRef, // Level bukaan mulut 0..1 untuk animasi avatar
  };
}
