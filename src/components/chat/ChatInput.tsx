"use client";

import { useEffect, useRef } from "react";
import { Send, Mic, MicOff } from "lucide-react";

type Props = {
  message: string;
  setMessage: (msg: string) => void;
  isLoading: boolean;
  isListening: boolean;
  onSendMessage: (msg: string) => void;
  onToggleListening: () => void;
  isCoarsePointer: boolean;
  open: boolean;
};

export default function ChatInput({
  message,
  setMessage,
  isLoading,
  isListening,
  onSendMessage,
  onToggleListening,
  isCoarsePointer,
  open,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isCoarsePointer) {
      e.preventDefault();
      onSendMessage(message);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(message);
  };

  return (
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
                ? "Sedang mendengarkan..."
                : isLoading
                  ? "Tunggu bentar ya..."
                  : "Tanya Fiska sesuatu..."
            }
            disabled={isLoading}
            className="max-h-32 min-h-9 min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-base leading-6 text-white outline-none placeholder:text-white/40 disabled:opacity-50 sm:text-sm"
          />
          <button
            type="button"
            onClick={onToggleListening}
            disabled={isLoading}
            className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors sm:size-10 ${isListening ? "animate-pulse bg-red-500/80 text-white" : "text-[#C1E8FF] hover:bg-white/10"}`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
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
  );
}
