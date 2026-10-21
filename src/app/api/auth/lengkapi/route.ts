import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { bacaCookiePendaftaran, hapusCookiePendaftaran } from "@/lib/pendaftaran";
import { jurusanValid, kelasValid } from "@/lib/sekolah";

/**
 * app/api/auth/lengkapi/route.ts
 * ---------------------------------------------------------------------------
 * Langkah 2 pendaftaran: pilih jurusan & kelas, baru kode verifikasi dikirim.
 *
 *   GET  /api/auth/lengkapi
 *        -> data akun yang sedang menyelesaikan pendaftaran
 *           (dari sesi Supabase, mis. daftar lewat Google, atau cookie
 *           pendaftaran untuk akun email yang baru dibuat)
 *
 *   POST /api/auth/lengkapi  { jurusan, kelas }
 *        -> simpan ke tabel `users`
 *        -> jika akun belum terverifikasi: kirim kode OTP email
 *        -> jika lewat Google/sesi: langsung selesai
 * ---------------------------------------------------------------------------
 */
export const dynamic = "force-dynamic";

type Sumber = "sesi" | "pendaftaran";

type Pengguna = {
  id: string;
  email: string;
  nama: string | null;
  sumber: Sumber;
};

function originDari(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.replace(":", "");
  if (!host) return new URL(request.url).origin;
  return `${proto}://${host}`;
}

function buatAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function namaDariMetadata(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string | null {
  const meta = user.user_metadata ?? {};
  const kandidat = [meta.nama, meta.full_name, meta.name];
  for (const nilai of kandidat) {
    if (typeof nilai === "string" && nilai.trim()) return nilai.trim();
  }
  return user.email?.split("@")[0] ?? null;
}

/** Pengguna yang berhak mengisi jurusan/kelas: sesi aktif atau pendaftar baru. */
async function ambilPengguna(admin: SupabaseClient): Promise<Pengguna | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // hanya membaca sesi; tidak perlu menulis cookie
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return {
      id: user.id,
      email: user.email ?? "",
      nama: namaDariMetadata(user),
      sumber: "sesi",
    };
  }

  const idPendaftaran = await bacaCookiePendaftaran();
  if (!idPendaftaran) return null;

  const { data, error } = await admin.auth.admin.getUserById(idPendaftaran);
  if (error || !data.user) {
    console.warn("[auth/lengkapi] pendaftar tidak ditemukan:", error?.message);
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    nama: namaDariMetadata(data.user),
    sumber: "pendaftaran",
  };
}

/** Pesan ramah untuk error database (mis. migrasi belum dijalankan). */
function pesanDatabase(pesan: string): string {
  if (/column .*(jurusan|kelas)|schema cache/i.test(pesan)) {
    return "Kolom jurusan/kelas belum ada di tabel users. Jalankan migrasi supabase/migrations/20261021000000_add_jurusan_kelas.sql lebih dulu.";
  }
  if (/violates check constraint/i.test(pesan)) {
    return "Jurusan atau kelas tidak valid.";
  }
  return pesan;
}

async function kirimKodeVerifikasi(email: string, origin: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // abaikan bila dipanggil dari konteks yang tidak boleh set cookie
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  return error?.message ?? null;
}

/** Data akun + profil untuk mengisi halaman /register/lengkapi. */
export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { ok: false, message: "Layanan autentikasi Supabase belum dikonfigurasi." },
      { status: 503 }
    );
  }

  const admin = buatAdmin();
  const pengguna = await ambilPengguna(admin);

  if (!pengguna) {
    return NextResponse.json(
      {
        ok: false,
        message: "Sesi pendaftaran tidak ditemukan. Silakan daftar ulang.",
      },
      { status: 401 }
    );
  }

  const { data: profil, error } = await admin
    .from("users")
    .select("nama, role, jurusan, kelas")
    .eq("id", pengguna.id)
    .maybeSingle();

  if (error) {
    console.warn("[auth/lengkapi] gagal membaca profil:", error.message);
    return NextResponse.json(
      { ok: false, message: pesanDatabase(error.message) },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      sumber: pengguna.sumber,
      email: pengguna.email,
      nama: profil?.nama ?? pengguna.nama,
      role: profil?.role ?? "siswa",
      jurusan: profil?.jurusan ?? null,
      kelas: profil?.kelas ?? null,
      selesai: Boolean(profil?.jurusan && profil?.kelas),
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

/** Simpan jurusan & kelas; kirim kode verifikasi hanya untuk akun email baru. */
export async function POST(request: Request) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { ok: false, message: "Layanan autentikasi Supabase belum dikonfigurasi." },
      { status: 503 }
    );
  }

  let body: { jurusan?: unknown; kelas?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Permintaan tidak valid." },
      { status: 400 }
    );
  }

  const jurusan = typeof body.jurusan === "string" ? body.jurusan.trim().toUpperCase() : "";
  const kelas = typeof body.kelas === "string" ? body.kelas.trim().toUpperCase() : "";

  if (!jurusanValid(jurusan) || !kelasValid(kelas)) {
    return NextResponse.json(
      { ok: false, message: "Pilih jurusan dan kelas terlebih dahulu." },
      { status: 400 }
    );
  }

  const admin = buatAdmin();
  const pengguna = await ambilPengguna(admin);

  if (!pengguna) {
    return NextResponse.json(
      {
        ok: false,
        message: "Sesi pendaftaran tidak ditemukan atau sudah kedaluwarsa. Silakan daftar ulang.",
      },
      { status: 401 }
    );
  }

  // Admin/guru tidak boleh diubah datanya lewat halaman pendaftaran siswa.
  const { data: profilAwal, error: errorProfil } = await admin
    .from("users")
    .select("role")
    .eq("id", pengguna.id)
    .maybeSingle();

  if (errorProfil) {
    return NextResponse.json(
      { ok: false, message: pesanDatabase(errorProfil.message) },
      { status: 400 }
    );
  }

  if (profilAwal?.role === "admin" || profilAwal?.role === "guru") {
    return NextResponse.json(
      { ok: false, message: "Halaman ini hanya untuk akun siswa." },
      { status: 403 }
    );
  }

  // Simpan data: update bila baris profil sudah ada, insert bila belum.
  const { data: terupdate, error: errorUpdate } = await admin
    .from("users")
    .update({ jurusan, kelas })
    .eq("id", pengguna.id)
    .select("id");

  if (errorUpdate) {
    console.warn("[auth/lengkapi] gagal menyimpan data:", errorUpdate.message);
    return NextResponse.json(
      { ok: false, message: pesanDatabase(errorUpdate.message) },
      { status: 400 }
    );
  }

  if (!terupdate || terupdate.length === 0) {
    const { error: errorInsert } = await admin.from("users").insert({
      id: pengguna.id,
      nama: pengguna.nama ?? pengguna.email.split("@")[0] ?? "Pengguna",
      role: "siswa",
      jurusan,
      kelas,
    });

    // 23505 = duplikat id (permintaan ganda) -> data sudah tersimpan.
    if (errorInsert && errorInsert.code !== "23505") {
      console.warn("[auth/lengkapi] gagal membuat profil:", errorInsert.message);
      return NextResponse.json(
        { ok: false, message: pesanDatabase(errorInsert.message) },
        { status: 400 }
      );
    }
  }

  // Pendaftar lewat Google sudah punya sesi -> tidak perlu kode email.
  if (pengguna.sumber === "sesi") {
    await hapusCookiePendaftaran();
    return NextResponse.json({
      ok: true,
      needsVerification: false,
      redirectTo: "/",
      message: "Data tersimpan. Selamat bergabung!",
    });
  }

  const origin = originDari(request);
  const errorKirim = await kirimKodeVerifikasi(pengguna.email, origin);

  if (errorKirim) {
    if (/already confirmed|already been confirmed|already verified/i.test(errorKirim)) {
      await hapusCookiePendaftaran();
      return NextResponse.json({
        ok: true,
        needsVerification: false,
        redirectTo: "/login",
        message: "Email Anda sudah terverifikasi. Silakan masuk.",
      });
    }

    let pesan = errorKirim;
    if (/rate limit|security purposes|too many/i.test(errorKirim)) {
      pesan = "Harap tunggu sejenak sebelum meminta kode verifikasi baru.";
    }
    return NextResponse.json(
      {
        ok: false,
        dataTersimpan: true,
        message: `Data jurusan & kelas tersimpan, tetapi kode verifikasi gagal dikirim: ${pesan}`,
      },
      { status: 400 }
    );
  }

  await hapusCookiePendaftaran();

  return NextResponse.json({
    ok: true,
    needsVerification: true,
    email: pengguna.email,
    redirectTo: `/register?verifikasi=1&email=${encodeURIComponent(pengguna.email)}`,
    message: "Kode verifikasi 6 digit telah dikirim ke email Anda.",
  });
}
