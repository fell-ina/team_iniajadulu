"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles, X, Minus, Loader2, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

type ChatMessage = {
  sender: "bot" | "user";
  text: string;
};

const QUICK_REPLIES = [
  "Info PPDB 2027 📝",
  "Ada jurusan apa aja? 🎯",
  "Biaya SPP & Daftar 💰",
  "Fasilitas & Asrama 🛏️",
  "Peluang kerjanya gimana? 🚀",
];

// Membersihkan markdown, link, dan emoji agar pembacaan suara Fiska lancar & natural
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Ubah link [teks](url) jadi "teks"
    .replace(/[*_~`#]/g, "") // Hapus simbol markdown
    .replace(/[-*]\s+/g, "") // Hapus bullet points
    // Hapus emoji & karakter khusus agar tidak terbaca aneh
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [indoVoice, setIndoVoice] = useState<SpeechSynthesisVoice | null>(null);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Halo! Aku Fiska, asisten sekolah SMK Telekomunikasi Tunas Harapan. Kalau mau nanya sesuatu, ketik aja di bawah ya~~",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mencari & menetapkan suara wanita Bahasa Indonesia
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Filter suara beraksen Indonesia (id-ID / id_ID)
      const idVoices = voices.filter(
        (v) => v.lang.includes("id") || v.lang.includes("ID") || v.lang.toLowerCase().includes("indonesia")
      );

      if (idVoices.length > 0) {
        // Cari suara wanita jika tersedia (misal: Google Bahasa Indonesia, Gadis, Siti, Wina, dsb)
        const femaleVoice = idVoices.find((v) =>
          /female|gadis|siti|wina|google bahasa indonesia/i.test(v.name)
        );
        setIndoVoice(femaleVoice || idVoices[0]);
      }
    };

    loadVoices();
    // Event listener karena daftar voice di browser sering dimuat secara asinkron
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Fungsi Text-to-Speech (TTS) Fiska
  const speak = useCallback(
    (text: string) => {
      if (!isAudioEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      window.speechSynthesis.cancel(); // Stop suara sebelumnya jika masih ada

      const cleanText = cleanTextForSpeech(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "id-ID";

      // Setel suara wanita Indonesia jika ditemukan
      if (indoVoice) {
        utterance.voice = indoVoice;
      }

      // Setting intonasi & kecepatan agar terdengar ramah & lancar
      utterance.rate = 1.02; // Sedikit dinaikkan agar bicaranya tidak terlalu kaku/lambat
      utterance.pitch = 1.15; // Nada suara feminim & ramah

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isAudioEnabled, indoVoice]
  );

  // Hentikan suara saat modal dilapisi/ditutup
  const toggleOpen = () => {
    if (open && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setOpen((prev) => !prev);
  };

  // Keyboard shortcut: ESC untuk menutup chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        toggleOpen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Auto scroll
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isLoading, open]);

  const sendMessageToBot = async (userMsg: string) => {
    if (!userMsg.trim() || isLoading) return;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setMessage("");
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
    } catch (error) {
      console.error("Chatbot Fetch Error:", error);
      const errorReply = "Ck, koneksinya putus nih! Coba cek internetmu sendiri deh. 😅";
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

  return (
    <div className="fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Obrolan Asisten Virtual Fiska"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-[calc(100vw-2rem)] sm:w-[400px] h-[75vh] max-h-[600px] min-h-[420px] overflow-hidden rounded-3xl border border-[#7DA0CA]/30 bg-[#021024]/95 text-[#F4F9FF] shadow-2xl backdrop-blur-2xl flex flex-col"
          >
            {/* Header */}
            <div className="relative border-b border-white/10 px-5 py-3.5 shrink-0 flex items-center justify-between bg-[#052659]/40">
              <div className="flex items-center gap-3">
                <div className="relative grid size-10 place-items-center rounded-2xl border border-[#7DA0CA]/30 bg-[#052659] text-[#C1E8FF]">
                  <Sparkles size={18} />
                  {isSpeaking && (
                    <span className="absolute -top-1 -right-1 flex size-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C1E8FF] opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-3 bg-[#5483B3]"></span>
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-sm tracking-tight text-white">Fiska</h2>
                  <p className="text-[11px] text-[#C1E8FF]/70">
                    {isSpeaking ? "Sedang berbicara..." : "Asisten Virtual Sekolah"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Toggle Audio TTS */}
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking && typeof window !== "undefined") {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }
                    setIsAudioEnabled(!isAudioEnabled);
                  }}
                  aria-label={isAudioEnabled ? "Matikan Suara Fiska" : "Aktifkan Suara Fiska"}
                  title={isAudioEnabled ? "Suara Fiska Aktif" : "Suara Muted"}
                  className={`grid size-9 place-items-center rounded-xl transition ${
                    isAudioEnabled
                      ? "text-[#C1E8FF] bg-[#5483B3]/20 hover:bg-[#5483B3]/40"
                      : "text-white/40 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                {/* Tutup Chat */}
                <button
                  type="button"
                  onClick={toggleOpen}
                  aria-label="Tutup Obrolan"
                  className="grid size-9 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition"
                >
                  <Minus size={16} />
                </button>
              </div>
            </div>

            {/* Area Obrolan */}
            <div
              className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scroll-smooth custom-scrollbar"
              aria-live="polite"
            >
              {chatHistory.map((chat, index) =>
                chat.sender === "bot" ? (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={index}
                    className="flex gap-2.5 items-start"
                  >
                    <div className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-[#5483B3]/20 text-[#C1E8FF]">
                      <Bot size={14} />
                    </div>
                    <div className="group relative max-w-[85%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.07] px-4 py-3 text-sm leading-relaxed text-white/90">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => {
                            const isInternal = href && href.startsWith("/");
                            if (isInternal) {
                              return (
                                <Link
                                  href={href}
                                  className="text-[#7DA0CA] font-medium underline underline-offset-2 hover:text-[#C1E8FF] transition-colors"
                                >
                                  {children}
                                </Link>
                              );
                            }
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#7DA0CA] font-medium underline underline-offset-2 hover:text-[#C1E8FF] transition-colors"
                              >
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {chat.text}
                      </ReactMarkdown>

                      {/* Tombol Putar Ulang Suara Per Pesan */}
                      <button
                        type="button"
                        onClick={() => speak(chat.text)}
                        aria-label="Dengarkan pesan Fiska ini"
                        title="Dengarkan Suara Fiska"
                        className="mt-2 opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-[#C1E8FF]"
                      >
                        <Volume2 size={12} />
                        <span>Dengar</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={index}
                    className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#C1E8FF] px-4 py-2.5 text-sm font-medium leading-relaxed text-[#021024] break-words"
                  >
                    {chat.text}
                  </motion.div>
                )
              )}

              {isLoading && (
                <div className="flex gap-2.5 items-center">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-[#5483B3]/20 text-[#C1E8FF]">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.07] px-4 py-2 text-xs text-white/50 italic flex gap-1">
                    <span>Fiska sedang berpikir</span>
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies Bar */}
            <div className="flex gap-2 overflow-x-auto px-4 py-2 shrink-0 bg-[#021024]/80 border-t border-white/5 no-scrollbar">
              {QUICK_REPLIES.map((text, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={isLoading}
                  onClick={() => sendMessageToBot(text)}
                  className="whitespace-nowrap rounded-xl border border-[#7DA0CA]/30 bg-[#052659]/60 px-3 py-1.5 text-xs font-medium text-[#C1E8FF] transition hover:bg-[#7DA0CA]/30 hover:text-white disabled:opacity-50"
                >
                  {text}
                </button>
              ))}
            </div>

            {/* Form Input */}
            <form onSubmit={handleFormSubmit} className="border-t border-white/10 p-3 shrink-0 bg-[#021024]">
              <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/40 p-1.5 focus-within:border-[#C1E8FF]/60 transition-colors">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isLoading ? "Tunggu bentar ya..." : "Tanya Fiska sesuatu..."}
                  disabled={isLoading}
                  aria-label="Ketik pertanyaan"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/40 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  aria-label="Kirim Pesan"
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#C1E8FF] text-[#021024] transition hover:bg-white disabled:opacity-30"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleOpen}
        aria-label={open ? "Tutup Chat" : "Buka Obrolan Fiska"}
        className="relative ml-auto grid size-14 place-items-center rounded-full border border-[#C1E8FF]/50 bg-[#052659] text-[#C1E8FF] shadow-lg transition hover:border-[#C1E8FF]"
      >
        {!open && (
          <span className="absolute inset-0 rounded-full border border-[#7DA0CA]/50 animate-ping [animation-duration:3s]" />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
              <Bot size={24} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}