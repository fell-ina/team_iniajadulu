"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

// Import Semua Child Component & Hooks yang baru kita buat
import { useFiskaSpeech } from "@/hooks/useFiskaSpeech";
import ChatHeader from "./chat/ChatHeader";
import ChatMessages from "./chat/ChatMessages";
import QuickReplies from "./chat/QuickReplies";
import ChatInput from "./chat/ChatInput";
import FiskaAvatar from "./chat/FiskaAvatar";

type ChatMessage = { sender: "bot" | "user"; text: string };

const INITIAL_CHAT: ChatMessage[] = [
  {
    sender: "bot",
    text: "Halo! Aku Fiska, asisten sekolah SMK Telekomunikasi Tunas Harapan. Kalau mau nanya sesuatu, ketik aja di bawah ya~~",
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
  const [botEmotion, setBotEmotion] = useState<
    "Netral" | "Happy" | "Sad" | "Angry" | "Bingung"
  >("Netral");

  const contentRef = useRef<HTMLDivElement>(null);
  const isLoadedRef = useRef(false);
  const isScrolledUpRef = useRef(false);
  const reduceMotion = useReducedMotion();

  // Memanggil Custom Hook Logika Suara
  const {
    isSpeaking,
    isVoiceLoading,
    isListening,
    speak,
    stopAudio,
    toggleListening,
    spokenTextRef,
  } = useFiskaSpeech(isAudioEnabled, (text) => setMessage(text));

  // --- EFEK SISTEM & UI ---
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setIsCoarsePointer(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

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

  useEffect(() => {
    if (!open || !isFullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, isFullscreen]);

  // --- LOGIKA SCROLL ---
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

  // --- ACTIONS ---
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

  // --- LOGIKA FETCH KE AI (API) ---
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
      setBotEmotion(data.emotion || "Netral");
      setChatHistory((prev) => [...prev, { sender: "bot", text: botReply }]);
      speak(botReply);
    } catch {
      const errTxt =
        "Ck, koneksinya putus nih! Coba cek internetmu sendiri deh. 🙄";
      setBotEmotion("Angry");
      setChatHistory((prev) => [...prev, { sender: "bot", text: errTxt }]);
      speak(errTxt);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={
        open && isFullscreen
          ? "fixed inset-0 z-[80] flex flex-col md:flex-row items-center justify-center gap-6 bg-black/85 p-0 pt-[env(safe-area-inset-top)] backdrop-blur-md transition-all duration-300 sm:p-4 md:p-8"
          : "fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-[80]"
      }
    >
      <AnimatePresence>
        {open && (
          <>
            <FiskaAvatar
              isFullscreen={isFullscreen}
              botEmotion={botEmotion}
              isSpeaking={isSpeaking}
            />
            <motion.div
              key="chat-window"
              role="dialog"
              aria-modal={isFullscreen}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className={`flex flex-col overflow-hidden border border-[#7DA0CA]/25 bg-[#021024]/95 text-[#F4F9FF] shadow-[0_24px_70px_-20px_rgba(2,16,36,0.75)] backdrop-blur-2xl transition-all duration-300 ${isFullscreen ? "h-full max-h-none w-full max-w-2xl rounded-none sm:h-[calc(100dvh_-_2rem)] sm:rounded-3xl" : "mb-3 h-[clamp(18rem,75dvh,38rem)] max-h-[calc(100dvh_-_6.5rem)] w-[min(26rem,calc(100vw_-_2rem))] rounded-[1.75rem]"}`}
            >
              <ChatHeader
                isSpeaking={isSpeaking}
                isVoiceLoading={isVoiceLoading}
                isAudioEnabled={isAudioEnabled}
                isFullscreen={isFullscreen}
                onClearChat={handleClearChat}
                onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                onToggleOpen={toggleOpen}
              />
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
