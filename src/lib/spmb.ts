/**
 * src/lib/spmb.ts
 * ---------------------------------------------------------------------------
 * Aturan formulir SPMB / PPDB yang dipakai bersama oleh halaman /spmb dan
 * endpoint /api/spmb, supaya pesan galat di peramban dan validasi di server
 * tidak pernah berbeda.
 *
 * Berkas ini murni (tanpa import server) sehingga aman dipakai di client.
 * ---------------------------------------------------------------------------
 */

import { jurusanValid } from "./sekolah";

export const JENIS_KELAMIN = [
  { kode: "laki-laki", label: "Laki-laki" },
  { kode: "perempuan", label: "Perempuan" },
] as const;

export type KodeJenisKelamin = (typeof JENIS_KELAMIN)[number]["kode"];

/** Isian apa adanya dari formulir (tanggal lahir dalam format dd/mm/yyyy). */
export interface IsianSpmb {
  nama: string;
  email: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  asalSekolah: string;
  alamat: string;
  noHp: string;
  jurusan1: string;
  jurusan2: string;
  namaWali: string;
  noHpWali: string;
}

/** Bentuk yang siap disimpan ke tabel `spmb_pendaftar`. */
export interface DataSpmb {
  nama: string;
  email: string;
  jenis_kelamin: KodeJenisKelamin;
  tempat_lahir: string;
  tanggal_lahir: string;
  asal_sekolah: string;
  alamat: string;
  no_hp: string;
  jurusan_1: string;
  jurusan_2: string;
  nama_wali: string;
  no_hp_wali: string;
}

export type GalatSpmb = Partial<Record<keyof IsianSpmb, string>>;

/** Isian mentah dari JSON / state formulir — tiap kolom bisa belum ada. */
export type IsianSpmbMentah = Partial<Record<keyof IsianSpmb, unknown>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Rapikan spasi berlebih dan potong spasi di ujung. */
export function rapikanTeks(nilai: unknown): string {
  return typeof nilai === "string" ? nilai.replace(/\s+/g, " ").trim() : "";
}

export function emailValid(email: string): boolean {
  return email.length <= 254 && EMAIL_REGEX.test(email);
}

export function jenisKelaminValid(nilai: unknown): nilai is KodeJenisKelamin {
  return JENIS_KELAMIN.some((item) => item.kode === nilai);
}

/**
 * "0812-3456 7890", "0812 3456 7890", "+62 812 3456 7890" -> "081234567890".
 * Mengembalikan null bila bukan nomor seluler Indonesia yang wajar.
 */
export function rapikanNoHp(nilai: unknown): string | null {
  if (typeof nilai !== "string") return null;

  const tanpaPemisah = nilai.replace(/[\s\-().]/g, "");
  const tanpaPlus = tanpaPemisah.replace(/^\+/, "");
  const digit = tanpaPlus.startsWith("62")
    ? `0${tanpaPlus.slice(2)}`
    : tanpaPlus;

  return /^08\d{8,12}$/.test(digit) ? digit : null;
}

/**
 * Ubah "dd/mm/yyyy" menjadi "yyyy-mm-dd". Null bila format atau tanggalnya
 * tidak nyata (mis. 31/02/2010).
 */
export function tanggalIsoDariInput(teks: unknown): string | null {
  if (typeof teks !== "string") return null;

  const cocok = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(teks.trim());
  if (!cocok) return null;

  const [, hariTeks, bulanTeks, tahunTeks] = cocok;
  const hari = Number(hariTeks);
  const bulan = Number(bulanTeks);
  const tahun = Number(tahunTeks);

  if (bulan < 1 || bulan > 12 || hari < 1 || hari > 31) return null;

  // Tanggal yang "meluap" (31 Februari) akan bergeser bulan di Date.
  const cek = new Date(Date.UTC(tahun, bulan - 1, hari));
  if (
    cek.getUTCFullYear() !== tahun ||
    cek.getUTCMonth() !== bulan - 1 ||
    cek.getUTCDate() !== hari
  ) {
    return null;
  }

  return `${tahunTeks}-${bulanTeks}-${hariTeks}`;
}

/** Tanggal lahir harus di masa lalu (boleh hari ini) dan tidak absurd. */
export function tanggalLahirMasukAkal(iso: string): boolean {
  const tanggal = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(tanggal.getTime())) return false;

  const batasBawah = Date.UTC(1950, 0, 1);
  return tanggal.getTime() >= batasBawah && tanggal.getTime() <= Date.now();
}

/** Sisipkan garis miring saat pengguna mengetik angka: 12082010 -> 12/08/2010. */
export function formatTanggalKetik(nilai: string): string {
  const digit = nilai.replace(/\D/g, "").slice(0, 8);
  if (digit.length <= 2) return digit;
  if (digit.length <= 4) return `${digit.slice(0, 2)}/${digit.slice(2)}`;
  return `${digit.slice(0, 2)}/${digit.slice(2, 4)}/${digit.slice(4)}`;
}

/**
 * Periksa seluruh isian. `data` hanya terisi bila tidak ada galat sama sekali;
 * urutan kunci `galat` mengikuti urutan formulir (nama lebih dulu).
 */
export function periksaSpmb(isian: IsianSpmbMentah): {
  galat: GalatSpmb;
  data: DataSpmb | null;
} {
  const galat: GalatSpmb = {};

  const nama = rapikanTeks(isian.nama);
  if (nama.length < 2) {
    galat.nama = "Isi nama lengkap calon siswa (minimal 2 karakter).";
  } else if (nama.length > 120) {
    galat.nama = "Nama terlalu panjang (maksimal 120 karakter).";
  }

  const email = rapikanTeks(isian.email).toLowerCase();
  if (!email) {
    galat.email = "Alamat email aktif wajib diisi.";
  } else if (!emailValid(email)) {
    galat.email = "Format email tidak valid. Contoh: budi@gmail.com.";
  }

  const jenisKelamin = rapikanTeks(isian.jenisKelamin).toLowerCase();
  if (!jenisKelaminValid(jenisKelamin)) {
    galat.jenisKelamin = "Pilih jenis kelamin.";
  }

  const tempatLahir = rapikanTeks(isian.tempatLahir);
  if (tempatLahir.length < 2) {
    galat.tempatLahir = "Isi tempat lahir.";
  } else if (tempatLahir.length > 80) {
    galat.tempatLahir = "Tempat lahir terlalu panjang (maksimal 80 karakter).";
  }

  const tanggalIso = tanggalIsoDariInput(isian.tanggalLahir);
  if (!tanggalIso) {
    galat.tanggalLahir = "Tanggal lahir harus valid dengan format dd/mm/yyyy.";
  } else if (!tanggalLahirMasukAkal(tanggalIso)) {
    galat.tanggalLahir =
      "Tanggal lahir tidak boleh di masa depan (tahun minimal 1950).";
  }

  const asalSekolah = rapikanTeks(isian.asalSekolah);
  if (asalSekolah.length < 2) {
    galat.asalSekolah = "Isi asal SLTP / SMP / MTs.";
  } else if (asalSekolah.length > 120) {
    galat.asalSekolah = "Nama sekolah terlalu panjang (maksimal 120 karakter).";
  }

  const alamat = rapikanTeks(isian.alamat);
  if (alamat.length < 5) {
    galat.alamat = "Isi alamat tempat tinggal lengkap (minimal 5 karakter).";
  } else if (alamat.length > 300) {
    galat.alamat = "Alamat terlalu panjang (maksimal 300 karakter).";
  }

  const noHp = rapikanNoHp(isian.noHp);
  if (!noHp) {
    galat.noHp = "Nomor HP/WhatsApp tidak valid. Contoh: 0812 3456 7890.";
  }

  const jurusan1 = rapikanTeks(isian.jurusan1).toUpperCase();
  if (!jurusanValid(jurusan1)) {
    galat.jurusan1 = "Pilih pilihan jurusan 1.";
  }

  const jurusan2 = rapikanTeks(isian.jurusan2).toUpperCase();
  if (!jurusanValid(jurusan2)) {
    galat.jurusan2 = "Pilih pilihan jurusan 2.";
  } else if (jurusanValid(jurusan1) && jurusan1 === jurusan2) {
    galat.jurusan2 = "Pilihan jurusan 2 harus berbeda dengan pilihan jurusan 1.";
  }

  const namaWali = rapikanTeks(isian.namaWali);
  if (namaWali.length < 2) {
    galat.namaWali = "Isi nama orang tua / wali.";
  } else if (namaWali.length > 120) {
    galat.namaWali = "Nama orang tua / wali terlalu panjang (maksimal 120 karakter).";
  }

  const noHpWali = rapikanNoHp(isian.noHpWali);
  if (!noHpWali) {
    galat.noHpWali =
      "Nomor HP/WhatsApp orang tua / wali tidak valid. Contoh: 0812 3456 7890.";
  }

  if (Object.keys(galat).length > 0) {
    return { galat, data: null };
  }

  return {
    galat,
    data: {
      nama,
      email,
      jenis_kelamin: jenisKelamin as KodeJenisKelamin,
      tempat_lahir: tempatLahir,
      tanggal_lahir: tanggalIso as string,
      asal_sekolah: asalSekolah,
      alamat,
      no_hp: noHp as string,
      jurusan_1: jurusan1,
      jurusan_2: jurusan2,
      nama_wali: namaWali,
      no_hp_wali: noHpWali as string,
    },
  };
}
