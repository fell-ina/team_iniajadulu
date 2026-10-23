import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * src/lib/dashboard.ts
 * ---------------------------------------------------------------------------
 * Helper server-only untuk halaman /dashboard/*.
 *
 * `ambilProfilDashboard()` membaca session dari cookie lalu mengambil profil
 * (nama + role) memakai service role. Hasilnya di-cache per request supaya
 * layout dan page tidak menembak database dua kali.
 * ---------------------------------------------------------------------------
 */

export interface ProfilDashboard {
  id: string;
  nama: string | null;
  role: string | null;
  email: string;
}

/** Client service role tanpa cookie (hanya boleh dipakai di server). */
export function buatAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export const ambilProfilDashboard = cache(async (): Promise<ProfilDashboard | null> => {
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
            /* abaikan */
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = buatAdmin();
  const { data: profil, error } = await admin
    .from("users")
    .select("nama, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("[dashboard] gagal membaca profil:", error.message);
  }

  return {
    id: user.id,
    nama: profil?.nama ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? null,
    role: profil?.role ?? null,
    email: user.email ?? "",
  };
});

/** Admin & guru boleh membuka dashboard; siswa dialihkan ke beranda. */
export function bolehMasukDashboard(role: string | null) {
  return role === "admin" || role === "guru";
}
