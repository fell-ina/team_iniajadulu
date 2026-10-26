import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
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
            // Ignore in server components
          }
        },
      },
    }
  );
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: profil, error } = await admin
      .from("users")
      .select("id, nama, email, role, nisn, jurusan, kelas, verification_status, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return profile without sensitive fields that user can't edit
    return NextResponse.json({
      id: profil?.id ?? user.id,
      nama: profil?.nama ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "",
      email: profil?.email ?? user.email ?? "",
      role: profil?.role ?? null,
      nisn: profil?.nisn ?? null,
      jurusan: profil?.jurusan ?? null,
      kelas: profil?.kelas ?? null,
      verification_status: profil?.verification_status ?? "belum",
      created_at: profil?.created_at ?? user.created_at,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { nama } = body;

    // Validate input
    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    }
    if (nama.trim().length < 2) {
      return NextResponse.json({ error: "Nama minimal 2 karakter" }, { status: 400 });
    }
    if (nama.trim().length > 100) {
      return NextResponse.json({ error: "Nama maksimal 100 karakter" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Only allow updating 'nama' field - other fields are protected
    const { data: updated, error } = await admin
      .from("users")
      .update({ nama: nama.trim() })
      .eq("id", user.id)
      .select("id, nama, email, role, nisn, jurusan, kelas, verification_status, created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: updated?.id ?? user.id,
      nama: updated?.nama ?? nama.trim(),
      email: updated?.email ?? user.email ?? "",
      role: updated?.role ?? null,
      nisn: updated?.nisn ?? null,
      jurusan: updated?.jurusan ?? null,
      kelas: updated?.kelas ?? null,
      verification_status: updated?.verification_status ?? "belum",
      created_at: updated?.created_at ?? user.created_at,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}