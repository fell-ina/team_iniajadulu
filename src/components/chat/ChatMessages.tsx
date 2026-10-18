"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Square, Volume2, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import Link from "next/link";
import { cleanTextForSpeech } from "@/lib/speech";

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
    if (isInternal)
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
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
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-1 [&_li::marker]:text-[#7DA0CA] [&_strong]:font-semibold [&_strong]:text-white [&_em]:text-white/80 [&_h1]:my-2 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-white [&_h2]:my-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h3]:my-2 [&_h3]:text-[0.95em] [&_h3]:font-semibold [&_h3]:text-white [&_code]:rounded-md [&_code]:bg-black/40 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:text-[#C1E8FF] [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre]:text-[0.8em] [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[#7DA0CA]/60 [&_blockquote]:pl-3 [&_blockquote]:text-white/70 [&_hr]:my-3 [&_hr]:border-white/10";
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:#5483B3_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#5483B3]/60";

type ChatMessage = { sender: "bot" | "user"; text: string };

type Props = {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  isSpeaking: boolean;
  isVoiceLoading: boolean;
  spokenTextRef: React.MutableRefObject<string | null>;
  onSpeak: (text: string) => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
  handleContentScroll: () => void;
  isScrolledUp: boolean;
  scrollToBottom: () => void;
  reduceMotion: boolean;
};

export default function ChatMessages({
  chatHistory,
  isLoading,
  isSpeaking,
  isVoiceLoading,
  spokenTextRef,
  onSpeak,
  contentRef,
  handleContentScroll,
  isScrolledUp,
  scrollToBottom,
  reduceMotion,
}: Props) {
  return (
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
                    onClick={() => onSpeak(chat.text)}
                    className="mt-1.5 flex items-center gap-1 text-[11px] text-[#C1E8FF] opacity-70 transition-opacity hover:opacity-100"
                  >
                    {isVoiceLoading &&
                    spokenTextRef.current === cleanTextForSpeech(chat.text) ? (
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
                className="ml-auto max-w-[90%] break-words [overflow-wrap:anywhere] rounded-2xl rounded-tr-sm bg-[#C1E8FF] px-3.5 py-2.5 text-[15px] leading-relaxed font-medium text-[#021024] sm:max-w-[80%] sm:text-sm"
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
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-xs text-white/60">
                <span>Fiska sedang berpikir</span>
                <span className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`size-1.5 rounded-full bg-[#C1E8FF]/70 ${reduceMotion ? "" : "animate-bounce"}`}
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {isScrolledUp && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            onClick={() => scrollToBottom()}
            className="absolute right-3.5 bottom-3 z-10 grid size-9 place-items-center rounded-full border border-[#7DA0CA]/40 bg-[#052659]/90 text-[#C1E8FF] shadow-lg backdrop-blur transition-colors hover:bg-[#5483B3]/50 sm:right-4"
          >
            <ChevronDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
