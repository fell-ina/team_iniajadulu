import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * app/api/auth/login/route.ts
 * ---------------------------------------------------------------------------
 * Endpoint login. Alur:
 *   1. Validasi input dari front-end
 *   2. Tentukan email akun:
 *        - mengandung "@"          -> email apa adanya
 *        - 10 digit angka (NISN)   -> cari akun pelajar terverifikasi di tabel
 *                                     'users', lalu pakai email Supabase Auth
 *                                     milik akun tersebut
 *        - selain itu              -> username@sekolah.local (akun lama)
 *   3. Login lewat Supabase auth (client anon + cookie -> session tertulis)
 *   4. Ambil role dari tabel 'users' memakai client service role (tanpa cookie)
 *   5. Balas dengan URL tujuan sesuai role
 * ---------------------------------------------------------------------------
 */

const NISN_REGEX = /^\d{10}$/;
const PESAN_KREDENSIAL = "NISN/username atau kata sandi tidak cocok.";

type AdminClient = ReturnType<typeof buatAdminClient>;

function buatAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type HasilNisn =
  | { jenis: "ditemukan"; email: string; lewatGoogle: boolean }
  | { jenis: "belum"; status: string }
  | { jenis: "tidak-ada" };

/**
 * Cari akun pelajar yang sudah diverifikasi berdasarkan NISN.
 * Hanya akun berstatus 'terverifikasi' yang boleh dipakai untuk login.
 */
async function cariAkunNisn(admin: AdminClient, nisn: string): Promise<HasilNisn> {
  const { data: profil, error } = await admin
    .from("users")
    .select("id, role, verification_status")
    .eq("nisn", nisn)
    .maybeSingle();

  if (error) {
    // Kolom verifikasi bisa saja belum ada (migrasi belum dijalankan);
    // jangan sampai login biasa ikut gagal karena NISN.
    console.warn("[auth/login] gagal mencari NISN:", error.message);
    return { jenis: "tidak-ada" };
  }

  if (!profil) return { jenis: "tidak-ada" };

  // Admin/guru login lewat email atau username, bukan NISN.
  if (profil.role === "admin" || profil.role === "guru") {
    return { jenis: "tidak-ada" };
  }

  if (profil.verification_status !== "terverifikasi") {
    return { jenis: "belum", status: profil.verification_status ?? "belum" };
  }

  const { data, error: errAuth } = await admin.auth.admin.getUserById(String(profil.id));
  const email = data?.user?.email;

  if (errAuth || !email) {
    console.warn("[auth/login] akun NISN tanpa email auth:", errAuth?.message ?? "kosong");
    return { jenis: "tidak-ada" };
  }

  const providers = (data?.user?.app_metadata?.providers as string[] | undefined) ?? [];
  const lewatGoogle = providers.includes("google") && !providers.includes("email");

  return { jenis: "ditemukan", email, lewatGoogle };
}

export async function POST(request: Request) {
  // 1. Baca dan validasi input dari Front-End -------------------------------
  let body: { identifier?: string; password?: string; remember?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Permintaan tidak valid." },
      { status: 400 }
    );
  }

  const identifier = body.identifier?.trim();
  const password = body.password;

  if (!identifier || !password) {
    return NextResponse.json(
      { ok: false, message: "Isi email/NISN/username dan kata sandi terlebih dahulu." },
      { status: 400 }
    );
  }

  // 2. Tentukan email yang dipakai Supabase Auth ----------------------------
  const admin = buatAdminClient();

  // NISN: 10 digit angka (spasi/titik/strip diabaikan).
  const nisn = identifier.replace(/[\s.-]/g, "");
  const nisnDicoba = NISN_REGEX.test(nisn);

  let loginEmail: string;
  let akunNisn: HasilNisn = { jenis: "tidak-ada" };

  if (identifier.includes("@")) {
    loginEmail = identifier.toLowerCase();
  } else if (nisnDicoba) {
    akunNisn = await cariAkunNisn(admin, nisn);

    if (akunNisn.jenis === "ditemukan") {
      loginEmail = akunNisn.email;
    } else {
      // Akun lama bisa saja memakai NISN sebagai username (nisn@sekolah.local).
      loginEmail = `${nisn}@sekolah.local`;
    }
  } else {
    // Username lama: <username>@sekolah.local
    loginEmail = `${identifier.toLowerCase()}@sekolah.local`;
  }

  // 3. Login lewat Supabase (client anon + cookie) --------------------------
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
            // Abaikan error jika dipanggil dari konteks yang tidak boleh set cookie
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  });

  if (error || !data.user) {
    // NISN sudah dikirim tetapi belum/tidak lolos verifikasi admin.
    if (akunNisn.jenis === "belum") {
      const pesan =
        akunNisn.status === "menunggu"
          ? "NISN Anda masih menunggu verifikasi admin. Setelah disetujui, Anda bisa masuk memakai NISN."
          : "NISN ini belum terverifikasi sebagai pelajar. Kirim/ajukan NISN Anda lewat beranda terlebih dahulu.";
      return NextResponse.json({ ok: false, message: pesan }, { status: 403 });
    }

    // Akun pelajar terverifikasi yang mendaftar lewat Google tidak punya kata sandi.
    if (akunNisn.jenis === "ditemukan" && akunNisn.lewatGoogle) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Akun ini terdaftar lewat Google. Silakan masuk dengan tombol “Masuk dengan Google”.",
        },
        { status: 401 }
      );
    }

    // Jangan bocorkan apakah sebuah NISN/username terdaftar atau tidak.
    return NextResponse.json({ ok: false, message: PESAN_KREDENSIAL }, { status: 401 });
  }

  // 4. Ambil role memakai client service role (tanpa cookie/session) --------
  const { data: profil } = await admin
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  // 5. Tentukan tujuan berdasarkan role -------------------------------------
  const role = profil?.role;
  const redirectTo = role === "admin" || role === "guru" ? "/dashboard" : "/";

  return NextResponse.json({ ok: true, redirectTo });
}
