"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";

import { useFiskaSpeech } from "@/hooks/useFiskaSpeech";
import ChatHeader from "./chat/ChatHeader";
import ChatMessages from "./chat/ChatMessages";
import QuickReplies from "./chat/QuickReplies";
import ChatInput from "./chat/ChatInput";
import FiskaAvatar from "./chat/FiskaAvatar";
import FiskaStage from "./chat/FiskaStage";
import { normalizeEmotion, type FiskaEmotion } from "./chat/FiskaFace";

type ChatMessage = {
  sender: "bot" | "user";
  text: string;
  /** Emosi bot saat pesan ini dibuat (supaya avatar riwayat tetap sesuai). */
  emotion?: FiskaEmotion;
};

const INITIAL_CHAT: ChatMessage[] = [
  {
    sender: "bot",
    text: "Halo! Aku Fiska, asisten sekolah SMK Telekomunikasi Tunas Harapan. Kalau mau nanya sesuatu, ketik aja di bawah ya~~",
    emotion: "Netral",
  },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [botEmotion, setBotEmotion] = useState<FiskaEmotion>("Netral");
  const [isStageCollapsed, setIsStageCollapsed] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isShortViewport, setIsShortViewport] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const isLoadedRef = useRef(false);
  const isScrolledUpRef = useRef(false);
  const reduceMotion = useReducedMotion();

  // AMBIL mouthLevelRef DARI HOOKS
  const {
    isSpeaking,
    isVoiceLoading,
    isListening,
    speak,
    stopAudio,
    toggleListening,
    spokenTextRef,
    mouthLevelRef,
  } = useFiskaSpeech(isAudioEnabled, (text) => setMessage(text));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setIsCoarsePointer(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Preferensi lipat kartu Fiska di HP, disimpan antar sesi.
  useEffect(() => {
    try {
      setIsStageCollapsed(
        localStorage.getItem("fiska_stage_collapsed") === "1",
      );
    } catch {
      /* localStorage bisa diblokir (mode privat) - abaikan. */
    }
  }, []);

  // Layar pendek (mis. HP landscape) selalu memakai strip ringkas.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-height: 520px)");
    const apply = () => setIsShortViewport(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Kartu mobile hanya dirender di bawah breakpoint lg.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setIsNarrowViewport(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Keluar dari layar penuh berarti input tidak lagi fokus.
  useEffect(() => {
    if (!isFullscreen) setIsInputFocused(false);
  }, [isFullscreen]);

  useEffect(() => {
    const saved = localStorage.getItem("fiska_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setChatHistory(parsed);
      } catch (err) {
        console.error(err);
      }
    }
    isLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (isLoadedRef.current)
      localStorage.setItem("fiska_chat_history", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open)
        isFullscreen ? setIsFullscreen(false) : toggleOpen();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isFullscreen]);

  // Fullscreen mengunci scroll halaman (termasuk overscroll di iOS).
  useEffect(() => {
    if (!open || !isFullscreen) return;
    const previous = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    return () => {
      document.body.style.overflow = previous;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [open, isFullscreen]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = contentRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setIsScrolledUp(false);
  }, []);

  const handleContentScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    setIsScrolledUp(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
  };

  useEffect(() => {
    isScrolledUpRef.current = isScrolledUp;
  }, [isScrolledUp]);

  useEffect(() => {
    if (open && !isScrolledUpRef.current)
      scrollToBottom(reduceMotion ? "auto" : "smooth");
  }, [chatHistory, isLoading, open, scrollToBottom, reduceMotion]);

  // Kartu Fiska efektif ringkas jika: dilipat manual, keyboard terbuka di HP,
  // atau layar terlalu pendek (landscape).
  const isStageAutoCollapsed =
    isFullscreen && isNarrowViewport && isCoarsePointer && isInputFocused;
  const isStageCollapsedEffective =
    isStageCollapsed || isStageAutoCollapsed || isShortViewport;
  const canToggleStage = !isShortViewport && !isStageAutoCollapsed;

  // Saat kartu melipat/membuka, ikuti pesan terbaru kalau user tidak scroll ke atas.
  useEffect(() => {
    if (
      open &&
      isFullscreen &&
      !isStageCollapsedEffective &&
      !isScrolledUpRef.current
    ) {
      scrollToBottom(reduceMotion ? "auto" : "smooth");
    }
  }, [
    isStageCollapsedEffective,
    open,
    isFullscreen,
    scrollToBottom,
    reduceMotion,
  ]);

  const toggleOpen = useCallback(() => {
    stopAudio();
    if (open) {
      setIsFullscreen(false);
      setIsScrolledUp(false);
    }
    setOpen((prev) => !prev);
  }, [open, stopAudio]);

  const handleClearChat = () => {
    stopAudio();
    setChatHistory(INITIAL_CHAT);
    setIsScrolledUp(false);
    localStorage.removeItem("fiska_chat_history");
  };

  const toggleStage = () => {
    if (!canToggleStage) return;
    setIsStageCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("fiska_stage_collapsed", next ? "1" : "0");
      } catch {
        /* abaikan kalau localStorage diblokir */
      }
      return next;
    });
  };

  const sendMessageToBot = async (userMsg: string) => {
    if (!userMsg.trim() || isLoading) return;
    stopAudio();
    setMessage("");
    setIsScrolledUp(false);
    setChatHistory((prev) => [...prev, { sender: "user", text: userMsg }]);
    setIsLoading(true);
    setBotEmotion("Bingung");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: chatHistory }),
      });
      const data = await res.json();
      const botReply = data.reply || "Maaf, sistem sedang error.";
      const emotion = normalizeEmotion(data.emotion);
      setBotEmotion(emotion);
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: botReply, emotion },
      ]);
      speak(botReply);
    } catch {
      const errTxt =
        "Ck, koneksinya putus nih! Coba cek internetmu sendiri deh. 🙄";
      setBotEmotion("Angry");
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: errTxt, emotion: "Angry" },
      ]);
      speak(errTxt);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={
        open && isFullscreen
          ? "isolate fixed inset-0 z-80 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_28%_38%,#0a2749_0%,#04142b_42%,#010912_100%)] p-0 pt-[env(safe-area-inset-top)] backdrop-blur-md transition-all duration-300 sm:p-4 lg:flex-row lg:gap-6 lg:p-8"
          : // Position tetap, tapi pakai safe-area supaya tidak ketutup notch / home indicator.
            "fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-80"
      }
    >
      {/* Ambience layar penuh: cahaya, grid, dan pantulan lantai */}
      {open && isFullscreen && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="fiska-orb absolute -left-1/4 top-[-12%] size-[34rem] rounded-full bg-[#0d3b6b]/55 blur-[110px]" />
          <div className="fiska-orb fiska-orb-slow absolute -right-1/3 bottom-[-18%] size-[38rem] rounded-full bg-[#2b6fa3]/35 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(125,160,202,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,160,202,0.055)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_50%_45%,black,transparent_78%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(ellipse_at_50%_100%,rgba(84,131,179,0.28),transparent_70%)]" />
        </div>
      )}

      <AnimatePresence>
        {open && (
          <>
            {/* PASSING LEVEL BUKAAN MULUT KE AVATAR FISKA */}
            <FiskaAvatar
              isFullscreen={isFullscreen}
              isSpeaking={isSpeaking}
              botEmotion={botEmotion}
              mouthLevelRef={mouthLevelRef}
            />
            <motion.div
              key="chat-window"
              role="dialog"
              aria-modal={isFullscreen}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className={`flex min-h-0 flex-col overflow-hidden border border-[#7DA0CA]/25 bg-[#021024]/95 text-[#F4F9FF] shadow-[0_24px_70px_-20px_rgba(2,16,36,0.75)] backdrop-blur-2xl transition-all duration-300 ${
                isFullscreen
                  ? "h-full max-h-none w-full max-w-2xl rounded-none sm:h-[calc(100dvh_-_2rem)] sm:rounded-3xl"
                  : "mb-3 h-[clamp(18rem,75dvh,38rem)] max-h-[calc(100dvh_-_6.5rem)] w-[min(26rem,calc(100vw_-_2rem))] rounded-[1.75rem]"
              }`}
            >
              <ChatHeader
                isSpeaking={isSpeaking}
                isVoiceLoading={isVoiceLoading}
                isAudioEnabled={isAudioEnabled}
                isFullscreen={isFullscreen}
                botEmotion={botEmotion}
                mouthLevelRef={mouthLevelRef}
                onClearChat={handleClearChat}
                onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                onToggleOpen={toggleOpen}
              />
              {isFullscreen && (
                <FiskaStage
                  botEmotion={botEmotion}
                  isSpeaking={isSpeaking}
                  mouthLevelRef={mouthLevelRef}
                  isCollapsed={isStageCollapsedEffective}
                  canToggle={canToggleStage}
                  onToggle={toggleStage}
                />
              )}
              <ChatMessages
                chatHistory={chatHistory}
                isLoading={isLoading}
                isSpeaking={isSpeaking}
                isVoiceLoading={isVoiceLoading}
                spokenTextRef={spokenTextRef}
                onSpeak={speak}
                contentRef={contentRef}
                handleContentScroll={handleContentScroll}
                isScrolledUp={isScrolledUp}
                scrollToBottom={scrollToBottom}
                reduceMotion={reduceMotion ?? false}
              />
              <QuickReplies
                isLoading={isLoading}
                onSendMessage={sendMessageToBot}
                isFullscreen={isFullscreen}
              />
              <ChatInput
                message={message}
                setMessage={setMessage}
                isLoading={isLoading}
                isListening={isListening}
                onSendMessage={sendMessageToBot}
                onToggleListening={toggleListening}
                isCoarsePointer={isCoarsePointer}
                open={open}
                onFocusChange={setIsInputFocused}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!isFullscreen && (
        <motion.button
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          onClick={toggleOpen}
          aria-label={open ? "Tutup chat Fiska" : "Buka chat Fiska"}
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
                className="relative size-10 overflow-hidden rounded-full border border-[#7DA0CA]/40 sm:size-12"
              >
                <Image
                  src="/images/school/bot.png"
                  alt="Buka chat Fiska"
                  fill
                  sizes="48px"
                  priority
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
