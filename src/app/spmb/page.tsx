"use client";

/**
 * app/spmb/page.tsx
 * ---------------------------------------------------------------------------
 * Formulir SPMB / PPDB mandiri — pengganti Google Form sekolah.
 *
 *   - 12 isian: data calon siswa, asal sekolah, dua pilihan jurusan, dan
 *     orang tua / wali.
 *   - Terbuka untuk umum (tanpa akun).
 *   - Divalidasi di peramban dengan `periksaSpmb` — aturan yang sama dipakai
 *     /api/spmb sebelum data disimpan ke tabel `spmb_pendaftar`.
 * ---------------------------------------------------------------------------
 */

import { FormEvent, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif, Inter } from "next/font/google";
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck } from "lucide-react";
import { JURUSAN } from "@/lib/sekolah";
import {
  JENIS_KELAMIN,
  formatTanggalKetik,
  periksaSpmb,
  type GalatSpmb,
  type IsianSpmb,
} from "@/lib/spmb";
import styles from "./spmb.module.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const ENDPOINT = "/api/spmb";

const ISIAN_AWAL: IsianSpmb = {
  nama: "",
  email: "",
  jenisKelamin: "",
  tempatLahir: "",
  tanggalLahir: "",
  asalSekolah: "",
  alamat: "",
  noHp: "",
  jurusan1: "",
  jurusan2: "",
  namaWali: "",
  noHpWali: "",
};

/** "PPLG — Pengembangan Perangkat Lunak dan Gim" untuk ringkasan akhir. */
function namaJurusan(kode: string): string {
  const item = JURUSAN.find((j) => j.kode === kode);
  return item ? `${item.kode} — ${item.nama}` : kode;
}

export default function HalamanSpmb() {
  const [isian, setIsian] = useState<IsianSpmb>(ISIAN_AWAL);
  const [galat, setGalat] = useState<GalatSpmb>({});
  const [pesan, setPesan] = useState<string | null>(null);
  const [terkirim, setTerkirim] = useState(false);
  const [loading, setLoading] = useState(false);
  const kartuRef = useRef<HTMLDivElement | null>(null);

  /** Ubah satu isian; galat kolom itu langsung dihapus saat pengguna mengetik. */
  function ubah<K extends keyof IsianSpmb>(kunci: K, nilai: string) {
    setIsian((lama) => ({ ...lama, [kunci]: nilai }));
    setGalat((lama) => {
      if (!lama[kunci]) return lama;
      const baru = { ...lama };
      delete baru[kunci];
      return baru;
    });
  }

  /** Fokus + gulir ke kolom pertama yang bermasalah. */
  function fokusKe(kunci: keyof IsianSpmb) {
    const wadah = document.getElementById(`wadah-${kunci}`);
    if (!wadah) return;
    const target = wadah.matches("input, textarea, button")
      ? (wadah as HTMLElement)
      : wadah.querySelector<HTMLElement>("input, textarea, button");
    target?.focus({ preventScroll: true });
    wadah.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesan(null);

    const hasil = periksaSpmb(isian);
    if (!hasil.data) {
      setGalat(hasil.galat);
      setPesan(Object.values(hasil.galat)[0] ?? "Lengkapi data pendaftaran.");
      const pertama = Object.keys(hasil.galat)[0] as keyof IsianSpmb | undefined;
      if (pertama) fokusKe(pertama);
      return;
    }

    setGalat({});
    setLoading(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isian),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        if (data.galat && typeof data.galat === "object") {
          setGalat(data.galat as GalatSpmb);
        }
        setPesan(data.message || "Gagal mengirim pendaftaran. Silakan coba lagi.");
        return;
      }

      setTerkirim(true);
      kartuRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    } catch {
      setPesan("Gagal terhubung ke server. Pastikan koneksi internet Anda stabil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`${styles.page} ${serif.variable} ${sans.variable}`}>
      <section className={styles.hero}>
        <div className={styles.navRow}>
          <Link href="/" className={styles.brand}>
            <Image
              src="/images/school/logo-transparent.png"
              alt="Logo SMK Telekomunikasi Tunas Harapan"
              width={42}
              height={42}
              className={styles.logo}
              priority
            />
            <span>Tunas Harapan</span>
          </Link>
          <Link href="/" className={styles.back}>
            <ArrowLeft size={14} />
            <span>Beranda</span>
          </Link>
        </div>
      </section>

      <section className={styles.stage}>
        <div className={styles.kartu} ref={kartuRef}>
          {terkirim ? (
            <div className={styles.sukses}>
              <span className={styles.suksesIkon}>
                <BadgeCheck size={26} />
              </span>
              <h2 className={styles.suksesJudul}>Pendaftaran terkirim.</h2>
              <p className={styles.suksesTeks}>
                Terima kasih, <strong>{isian.nama.trim()}</strong>. Data Anda sudah kami
                terima. Panitia SPMB akan menghubungi Anda melalui email{" "}
                <strong>{isian.email.trim()}</strong> atau nomor WhatsApp yang Anda
                cantumkan.
              </p>
              <div className={styles.ringkas}>
                <div className={styles.ringkasBaris}>
                  <span className={styles.ringkasLabel}>Nama</span>
                  <span className={styles.ringkasNilai}>{isian.nama.trim()}</span>
                </div>
                <div className={styles.ringkasBaris}>
                  <span className={styles.ringkasLabel}>Pilihan 1</span>
                  <span className={styles.ringkasNilai}>{namaJurusan(isian.jurusan1)}</span>
                </div>
                <div className={styles.ringkasBaris}>
                  <span className={styles.ringkasLabel}>Pilihan 2</span>
                  <span className={styles.ringkasNilai}>{namaJurusan(isian.jurusan2)}</span>
                </div>
              </div>
              <Link href="/" className={styles.tautan}>
                Kembali ke beranda <ArrowUpRight size={15} />
              </Link>
            </div>
          ) : (
            <form onSubmit={kirim} noValidate>
              <div role="alert" aria-live="polite">
                {pesan && (
                  <p className={`${styles.banner} ${styles.bannerGalat}`}>{pesan}</p>
                )}
              </div>

              {/* ---------- 01. Data calon siswa ---------- */}
              <section className={styles.bagian}>
                <div className={styles.kepala}>
                  <span className={styles.nomor}>01</span>
                  <h2 className={styles.judul}>Data calon siswa</h2>
                  <p className={styles.keterangan}>Sesuai ijazah atau kartu keluarga.</p>
                </div>

                <div className={styles.grid}>
                  <FieldTeks
                    id="nama"
                    label="Nama lengkap"
                    nilai={isian.nama}
                    galat={galat.nama}
                    onUbah={(v) => ubah("nama", v)}
                    placeholder="Contoh: Budi Santoso"
                    autoComplete="name"
                    maxLength={120}
                    disabled={loading}
                  />

                  <FieldTeks
                    id="email"
                    label="Alamat email aktif"
                    nilai={isian.email}
                    galat={galat.email}
                    onUbah={(v) => ubah("email", v)}
                    jenis="email"
                    mode="email"
                    placeholder="nama@email.com"
                    autoComplete="email"
                    petunjuk="Kami kirim informasi hasil seleksi ke email ini."
                    disabled={loading}
                  />

                  <div
                    className={`${styles.field} ${styles.penuh}`}
                    id="wadah-jenisKelamin"
                  >
                    <span className={styles.label} id="label-jenis-kelamin">
                      Jenis kelamin
                    </span>
                    <div
                      className={styles.pilihan}
                      role="radiogroup"
                      aria-labelledby="label-jenis-kelamin"
                    >
                      {JENIS_KELAMIN.map((item) => (
                        <button
                          key={item.kode}
                          type="button"
                          role="radio"
                          aria-checked={isian.jenisKelamin === item.kode}
                          className={`${styles.opsi} ${
                            isian.jenisKelamin === item.kode ? styles.opsiAktif : ""
                          }`}
                          onClick={() => ubah("jenisKelamin", item.kode)}
                          disabled={loading}
                        >
                          <span className={styles.opsiKode}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                    {galat.jenisKelamin && (
                      <p className={styles.galatField}>{galat.jenisKelamin}</p>
                    )}
                  </div>

                  <FieldTeks
                    id="tempatLahir"
                    label="Tempat lahir"
                    nilai={isian.tempatLahir}
                    galat={galat.tempatLahir}
                    onUbah={(v) => ubah("tempatLahir", v)}
                    placeholder="Contoh: Salatiga"
                    maxLength={80}
                    disabled={loading}
                  />

                  <FieldTeks
                    id="tanggalLahir"
                    label="Tanggal lahir"
                    nilai={isian.tanggalLahir}
                    galat={galat.tanggalLahir}
                    onUbah={(v) => ubah("tanggalLahir", formatTanggalKetik(v))}
                    mode="numeric"
                    placeholder="dd/mm/yyyy"
                    maxLength={10}
                    petunjuk="Format: dd/mm/yyyy"
                    disabled={loading}
                  />
                </div>
              </section>

              {/* ---------- 02. Asal sekolah & kontak ---------- */}
              <section className={styles.bagian}>
                <div className={styles.kepala}>
                  <span className={styles.nomor}>02</span>
                  <h2 className={styles.judul}>Asal sekolah &amp; kontak</h2>
                </div>

                <div className={styles.grid}>
                  <FieldTeks
                    id="asalSekolah"
                    label="Asal SLTP / SMP / MTs / sederajat"
                    nilai={isian.asalSekolah}
                    galat={galat.asalSekolah}
                    onUbah={(v) => ubah("asalSekolah", v)}
                    placeholder="Contoh: SMP Negeri 1 Salatiga"
                    maxLength={120}
                    penuh
                    disabled={loading}
                  />

                  <div className={`${styles.field} ${styles.penuh}`} id="wadah-alamat">
                    <label className={styles.label} htmlFor="alamat">
                      Alamat tempat tinggal
                    </label>
                    <textarea
                      id="alamat"
                      className={styles.textarea}
                      value={isian.alamat}
                      onChange={(e) => ubah("alamat", e.target.value)}
                      placeholder="Jalan, RT/RW, kelurahan, kecamatan, kota/kabupaten"
                      maxLength={300}
                      rows={3}
                      disabled={loading}
                      aria-invalid={galat.alamat ? true : undefined}
                      aria-describedby={galat.alamat ? "alamat-galat" : undefined}
                      required
                    />
                    {galat.alamat ? (
                      <p className={styles.galatField} id="alamat-galat">
                        {galat.alamat}
                      </p>
                    ) : (
                      <p className={styles.petunjuk}>Alamat yang bisa dihubungi panitia.</p>
                    )}
                  </div>

                  <FieldTeks
                    id="noHp"
                    label="No. HP / WhatsApp"
                    nilai={isian.noHp}
                    galat={galat.noHp}
                    onUbah={(v) => ubah("noHp", v)}
                    jenis="tel"
                    mode="tel"
                    placeholder="0812 3456 7890"
                    autoComplete="tel"
                    maxLength={20}
                    petunjuk="Gunakan nomor yang aktif."
                    disabled={loading}
                  />
                </div>
              </section>

              {/* ---------- 03. Pilihan jurusan ---------- */}
              <section className={styles.bagian}>
                <div className={styles.kepala}>
                  <span className={styles.nomor}>03</span>
                  <h2 className={styles.judul}>Pilihan jurusan</h2>
                  <p className={styles.keterangan}>
                    Pilihan kedua harus berbeda dengan pilihan pertama.
                  </p>
                </div>

                <div className={styles.grid}>
                  <PilihJurusan
                    id="jurusan1"
                    label="Pilihan jurusan 1"
                    nilai={isian.jurusan1}
                    galat={galat.jurusan1}
                    onPilih={(v) => ubah("jurusan1", v)}
                    disabled={loading}
                  />
                  <PilihJurusan
                    id="jurusan2"
                    label="Pilihan jurusan 2"
                    nilai={isian.jurusan2}
                    galat={galat.jurusan2}
                    onPilih={(v) => ubah("jurusan2", v)}
                    disabled={loading}
                  />
                </div>
              </section>

              {/* ---------- 04. Orang tua / wali ---------- */}
              <section className={styles.bagian}>
                <div className={styles.kepala}>
                  <span className={styles.nomor}>04</span>
                  <h2 className={styles.judul}>Orang tua / wali</h2>
                </div>

                <div className={styles.grid}>
                  <FieldTeks
                    id="namaWali"
                    label="Nama orang tua / wali"
                    nilai={isian.namaWali}
                    galat={galat.namaWali}
                    onUbah={(v) => ubah("namaWali", v)}
                    placeholder="Nama lengkap"
                    maxLength={120}
                    disabled={loading}
                  />

                  <FieldTeks
                    id="noHpWali"
                    label="No. HP / WhatsApp orang tua / wali"
                    nilai={isian.noHpWali}
                    galat={galat.noHpWali}
                    onUbah={(v) => ubah("noHpWali", v)}
                    jenis="tel"
                    mode="tel"
                    placeholder="0812 3456 7890"
                    maxLength={20}
                    disabled={loading}
                  />
                </div>
              </section>

              <div className={styles.aksi}>
                <p className={styles.aksiCatatan}>
                  Dengan mengirim formulir ini, Anda menyatakan seluruh data yang diisi
                  benar. Panitia SPMB akan menghubungi Anda melalui email atau WhatsApp.
                </p>
                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? "Mengirim..." : "Kirim pendaftaran"}
                  {!loading && <ArrowRight size={15} />}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

/** Satu isian teks dengan label, petunjuk, dan pesan galat. */
function FieldTeks({
  id,
  label,
  nilai,
  galat,
  onUbah,
  jenis = "text",
  mode,
  placeholder,
  autoComplete,
  maxLength,
  petunjuk,
  penuh,
  disabled,
}: {
  id: keyof IsianSpmb;
  label: string;
  nilai: string;
  galat?: string;
  onUbah: (nilai: string) => void;
  jenis?: "text" | "email" | "tel";
  mode?: "text" | "email" | "tel" | "numeric";
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  petunjuk?: string;
  penuh?: boolean;
  disabled?: boolean;
}) {
  const idGalat = `${id}-galat`;

  return (
    <div
      className={`${styles.field} ${penuh ? styles.penuh : ""}`}
      id={`wadah-${id}`}
    >
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        type={jenis}
        inputMode={mode}
        value={nilai}
        onChange={(e) => onUbah(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={galat ? true : undefined}
        aria-describedby={galat ? idGalat : undefined}
        required
      />
      {galat ? (
        <p className={styles.galatField} id={idGalat}>
          {galat}
        </p>
      ) : (
        petunjuk && <p className={styles.petunjuk}>{petunjuk}</p>
      )}
    </div>
  );
}

/** Kelompok tombol pilihan jurusan (PPLG / TJKT / DKV / TKR). */
function PilihJurusan({
  id,
  label,
  nilai,
  galat,
  onPilih,
  disabled,
}: {
  id: string;
  label: string;
  nilai: string;
  galat?: string;
  onPilih: (kode: string) => void;
  disabled?: boolean;
}) {
  const idLabel = `label-${id}`;
  const idGalat = `${id}-galat`;

  return (
    <div className={styles.field} id={`wadah-${id}`}>
      <span className={styles.label} id={idLabel}>
        {label}
      </span>
      <div
        className={`${styles.pilihan} ${styles.pilihanJurusan}`}
        role="radiogroup"
        aria-labelledby={idLabel}
        aria-describedby={galat ? idGalat : undefined}
      >
        {JURUSAN.map((item) => (
          <button
            key={item.kode}
            type="button"
            role="radio"
            aria-checked={nilai === item.kode}
            className={`${styles.opsi} ${nilai === item.kode ? styles.opsiAktif : ""}`}
            onClick={() => onPilih(item.kode)}
            disabled={disabled}
          >
            <span className={styles.opsiKode}>{item.kode}</span>
            <span className={styles.opsiKet}>{item.nama}</span>
          </button>
        ))}
      </div>
      {galat && (
        <p className={styles.galatField} id={idGalat}>
          {galat}
        </p>
      )}
    </div>
  );
}
