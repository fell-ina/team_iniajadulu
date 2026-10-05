/**
 * lib/gambarMarkdown.ts
 * ---------------------------------------------------------------------------
 * Konvensi ukuran & posisi gambar inline untuk isi berita (markdown).
 *
 *  - Besar (default, full-width) : ![Keterangan](url)
 *  - Sedang (tengah, ~576px)     : ![Keterangan|sedang](url)
 *  - Kecil (tengah, ~384px)      : ![Keterangan|kecil](url)
 *  - Kiri (mengambang kiri, teks mengalir di kanan seperti Word)
 *                                : ![Keterangan|kiri](url)
 *  - Kanan (mengambang kanan)    : ![Keterangan|kanan](url)
 *
 * Suffix `|...` dibaca saat render dan diubah jadi class Tailwind yang
 * sesuai. Konten lama tanpa suffix tetap dianggap besar,
 * jadi backward-compatible.
 * Di layar kecil (HP) gambar kiri/kanan otomatis jadi full-width
 * agar teks tidak terjepit.
 * ---------------------------------------------------------------------------
 */

export type UkuranGambarInline = "kecil" | "sedang" | "besar" | "kiri" | "kanan";

const SEMUA_UKURAN: UkuranGambarInline[] = ["kecil", "sedang", "besar", "kiri", "kanan"];

export function parseAltGambar(alt?: string | null): {
  caption: string;
  ukuran: UkuranGambarInline;
} {
  const teks = (alt ?? "").trim();
  if (!teks) return { caption: "", ukuran: "besar" };
  const idx = teks.lastIndexOf("|");
  if (idx === -1) return { caption: teks, ukuran: "besar" };
  const suffix = teks.slice(idx + 1).trim().toLowerCase();
  if ((SEMUA_UKURAN as string[]).includes(suffix)) {
    return { caption: teks.slice(0, idx).trim(), ukuran: suffix as UkuranGambarInline };
  }
  return { caption: teks, ukuran: "besar" };
}

export function kelasGambarInline(
  ukuran: UkuranGambarInline,
  konteks: "detail" | "pratinjau" = "detail"
): string {
  if (konteks === "pratinjau") {
    if (ukuran === "kecil")
      return "my-3 mx-auto w-full max-w-[220px] rounded-xl object-cover shadow";
    if (ukuran === "sedang")
      return "my-3 mx-auto w-full max-w-sm rounded-xl object-cover shadow";
    if (ukuran === "kiri")
      return "my-2 mr-3 mb-3 w-1/2 max-w-[200px] rounded-xl object-cover shadow float-left sm:max-w-[240px]";
    if (ukuran === "kanan")
      return "my-2 ml-3 mb-3 w-1/2 max-w-[200px] rounded-xl object-cover shadow float-right sm:max-w-[240px]";
    return "my-3 w-full rounded-xl object-cover shadow";
  }
  if (ukuran === "kecil")
    return "my-8 mx-auto w-full max-w-sm rounded-[1.5rem] object-cover shadow-lg";
  if (ukuran === "sedang")
    return "my-8 mx-auto w-full max-w-xl rounded-[1.5rem] object-cover shadow-lg";
  // Mengambang seperti Word: di HP jadi full-width, di layar sm+ baru float
  // agar teks tidak terjepit.
  if (ukuran === "kiri")
    return "mb-4 mt-2 w-full rounded-[1.2rem] object-cover shadow-lg sm:float-left sm:mr-6 sm:w-[42%] sm:max-w-xs";
  if (ukuran === "kanan")
    return "mb-4 mt-2 w-full rounded-[1.2rem] object-cover shadow-lg sm:float-right sm:ml-6 sm:w-[42%] sm:max-w-xs";
  return "my-8 max-h-[560px] w-full rounded-[1.5rem] object-cover shadow-lg";
}

/** Bentuk markdown untuk disisipkan di posisi kursor. */
export function buatMarkdownGambar(nama: string, url: string, ukuran: UkuranGambarInline): string {
  const bersih = (nama || "gambar").replace(/[\[\]|]/g, "").slice(0, 40) || "gambar";
  if (ukuran === "besar") return `\n\n![${bersih}](${url})\n\n`;
  return `\n\n![${bersih}|${ukuran}](${url})\n\n`;
}
