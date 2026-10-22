"use client";

/**
 * app/register/page.tsx
 * ---------------------------------------------------------------------------
 * Halaman Pendaftaran Akun SMK Telekomunikasi Tunas Harapan.
 * Fitur:
 *   - Langkah 1: Isi Nama Lengkap, Email, Kata Sandi, Konfirmasi Kata Sandi.
 *   - Langkah 2: Verifikasi Kode OTP 6 digit yang dikirim Supabase ke email.
 *   - Kirim ulang kode dengan cooldown timer 60 detik.
 * ---------------------------------------------------------------------------
 */

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Instrument_Serif, Inter } from "next/font/google";
import TombolGoogle from "@/components/TombolGoogle";
import styles from "./register.module.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

const REGISTER_ENDPOINT = "/api/auth/register";
const VERIFY_ENDPOINT = "/api/auth/verify-otp";
const RESEND_ENDPOINT = "/api/auth/resend-otp";

/** Pesan untuk kegagalan alur Google (?google=... dari /auth/callback). */
const PESAN_GOOGLE: Record<string, string> = {
  "belum-dikonfigurasi":
    "Login Google belum dikonfigurasi. Hubungi admin sekolah untuk mengaktifkannya.",
  gagal: "Pendaftaran dengan Google dibatalkan atau gagal. Silakan coba lagi.",
  "sesi-gagal":
    "Gagal menyelesaikan proses masuk. Silakan coba lagi atau daftar dengan email.",
};

export default function RegisterPage() {
  const router = useRouter();

  // Langkah: 1 = formulir pendaftaran, 2 = verifikasi OTP email
  const [step, setStep] = useState<1 | 2>(1);

  // Field formulir langkah 1
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State langkah 2 (OTP)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Param URL:
  //   ?google=<alasan>            -> kegagalan OAuth dari /auth/callback
  //   ?verifikasi=1&email=<email> -> kode OTP baru dikirim setelah data sekolah
  //                                  diisi di /register/lengkapi
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const alasan = params.get("google");
    if (alasan) {
      setError(PESAN_GOOGLE[alasan] ?? PESAN_GOOGLE.gagal);
    }

    if (params.get("verifikasi") === "1") {
      const emailDariUrl = params.get("email")?.trim().toLowerCase();
      if (emailDariUrl) setEmail(emailDariUrl);
      setStep(2);
      setResendCooldown(60);
      setSuccess("Kode verifikasi 6 digit telah dikirimkan ke email Anda.");
    }

    params.delete("google");
    params.delete("verifikasi");
    params.delete("email");
    const sisa = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${sisa ? `?${sisa}` : ""}`
    );
  }, []);

  // Countdown timer untuk kirim ulang kode
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Fokus ke input OTP pertama saat berpindah ke langkah 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle submit pendaftaran (Langkah 1)
  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedNama = nama.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedNama || !trimmedEmail || !password || !confirmPassword) {
      setError("Semua kolom formulir wajib diisi.");
      return;
    }

    if (trimmedNama.length < 2) {
      setError("Nama minimal 2 karakter.");
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(REGISTER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          nama: trimmedNama,
          email: trimmedEmail,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setError(data.message || "Gagal melakukan pendaftaran. Silakan periksa kembali data Anda.");
        return;
      }

      // Akun dibuat. Siswa wajib mengisi jurusan & kelas lebih dulu; kode
      // verifikasi baru dikirim setelah data itu tersimpan.
      setSuccess(data.message || "Akun dibuat. Lengkapi jurusan dan kelas Anda...");
      router.push(data.redirectTo || "/register/lengkapi");
    } catch {
      setError("Gagal terhubung ke server. Pastikan koneksi internet Anda stabil.");
    } finally {
      setLoading(false);
    }
  }

  // Handle perubahan digit OTP
  function handleOtpChange(index: number, val: string) {
    const cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    // Jika pengguna menempelkan (paste) beberapa digit
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split("");
      const newOtp = [...otp];
      pasted.forEach((ch, i) => {
        if (i < 6) newOtp[i] = ch;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanVal;
    setOtp(newOtp);

    // Otomatis pindah ke kotak berikutnya
    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  }

  // Handle tombol backspace pada OTP
  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  }

  // Handle submit verifikasi OTP (Langkah 2)
  async function handleVerify(e?: FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = otp.join("").trim();
    if (token.length !== 6) {
      setError("Masukkan 6 digit kode verifikasi dengan lengkap.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(VERIFY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token,
          nama: nama.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setError(data.message || "Kode verifikasi salah atau telah kedaluwarsa.");
        return;
      }

      setSuccess("Verifikasi berhasil! Mengalihkan ke dashboard...");
      setTimeout(() => {
        router.push(data.redirectTo || "/dashboard");
        router.refresh();
      }, 1200);
    } catch {
      setError("Gagal terhubung ke server saat verifikasi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // Handle kirim ulang kode
  async function handleResendCode() {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setError(data.message || "Gagal mengirim ulang kode.");
        return;
      }

      setResendCooldown(60);
      setSuccess("Kode verifikasi baru telah dikirimkan ke email Anda.");
    } catch {
      setError("Gagal meminta kode verifikasi baru.");
    } finally {
      setLoading(false);
    }
  }

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
          {step === 1 ? (
            <>
              Daftar &amp;
              <br />
              bergabung.
            </>
          ) : (
            <>
              Verifikasi
              <br />
              email.
            </>
          )}
        </h1>
        <p className={styles.lead}>
          {step === 1
            ? "Buat akun untuk mengakses ruang belajar, kegiatan siswa, dan layanan digital sekolah."
            : "Kami telah mengirimkan 6 digit kode keamanan ke email Anda untuk mengaktifkan akun."}
        </p>
      </section>

      {/* ---------- Panel kanan (form) ---------- */}
      <section className={styles.stage}>
        <span className={styles.watermark} aria-hidden="true">
          SMK
        </span>

        <div className={styles.card}>
          {step === 1 ? (
            <>
              <h2 className={styles.cardTitle}>Buat Akun</h2>

              <div role="alert" aria-live="polite">
                {error && <p className={styles.error}>{error}</p>}
                {success && <p className={styles.success}>{success}</p>}
              </div>

              <TombolGoogle className={styles.google} label="Daftar dengan Google" />
              <div className={styles.divider}>atau daftar dengan email</div>

              <form onSubmit={handleRegister} noValidate className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="nama" className={styles.label}>
                    Nama Lengkap
                  </label>
                  <input
                    id="nama"
                    type="text"
                    autoComplete="name"
                    placeholder="Contoh: Budi Santoso"
                    className={styles.input}
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="email" className={styles.label}>
                    Alamat Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@email.com"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="password" className={styles.label}>
                    Kata Sandi
                  </label>
                  <div className={styles.passwordWrap}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimal 6 karakter"
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
                      aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Konfirmasi Kata Sandi
                  </label>
                  <div className={styles.passwordWrap}>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Ketik ulang kata sandi"
                      className={`${styles.input} ${styles.inputWithButton}`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className={styles.toggle}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                    >
                      <EyeIcon open={showConfirmPassword} />
                    </button>
                  </div>
                </div>

                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? "Memproses..." : "Daftar Akun"}
                </button>
              </form>

              <p className={styles.footerText}>
                Sudah memiliki akun?
                <Link href="/login" className={styles.footerLink}>
                  Masuk di sini
                </Link>
              </p>

              <p className={styles.footerText}>
                Lupa kata sandi?
                <Link href="/lupa-password" className={styles.footerLink}>
                  Reset di sini
                </Link>
              </p>
            </>
          ) : (
            <>
              <h2 className={styles.cardTitle}>Verifikasi</h2>
              <p className={styles.cardHint}>
                Kode verifikasi atau tautan konfirmasi telah dikirim ke{" "}
                <strong className="text-[#08152b]">{email}</strong>. Anda dapat memasukkan 6 digit kode di bawah atau langsung klik tautan konfirmasi di email Anda.
              </p>

              <div role="alert" aria-live="polite">
                {error && <p className={styles.error}>{error}</p>}
                {success && <p className={styles.success}>{success}</p>}
              </div>

              <form onSubmit={handleVerify} noValidate className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>Kode Verifikasi (6 Digit)</label>
                  <div className={styles.otpWrap}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputsRef.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={styles.otpInput}
                        disabled={loading}
                        aria-label={`Digit ke-${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className={styles.resendRow}>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || loading}
                    className={styles.linkBtn}
                  >
                    {resendCooldown > 0
                      ? `Kirim ulang kode (${resendCooldown}s)`
                      : "Kirim ulang kode"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                      setSuccess(null);
                    }}
                    className={styles.linkBtn}
                  >
                    Ganti email
                  </button>
                </div>

                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? "Memverifikasi..." : "Verifikasi & Aktifkan"}
                </button>
              </form>

              <p className={styles.footerText}>
                Kembali ke
                <Link href="/login" className={styles.footerLink}>
                  Halaman Masuk
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
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
