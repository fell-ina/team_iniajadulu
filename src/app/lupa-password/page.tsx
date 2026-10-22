"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif, Inter } from "next/font/google";
import styles from "../login/login.module.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const ENDPOINT = "/api/auth/lupa-password";

/**
 * /lupa-password — meminta tautan reset kata sandi lewat email.
 * Tautan di email membuka /auth/callback?next=/reset-password, lalu pengguna
 * mengisi kata sandi baru di /reset-password.
 */
export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [terkirim, setTerkirim] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPesan(null);

    const surel = email.trim();
    if (!surel) {
      setError("Isi email akun Anda terlebih dahulu.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(surel)) {
      setError("Format email tidak valid.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: surel }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message ?? "Gagal mengirim tautan reset. Coba lagi sebentar lagi.");
        return;
      }

      setPesan(data.message ?? "Tautan reset sudah dikirim ke email Anda.");
      setTerkirim(true);
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi sebentar lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`${styles.page} ${serif.variable} ${sans.variable}`}>
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/images/school/logo-transparent.png"
            alt="logo"
            width={44}
            height={44}
            className={styles.logo}
            priority
          />
          <span>Tunas Harapan</span>
        </Link>
        <Link href="/login" className={styles.back}>
          Kembali ke halaman masuk
        </Link>
      </header>

      <section className={styles.intro}>
        <h1 className={styles.headline}>
          Lupa
          <br />
          kata sandi?
        </h1>
        <p className={styles.lead}>
          Masukkan email akun sekolah Anda. Kami kirim tautan aman untuk membuat kata sandi
          baru. Tautan berlaku terbatas, jadi segera gunakan setelah diterima.
        </p>
      </section>

      <section className={styles.stage}>
        <span className={styles.watermark} aria-hidden="true">
          SMK TUNAS HARA
          PAN
        </span>

        <div className={styles.card}>
          {terkirim ? (
            <>
              <h2 className={styles.cardTitle}>Cek email</h2>
              <p className={styles.cardHint}>
                Kalau <strong className="text-[#08152b]">{email.trim()}</strong> terdaftar,
                tautan reset kata sandi sudah dikirim. Buka tautan itu di peramban yang sama
                dengan saat Anda meminta reset.
              </p>

              <div
                role="status"
                aria-live="polite"
                className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] leading-relaxed text-emerald-900"
              >
                {pesan}
              </div>

              <button
                type="button"
                className={styles.submit}
                onClick={() => {
                  setTerkirim(false);
                  setPesan(null);
                }}
              >
                Coba email lain
              </button>

              <p className={styles.footerText}>
                Sudah punya kata sandi baru?
                <Link href="/login" className={styles.footerLink}>
                  Masuk di sini
                </Link>
              </p>
            </>
          ) : (
            <>
              <h2 className={styles.cardTitle}>Reset kata sandi</h2>
              <p className={styles.cardHint}>
                Gunakan email yang Anda pakai saat mendaftar. Tautan reset akan mengarahkan
                Anda ke formulir kata sandi baru.
              </p>

              <div role="alert" aria-live="polite">
                {error && <p className={styles.error}>{error}</p>}
              </div>

              <form onSubmit={handleSubmit} noValidate className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="email" className={styles.label}>
                    Email akun sekolah
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="nama@email.com"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? "Mengirim tautan..." : "Kirim tautan reset"}
                </button>
              </form>

              <div className="mt-5 rounded-2xl border border-[#d9e3ef] bg-[#f7fafe] px-4 py-3 text-[12.5px] leading-relaxed text-[#4b5f7a]">
                <p className="font-semibold text-[#08152b]">Belum punya email aktif?</p>
                <p className="mt-1">
                  Akun yang masuk dengan NISN atau username tidak punya kotak surat, jadi
                  tautan reset tidak bisa dikirim. Hubungi admin sekolah untuk mengatur ulang
                  kata sandi Anda. Akun Google cukup memakai tombol{" "}
                  <strong className="text-[#08152b]">Masuk dengan Google</strong>.
                </p>
              </div>

              <p className={styles.footerText}>
                Ingat kata sandi Anda?
                <Link href="/login" className={styles.footerLink}>
                  Masuk di sini
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
