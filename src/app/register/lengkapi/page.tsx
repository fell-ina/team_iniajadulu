"use client";

/**
 * app/register/lengkapi/page.tsx
 * ---------------------------------------------------------------------------
 * Langkah 2 pendaftaran (wajib).
 *
 *   - Siswa memilih jurusan (PPLG / TJKT / DKV / TKR) dan kelas (X / XI / XII).
 *   - Kode verifikasi email BELUM dikirim saat akun dibuat; kode baru dikirim
 *     setelah data ini tersimpan dan baru bisa diverifikasi di /register.
 *   - Akun Google juga diarahkan ke halaman ini (mereka sudah punya sesi,
 *     jadi tidak perlu kode email).
 * ---------------------------------------------------------------------------
 */

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Instrument_Serif, Inter } from "next/font/google";
import { JURUSAN, KELAS, type KodeJurusan, type KodeKelas } from "@/lib/sekolah";
import styles from "../register.module.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const LENGKAPI_ENDPOINT = "/api/auth/lengkapi";

type InfoPendaftaran = {
  email: string;
  nama: string | null;
  role: string | null;
  jurusan: string | null;
  kelas: string | null;
  selesai: boolean;
  sumber: "sesi" | "pendaftaran";
};

export default function LengkapiPendaftaranPage() {
  const router = useRouter();

  const [info, setInfo] = useState<InfoPendaftaran | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [jurusan, setJurusan] = useState<KodeJurusan | "">("");
  const [kelas, setKelas] = useState<KodeKelas | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Ambil data akun yang sedang menyelesaikan pendaftaran.
  useEffect(() => {
    let aktif = true;

    (async () => {
      try {
        const res = await fetch(LENGKAPI_ENDPOINT, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!aktif) return;

        if (res.status === 401) {
          router.replace("/register");
          return;
        }

        if (!res.ok || !data.ok) {
          setError(data.message || "Gagal memuat data pendaftaran.");
          setMemuat(false);
          return;
        }

        // Halaman ini hanya untuk siswa.
        if (data.role === "admin" || data.role === "guru") {
          router.replace("/dashboard");
          return;
        }

        setInfo(data);
        setJurusan((data.jurusan as KodeJurusan | null) ?? "");
        setKelas((data.kelas as KodeKelas | null) ?? "");

        // Sudah lengkap -> tidak perlu mengisi lagi.
        if (data.selesai) {
          router.replace(
            data.role === "admin" || data.role === "guru" ? "/dashboard" : "/"
          );
          return;
        }

        setMemuat(false);
      } catch {
        if (aktif) {
          setError("Gagal terhubung ke server. Pastikan koneksi internet Anda stabil.");
          setMemuat(false);
        }
      }
    })();

    return () => {
      aktif = false;
    };
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!jurusan || !kelas) {
      setError("Pilih jurusan dan kelas terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(LENGKAPI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ jurusan, kelas }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setError(data.message || "Gagal menyimpan data. Silakan coba lagi.");
        return;
      }

      setSuccess(
        data.needsVerification === false
          ? data.message || "Data tersimpan. Mengalihkan..."
          : "Data tersimpan. Kode verifikasi 6 digit telah dikirim ke email Anda."
      );

      setTimeout(() => {
        router.push(data.redirectTo || "/register");
        router.refresh();
      }, 1000);
    } catch {
      setError("Gagal terhubung ke server saat menyimpan data. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const jurusanDipilih = JURUSAN.find((j) => j.kode === jurusan);

  return (
    <main className={`${styles.page} ${serif.variable} ${sans.variable}`}>
      {/* ---------- Navigasi atas ---------- */}
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/images/school/logo-transparent.png"
            alt="Logo SMK Telekomunikasi Tunas Harapan"
            width={44}
            height={44}
            className={styles.logo}
            priority
          />
          <span>Tunas Harapan</span>
        </Link>
        <Link href="/" className={styles.back}>
          Kembali ke beranda
        </Link>
      </header>

      {/* ---------- Panel kiri (biru) ---------- */}
      <section className={styles.intro}>
        <h1 className={styles.headline}>
          Data
          <br />
          sekolah.
        </h1>
        <p className={styles.lead}>
          Pilih jurusan dan kelas Anda. Kode verifikasi email baru dikirim setelah data
          ini tersimpan.
        </p>
      </section>

      {/* ---------- Panel kanan (form) ---------- */}
      <section className={styles.stage}>
        <span className={styles.watermark} aria-hidden="true">
          SMK
        </span>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Lengkapi Data</h2>
          <p className={styles.cardHint}>
            Kode verifikasi belum dikirim. Isi jurusan dan kelas Anda lebih dulu.
          </p>

          {info && (
            <p className={styles.akunRingkas}>
              Mendaftar sebagai <strong>{info.email}</strong>
              {info.sumber === "sesi" ? " (akun Google)" : ""}.
            </p>
          )}

          <div role="alert" aria-live="polite">
            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>{success}</p>}
          </div>

          {memuat && <p className={styles.memuat}>Memuat data pendaftaran…</p>}

          {error && !info && (
            <p className={styles.note}>
              <Link href="/register" className={styles.footerLink}>
                Kembali ke halaman pendaftaran
              </Link>
            </p>
          )}

          {(!error || info) && (
            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              <div className={styles.field}>
                <span className={styles.label} id="label-jurusan">
                  Jurusan
                </span>
                <div
                  className={styles.gridJurusan}
                  role="radiogroup"
                  aria-labelledby="label-jurusan"
                >
                  {JURUSAN.map((item) => (
                    <button
                      key={item.kode}
                      type="button"
                      role="radio"
                      aria-checked={jurusan === item.kode}
                      className={`${styles.opsi} ${
                        jurusan === item.kode ? styles.opsiAktif : ""
                      }`}
                      onClick={() => setJurusan(item.kode)}
                      disabled={loading}
                    >
                      <span className={styles.opsiKode}>{item.kode}</span>
                      <span className={styles.opsiKet}>{item.ket}</span>
                    </button>
                  ))}
                </div>
                {jurusanDipilih && (
                  <p className={styles.pilihanNama}>{jurusanDipilih.nama}</p>
                )}
              </div>

              <div className={styles.field}>
                <span className={styles.label} id="label-kelas">
                  Kelas
                </span>
                <div
                  className={styles.gridKelas}
                  role="radiogroup"
                  aria-labelledby="label-kelas"
                >
                  {KELAS.map((item) => (
                    <button
                      key={item.kode}
                      type="button"
                      role="radio"
                      aria-checked={kelas === item.kode}
                      className={`${styles.opsi} ${
                        kelas === item.kode ? styles.opsiAktif : ""
                      }`}
                      onClick={() => setKelas(item.kode)}
                      disabled={loading}
                    >
                      <span className={styles.opsiKode}>{item.nama}</span>
                      <span className={styles.opsiKet}>{item.ket}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className={styles.submit}
                disabled={loading || !info}
              >
                {loading ? "Menyimpan..." : "Simpan & Kirim Kode"}
              </button>
            </form>
          )}

          <p className={styles.footerText}>
            Sudah memiliki akun?
            <Link href="/login" className={styles.footerLink}>
              Masuk di sini
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
