import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * app/api/auth/login/route.ts
 * ---------------------------------------------------------------------------
 * Endpoint login. Alur:
 *   1. Validasi input dari front-end
 *   2. Login lewat Supabase auth (client anon + cookie -> session tertulis)
 *   3. Ambil role dari tabel 'users' memakai client service role (tanpa cookie)
 *   4. Balas dengan URL tujuan sesuai role
 * ---------------------------------------------------------------------------
 */
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
      { ok: false, message: "Isi email/username dan kata sandi terlebih dahulu." },
      { status: 400 }
    );
  }

  // Jika 'identifier' adalah NIS, ubah jadi email fiktif. Jika email, biarkan.
  const loginEmail = identifier.includes("@")
    ? identifier
    : `${identifier}@sekolah.local`;

  // 2. Login lewat Supabase (client anon + cookie) --------------------------
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
    return NextResponse.json(
      { ok: false, message: "Username atau kata sandi tidak cocok." },
      { status: 401 }
    );
  }

  // 3. Ambil role memakai client service role (tanpa cookie/session) --------
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: profil } = await admin
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  // 4. Tentukan tujuan berdasarkan role -------------------------------------
  const role = profil?.role;
  const redirectTo = role === "admin" || role === "guru" ? "/dashboard" : "/";

  return NextResponse.json({ ok: true, redirectTo });
}
