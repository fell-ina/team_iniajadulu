import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Instrument_Serif, Inter } from "next/font/google";
import FormResetPassword from "@/components/FormResetPassword";
import styles from "../login/login.module.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

/**
 * /reset-password — formulir kata sandi baru.
 *
 * Hanya bisa dipakai setelah tautan di email dibuka: /auth/callback menukar
 * `code` menjadi session, lalu mengalihkan ke sini. Tanpa session, halaman
 * menampilkan pesan bahwa tautan tidak valid / kedaluwarsa.
 */
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  let email: string | null = null;
  let adaSession = false;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          // Halaman server hanya membaca session; tidak perlu menulis cookie.
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      adaSession = true;
      email = user.email ?? null;
    }
  }

  const pesanGagal =
    status === "gagal"
      ? "Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru untuk melanjutkan."
      : "Tautan reset belum dibuka, atau sudah kedaluwarsa. Minta tautan baru lewat halaman Lupa Kata Sandi.";

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
          Kata sandi
          <br />
          baru.
        </h1>
        <p className={styles.lead}>
          Buat kata sandi baru untuk akun sekolah Anda. Setelah tersimpan, Anda akan diarahkan
          ke halaman masuk untuk menggunakan kata sandi tersebut.
        </p>
      </section>

      <section className={styles.stage}>
        <span className={styles.watermark} aria-hidden="true">
          SMK TUNAS HARA
          PAN
        </span>

        <div className={styles.card}>
          {adaSession ? (
            <FormResetPassword email={email} />
          ) : (
            <>
              <h2 className={styles.cardTitle}>Tautan kedaluwarsa</h2>
              <p className={styles.cardHint}>
                Tautan reset kata sandi hanya bisa dipakai sekali dan berlaku terbatas.
              </p>

              <div
                role="alert"
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900"
              >
                {pesanGagal}
              </div>

              <Link
                href="/lupa-password"
                className={styles.submit}
                style={{ display: "block", textAlign: "center", marginTop: 20 }}
              >
                Minta tautan baru
              </Link>

              <p className={styles.footerText}>
                Sudah tahu kata sandi Anda?
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
