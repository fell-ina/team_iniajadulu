"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/app/login/login.module.css";

const ENDPOINT = "/api/auth/reset-password";

/**
 * Formulir kata sandi baru setelah tautan recovery dari email berhasil
 * ditukar menjadi session (lihat /auth/callback?next=/reset-password).
 */
export default function FormResetPassword({ email }: { email: string | null }) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== konfirmasi) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password, konfirmasi }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message ?? "Gagal menyimpan kata sandi baru. Coba lagi.");
        return;
      }

      router.push(data.redirectTo ?? "/login?reset=berhasil");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi sebentar lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className={styles.cardTitle}>Kata sandi baru</h2>
      <p className={styles.cardHint}>
        {email ? (
          <>
            Membuat kata sandi baru untuk{" "}
            <strong className="text-[#08152b]">{email}</strong>. Minimal 6 karakter.
          </>
        ) : (
          "Buat kata sandi baru untuk akun Anda. Minimal 6 karakter."
        )}
      </p>

      <div role="alert" aria-live="polite">
        {error && <p className={styles.error}>{error}</p>}
      </div>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            Kata sandi baru
          </label>
          <div className={styles.passwordWrap}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`${styles.input} ${styles.inputWithButton}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              aria-pressed={showPassword}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="konfirmasi" className={styles.label}>
            Ulangi kata sandi baru
          </label>
          <div className={styles.passwordWrap}>
            <input
              id="konfirmasi"
              name="konfirmasi"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`${styles.input} ${styles.inputWithButton}`}
              value={konfirmasi}
              onChange={(e) => setKonfirmasi(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan kata sandi"}
        </button>
      </form>

      <p className={styles.footerText}>
        Batal?
        <Link href="/login" className={styles.footerLink}>
          Kembali ke halaman masuk
        </Link>
      </p>
    </>
  );
}

/** Ikon mata untuk tombol tampilkan / sembunyikan kata sandi. */
function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M4 4l16 16" />}
    </svg>
  );
}
