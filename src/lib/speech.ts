/**
 * Utilitas pemrosesan teks untuk Text-to-Speech (TTS) Fiska.
 *
 * Modul ini murni (tanpa DOM/window) sehingga bisa dipakai bersama oleh:
 * - komponen Chatbot di sisi client, dan
 * - endpoint /api/tts di sisi server.
 *
 * Fokusnya: membuat teks jawaban terdengar natural dalam bahasa Indonesia,
 * terutama pelafalan nominal uang rupiah (mis. "Rp. 3.500.000,-" dibaca
 * "tiga juta lima ratus ribu rupiah").
 */

export const SPEECH_CHUNK_TARGET = 220;
export const SPEECH_CHUNK_MAX = 320;

const SATUAN = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
];

/** Ubah bilangan menjadi kata bahasa Indonesia. */
export function angkaKeKata(input: number): string {
  if (!Number.isFinite(input)) return "";
  const rounded = Math.floor(Math.abs(input));
  const prefix = input < 0 ? "minus " : "";
  return prefix + angkaPositifKeKata(rounded);
}

function angkaPositifKeKata(n: number): string {
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${angkaPositifKeKata(n - 10)} belas`;
  if (n < 100) {
    const sisa = n % 10;
    return `${angkaPositifKeKata(Math.floor(n / 10))} puluh${
      sisa ? ` ${angkaPositifKeKata(sisa)}` : ""
    }`;
  }
  if (n < 200) {
    const sisa = n % 100;
    return `seratus${sisa ? ` ${angkaPositifKeKata(sisa)}` : ""}`;
  }
  if (n < 1000) {
    const sisa = n % 100;
    return `${angkaPositifKeKata(Math.floor(n / 100))} ratus${
      sisa ? ` ${angkaPositifKeKata(sisa)}` : ""
    }`;
  }
  if (n < 2000) {
    const sisa = n % 1000;
    return `seribu${sisa ? ` ${angkaPositifKeKata(sisa)}` : ""}`;
  }

  const satuan: Array<[number, string]> = [
    [1_000_000_000_000, "triliun"],
    [1_000_000_000, "miliar"],
    [1_000_000, "juta"],
    [1_000, "ribu"],
  ];
  for (const [nilai, label] of satuan) {
    if (n >= nilai) {
      const sisa = n % nilai;
      return `${angkaPositifKeKata(Math.floor(n / nilai))} ${label}${
        sisa ? ` ${angkaPositifKeKata(sisa)}` : ""
      }`;
    }
  }
  return "";
}

/** Angka dengan pecahan dibaca "koma", mis. 75,5 -> "tujuh puluh lima koma lima". */
function angkaDesimalKeKata(raw: string): string {
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) return raw;
  if (Number.isInteger(value)) return angkaKeKata(value);

  const [bulat, pecahan] = normalized.split(".");
  const kataPecahan = pecahan
    .split("")
    .map((digit) => SATUAN[Number(digit)] || "nol")
    .join(" ");
  return `${angkaKeKata(Number(bulat))} koma ${kataPecahan}`;
}

const MULTIPLIER: Record<string, number> = {
  k: 1_000,
  rb: 1_000,
  ribu: 1_000,
  jt: 1_000_000,
  juta: 1_000_000,
  m: 1_000_000_000,
  miliar: 1_000_000_000,
  milyar: 1_000_000_000,
};

// Angka: mendukung pemisah ribuan titik (3.500.000) maupun angka polos (3500000),
// serta pecahan koma (1,5).
const NUM = "\\d{1,3}(?:\\.\\d{3})+(?:,\\d+)?|\\d+(?:,\\d+)?";

function parseAngkaIndonesia(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : NaN;
}

function nominalKeKata(numRaw: string, suffix?: string): string | null {
  const value = parseAngkaIndonesia(numRaw);
  if (!Number.isFinite(value)) return null;
  const factor = suffix ? (MULTIPLIER[suffix.toLowerCase()] ?? 1) : 1;
  const total = Math.round(value * factor);
  if (total < 0 || total > 999_999_999_999_999) return null;
  return angkaKeKata(total);
}

const DIGIT_KATA = [
  "nol",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
];

const SINGKATAN: Record<string, string> = {
  dll: "dan lain-lain",
  dsb: "dan sebagainya",
  dst: "dan seterusnya",
  yg: "yang",
  dgn: "dengan",
  spt: "seperti",
  tdk: "tidak",
  blm: "belum",
  utk: "untuk",
  kpd: "kepada",
  thd: "terhadap",
  tsb: "tersebut",
  sbg: "sebagai",
  krn: "karena",
  // Singkatan gaya chat yang sering muncul di jawaban.
  bgt: "banget",
  tp: "tapi",
  jd: "jadi",
  dlm: "dalam",
  trs: "terus",
  // Singkatan nama bulan (mis. "17 Sep 2026").
  jan: "januari",
  feb: "februari",
  mar: "maret",
  apr: "april",
  jun: "juni",
  jul: "juli",
  agu: "agustus",
  ags: "agustus",
  sep: "september",
  okt: "oktober",
  nov: "november",
  des: "desember",
};

function gantiSingkatan(text: string): string {
  const pola = Object.keys(SINGKATAN).join("|");
  return text.replace(new RegExp(`\\b(${pola})\\b`, "gi"), (match) => {
    return SINGKATAN[match.toLowerCase()] ?? match;
  });
}

/**
 * Singkatan alamat/administratif. Memakan titik di belakangnya sekaligus
 * (mis. "Kec." -> "kecamatan", bukan "kecamatan.") dan hanya aktif sebagai
 * kata utuh, sehingga "kecamatan"/"kabupaten"/"provinsi" utuh tidak berubah.
 */
function gantiAlamat(text: string): string {
  return text
    .replace(/\bkec\.?(?![a-z])/gi, "kecamatan")
    .replace(/\bkel\.?(?![a-z])/gi, "kelurahan")
    .replace(/\bkab\.?(?![a-z])/gi, "kabupaten")
    .replace(/\bprov\.?(?![a-z])/gi, "provinsi")
    .replace(/\b(?:jl|j\.l)\.?(?![a-z])/gi, "jalan");
}

// Perkalian sederhana: "3 X 4" / "3x4" / "3 × 4" -> "tiga kali empat".
function gantiPerkalian(text: string): string {
  return text.replace(
    /\b(\d+)\s*[xX×*]\s*(\d+)\b/g,
    (match, a: string, b: string) => {
      const ka = angkaKeKata(Number(a));
      const kb = angkaKeKata(Number(b));
      return ka && kb ? `${ka} kali ${kb}` : match;
    },
  );
}

const ROMAWI_NILAI: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

// Bentuk Romawi kanonik (tanpa bentuk asal-asalan seperti "IIII").
const ROMAWI_KANONIK =
  /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

// Akronim yang kebetulan berbentuk angka Romawi dan tidak boleh diubah.
const ROMAWI_AKRONIM = new Set([
  "CD",
  "DC",
  "MM",
  "MC",
  "CM",
  "MD",
  "XL",
  "XC",
  "LX",
  "DI", // Daerah Istimewa
  "MI", // Madrasah Ibtidaiyah
  "CV",
  "CI",
  "ML",
]);

function romawiKeAngka(roman: string): number | null {
  const s = roman.toUpperCase();
  if (!s || !ROMAWI_KANONIK.test(s)) return null;
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = ROMAWI_NILAI[s[i]];
    const next = ROMAWI_NILAI[s[i + 1]] ?? 0;
    total += cur < next ? -cur : cur;
  }
  return total > 0 ? total : null;
}

// Angka Romawi: "kelas XI" -> "kelas sebelas", "Tahap II" -> "Tahap dua".
function gantiRomawi(text: string): string {
  const kataKonteks =
    "kelas|tahap|jalur|bab|jilid|semester|angkatan|tingkat|golongan|unit|pasal|ayat|usia|abad|generasi|gelombang|zona|wilayah|part|fase|juara|peringkat|rank";
  const reKonteks = new RegExp(
    `\\b(${kataKonteks})\\s+([IVXLCDM]{1,7})\\b`,
    "gi",
  );
  let hasil = text.replace(
    reKonteks,
    (match, kata: string, roman: string) => {
      const n = romawiKeAngka(roman);
      return n ? `${kata} ${angkaKeKata(n)}` : match;
    },
  );

  // Angka Romawi berdiri sendiri (huruf besar, minimal 2 huruf).
  hasil = hasil.replace(/\b([IVXLCDM]{2,7})\b/g, (match, roman: string) => {
    if (ROMAWI_AKRONIM.has(roman)) return match;
    const n = romawiKeAngka(roman);
    return n ? angkaKeKata(n) : match;
  });

  // Huruf Romawi tunggal pada konteks alamat, mis. "Senjoyo I No. 3".
  hasil = hasil.replace(
    /\b([IVXLCDM])\b(?=\s+(?:nomor|no|rt|rw|blok|gang|kavling)\b)/gi,
    (match, roman: string) => {
      const n = romawiKeAngka(roman);
      return n ? angkaKeKata(n) : match;
    },
  );
  return hasil;
}

/**
 * Perbaiki simbol agar dibaca dalam bahasa Indonesia, bukan bahasa Inggris.
 * Misalnya "&" yang tadinya terdengar "and" menjadi "dan".
 */
function gantiSimbol(text: string): string {
  return (
    text
      // Entitas HTML yang kadang tersisa dari markdown.
      .replace(/&amp;/gi, " dan ")
      .replace(/&nbsp;/gi, " ")
      // "&" -> "dan" (sebelum ini dibaca "and" oleh mesin TTS).
      .replace(/&/g, " dan ")
      .replace(/\bs\s*\/\s*d\b/gi, "sampai dengan")
      // "s.d" (dengan titik) -> "sampai dengan", tapi "S.Ds" (gelar) dibiarkan.
      .replace(/\bs\s*\.\s*d\.?(?![a-zA-Z])/gi, "sampai dengan")
      // "a/b" antar kata -> "a atau b" (mis. Putra/Putri).
      .replace(/(?<=[A-Za-z])\s*\/\s*(?=[A-Za-z])/g, " atau ")
      // Panah -> "ke".
      .replace(/\s*(?:->|=>|→|➔|➜|➝|➞|➡)\s*/g, " ke ")
      // Tanda sama dengan -> "sama dengan".
      .replace(/\s*=\s*/g, " sama dengan ")
      .replace(/\bvs\.?(?=\s|$)/gi, "versus ")
      .replace(/\bno\.?(?=\s*\d)/gi, "nomor ")
  );
}

function gantiRupiah(text: string): string {
  const re = new RegExp(
    `\\b(?:rp|idr)\\.?\\s*(${NUM})(?:\\s*(k|rb|ribu|jt|juta|m|miliar|milyar))?\\s*(?:,-)?`,
    "gi",
  );
  const hasil = text.replace(re, (match, num: string, suffix?: string) => {
    const kata = nominalKeKata(num, suffix);
    return kata ? `${kata} rupiah` : match;
  });
  // Sisa "Rp" tanpa angka dibaca sebagai "rupiah".
  return hasil.replace(/\b(?:rp|idr)\.?/gi, "rupiah");
}

function gantiMultiplier(text: string): string {
  const re = new RegExp(
    `\\b(${NUM})\\s*(k|rb|ribu|jt|juta|miliar|milyar)\\b`,
    "gi",
  );
  return text.replace(re, (match, num: string, suffix: string) => {
    const kata = nominalKeKata(num, suffix);
    return kata ? kata : match;
  });
}

function gantiGrupAngka(text: string): string {
  return text.replace(/\b(\d{1,3}(?:\.\d{3})+)\b/g, (match, num: string) => {
    const value = parseAngkaIndonesia(num);
    return Number.isFinite(value) ? angkaKeKata(value) : match;
  });
}

function gantiPersen(text: string): string {
  return text.replace(
    /\b(\d+(?:[.,]\d+)?)\s*%/g,
    (match, num: string) => `${angkaDesimalKeKata(num)} persen`,
  );
}

// Pecahan bertitik non-ribuan, mis. "8.00" -> "delapan", "8.5" -> "delapan koma lima".
// Ribuan (3 digit) sudah ditangani gantiGrupAngka lebih dulu.
function gantiDesimal(text: string): string {
  return text.replace(
    /\b(\d{1,3})\.(\d{1,2})(?!\d)/g,
    (match, bulat: string, pecahan: string) => {
      const nilaiBulat = Number(bulat);
      if (!Number.isFinite(nilaiBulat)) return match;
      if (/^0+$/.test(pecahan)) return angkaKeKata(nilaiBulat);
      const kataPecahan = pecahan
        .split("")
        .map((d) => SATUAN[Number(d)] || "nol")
        .join(" ");
      return `${angkaKeKata(nilaiBulat)} koma ${kataPecahan}`;
    },
  );
}

function gantiTelepon(text: string): string {
  const re =
    /(\+?\d[\d\s().-]{7,}\d)|(\(\s*\d{2,4}\s*\)[\s-]?\d[\d\s-]{4,}\d)|(0\d[\d\s-]{6,}\d)/g;
  return text.replace(re, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length < 9) return match;
    const plus = match.trimStart().startsWith("+") ? "plus " : "";
    const kata = digits
      .split("")
      .map((digit) => DIGIT_KATA[Number(digit)] ?? "")
      .join(" ");
    return plus + kata;
  });
}

/**
 * Normalisasi teks bahasa Indonesia agar terdengar natural saat dilafalkan:
 * nominal rupiah, angka, persen, nomor telepon, dan singkatan umum.
 */
export function normalizeIndonesianSpeech(text: string): string {
  let hasil = text;
  hasil = gantiSimbol(hasil);
  hasil = gantiAlamat(hasil);
  hasil = gantiSingkatan(hasil);
  hasil = gantiPerkalian(hasil);
  hasil = gantiRomawi(hasil);
  hasil = gantiRupiah(hasil);
  hasil = gantiMultiplier(hasil);
  hasil = gantiGrupAngka(hasil);
  hasil = gantiDesimal(hasil);
  hasil = gantiPersen(hasil);
  hasil = gantiTelepon(hasil);
  return hasil;
}

const EMOJI_RE =
  /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

/**
 * Bersihkan teks markdown/artefak knowledge base lalu normalisasi bahasa,
 * supaya teks yang dikirim ke mesin TTS (server maupun browser) konsisten.
 */
export function cleanTextForSpeech(text: string): string {
  let hasil = text;

  // Artefak knowledge base yang kadang bocor ke jawaban.
  hasil = hasil.replace(/\[span_\d+\]\((?:start|end)_span\)/gi, " ");
  hasil = hasil.replace(/\[cite:\s*[\d,\s]*\]/gi, " ");

  // Link markdown -> ambil teksnya saja.
  hasil = hasil.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Tabel markdown: buang baris pemisah (| --- | --- |) dan pipa kolom.
  hasil = hasil.replace(/^[ \t]*\|?[ \t:|-]*-{3,}[ \t:|-]*\|?[ \t]*$/gm, " ");
  hasil = hasil.replace(/\|/g, " ");

  // Karakter markdown.
  hasil = hasil.replace(/[*_~`#>]/g, "");
  hasil = hasil.replace(/[-*]\s+/g, " ");
  // Penomoran daftar ("1. ", "2) ") tidak perlu dilafalkan angkanya.
  hasil = hasil.replace(/^\s*\d+[.)]\s+/gm, " ");

  // Emoji.
  hasil = hasil.replace(EMOJI_RE, "");

  // Normalisasi bahasa & nominal.
  hasil = normalizeIndonesianSpeech(hasil);

  return hasil.replace(/\s+/g, " ").trim();
}

/**
 * Pecah teks panjang jadi potongan kecil agar TTS lebih stabil dan cepat.
 */
export function splitIntoSpeechChunks(text: string): string[] {
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
