"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import FormBeritaModal from "./FormBeritaModal";

interface Props {
  onBerhasil?: () => void;
  label?: string;
}

export default function TombolTambahBerita({ onBerhasil, label = "Tambah Berita" }: Props) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [sukses, setSukses] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setTerbuka(true)}
        className="group inline-flex items-center gap-2 rounded-full bg-[#052659] px-4 py-2.5 text-sm font-semibold text-[#C1E8FF] shadow-lg shadow-[#021024]/20 transition hover:bg-[#021024] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5483B3] focus-visible:ring-offset-2"
      >
        <Plus size={16} className="transition-transform duration-300 group-hover:rotate-90" />
        {label}
      </button>

      <AnimatePresence>
        {sukses &&
          typeof document !== "undefined" &&
          createPortal(
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              role="status"
              className="fixed right-4 top-20 z-[70] max-w-xs rounded-2xl border border-emerald-300/30 bg-[#021024]/95 px-4 py-3 text-sm text-emerald-200 shadow-2xl backdrop-blur-xl sm:right-6"
            >
              {sukses}
            </motion.div>,
            document.body
          )}
      </AnimatePresence>

      <FormBeritaModal
        terbuka={terbuka}
        onTutup={() => setTerbuka(false)}
        onSukses={(pesan) => {
          setSukses(pesan);
          window.setTimeout(() => setSukses(null), 4000);
          onBerhasil?.();
          router.refresh();
        }}
      />
    </>
  );
}
