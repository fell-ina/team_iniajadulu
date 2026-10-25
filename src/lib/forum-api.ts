import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export type ForumKategori = "tugas" | "project" | "tanya_jawab" | "pengalaman";

export interface ForumTopik {
  id: string;
  judul: string;
  konten: string;
  kategori: ForumKategori;
  kelas: "X" | "XI" | "XII";
  penulis_id: string;
  penulis_nama: string;
  penulis_inisial: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  balasan_count: number;
  user_liked: boolean;
}

export interface ForumBalasan {
  id: string;
  topik_id: string;
  parent_id: string | null;
  konten: string;
  penulis_id: string;
  penulis_nama: string;
  penulis_inisial: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  user_liked: boolean;
  balasan_anak: ForumBalasan[];
}

export interface CreateTopikInput {
  judul: string;
  konten: string;
  kategori: ForumKategori;
  kelas: "X" | "XI" | "XII";
}

export interface CreateBalasanInput {
  topik_id: string;
  konten: string;
  parent_id?: string | null;
}

export interface ForumListParams {
  kelas: "X" | "XI" | "XII";
  kategori?: ForumKategori | "all";
  search?: string;
  sort?: "terbaru" | "terlama" | "terpopuler" | "terbanyak_balasan";
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

async function getCurrentUser() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getUserProfile(userId: string) {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("users")
    .select("nama, kelas, role, verification_status")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

function getPenulisNama(penulis: { nama: string }[] | { nama: string } | null): string {
  if (!penulis) return "Anonim";
  if (Array.isArray(penulis)) return penulis[0]?.nama ?? "Anonim";
  return penulis.nama ?? "Anonim";
}

export async function getTopikList(params: ForumListParams): Promise<PaginatedResult<ForumTopik>> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== "siswa" || profile.verification_status !== "terverifikasi") {
    throw new Error("Forbidden: Hanya siswa terverifikasi");
  }
  if (profile.kelas !== params.kelas) {
    throw new Error("Forbidden: Kelas tidak cocok");
  }

  const admin = getSupabaseAdmin();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from("forum_topik")
    .select(`
      id, judul, konten, kategori, kelas, penulis_id, created_at, updated_at,
      like_count, balasan_count,
      penulis:users!penulis_id (nama)
    `, { count: "exact" })
    .eq("kelas", params.kelas);

  if (params.kategori && params.kategori !== "all") {
    query = query.eq("kategori", params.kategori);
  }

  if (params.search && params.search.trim()) {
    const search = params.search.trim();
    query = query.or(`judul.ilike.%${search}%,konten.ilike.%${search}%`);
  }

  switch (params.sort) {
    case "terlama":
      query = query.order("created_at", { ascending: true });
      break;
    case "terpopuler":
      query = query.order("like_count", { ascending: false });
      break;
    case "terbanyak_balasan":
      query = query.order("balasan_count", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  // Get user likes for these topics
  const topicIds = data?.map(t => t.id) ?? [];
  const { data: likes } = await admin
    .from("forum_like")
    .select("topik_id")
    .eq("user_id", user.id)
    .in("topik_id", topicIds);

  const likedIds = new Set(likes?.map(l => l.topik_id) ?? []);

  const result: ForumTopik[] = (data ?? []).map(t => ({
    id: t.id,
    judul: t.judul,
    konten: t.konten,
    kategori: t.kategori as ForumKategori,
    kelas: t.kelas as "X" | "XI" | "XII",
    penulis_id: t.penulis_id,
    penulis_nama: getPenulisNama(t.penulis),
    penulis_inisial: "",
    created_at: t.created_at,
    updated_at: t.updated_at,
    like_count: t.like_count,
    balasan_count: t.balasan_count,
    user_liked: likedIds.has(t.id),
  }));

  return {
    data: result,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getTopikDetail(topikId: string): Promise<ForumTopik | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  
  const { data: topik, error } = await admin
    .from("forum_topik")
    .select(`
      id, judul, konten, kategori, kelas, penulis_id, created_at, updated_at,
      like_count, balasan_count,
      penulis:users!penulis_id (nama)
    `)
    .eq("id", topikId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!topik) return null;

  // Verify user can access this topic's class
  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== "siswa" || profile.verification_status !== "terverifikasi") {
    throw new Error("Forbidden");
  }
  if (profile.kelas !== topik.kelas) {
    throw new Error("Forbidden: Kelas tidak cocok");
  }

  // Check if user liked
  const { data: like } = await admin
    .from("forum_like")
    .select("id")
    .eq("user_id", user.id)
    .eq("topik_id", topikId)
    .maybeSingle();

  return {
    id: topik.id,
    judul: topik.judul,
    konten: topik.konten,
    kategori: topik.kategori as ForumKategori,
    kelas: topik.kelas as "X" | "XI" | "XII",
    penulis_id: topik.penulis_id,
    penulis_nama: getPenulisNama(topik.penulis),
    penulis_inisial: "",
    created_at: topik.created_at,
    updated_at: topik.updated_at,
    like_count: topik.like_count,
    balasan_count: topik.balasan_count,
    user_liked: !!like,
  };
}

export async function createTopik(input: CreateTopikInput): Promise<ForumTopik> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== "siswa" || profile.verification_status !== "terverifikasi") {
    throw new Error("Forbidden: Hanya siswa terverifikasi");
  }
  if (profile.kelas !== input.kelas) {
    throw new Error("Forbidden: Kelas tidak cocok");
  }

  // Validation
  if (!input.judul.trim() || input.judul.trim().length < 5) {
    throw new Error("Judul minimal 5 karakter");
  }
  if (!input.konten.trim() || input.konten.trim().length < 10) {
    throw new Error("Konten minimal 10 karakter");
  }
  if (input.judul.length > 200) {
    throw new Error("Judul maksimal 200 karakter");
  }
  if (input.konten.length > 10000) {
    throw new Error("Konten maksimal 10000 karakter");
  }

  const admin = getSupabaseAdmin();
  
  const { data, error } = await admin
    .from("forum_topik")
    .insert({
      judul: input.judul.trim(),
      konten: input.konten.trim(),
      kategori: input.kategori,
      kelas: input.kelas,
      penulis_id: user.id,
    })
    .select(`
      id, judul, konten, kategori, kelas, penulis_id, created_at, updated_at,
      like_count, balasan_count,
      penulis:users!penulis_id (nama)
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    judul: data.judul,
    konten: data.konten,
    kategori: data.kategori as ForumKategori,
    kelas: data.kelas as "X" | "XI" | "XII",
    penulis_id: data.penulis_id,
    penulis_nama: getPenulisNama(data.penulis),
    penulis_inisial: "",
    created_at: data.created_at,
    updated_at: data.updated_at,
    like_count: data.like_count,
    balasan_count: data.balasan_count,
    user_liked: false,
  };
}

export async function updateTopik(topikId: string, input: Partial<Pick<CreateTopikInput, "judul" | "konten">>): Promise<ForumTopik> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  
  // Verify ownership
  const { data: existing } = await admin
    .from("forum_topik")
    .select("penulis_id")
    .eq("id", topikId)
    .maybeSingle();

  if (!existing) throw new Error("Topik tidak ditemukan");
  if (existing.penulis_id !== user.id) throw new Error("Forbidden: Bukan penulis topik");

  // Validation
  if (input.judul !== undefined) {
    if (!input.judul.trim() || input.judul.trim().length < 5) {
      throw new Error("Judul minimal 5 karakter");
    }
    if (input.judul.length > 200) {
      throw new Error("Judul maksimal 200 karakter");
    }
  }
  if (input.konten !== undefined) {
    if (!input.konten.trim() || input.konten.trim().length < 10) {
      throw new Error("Konten minimal 10 karakter");
    }
    if (input.konten.length > 10000) {
      throw new Error("Konten maksimal 10000 karakter");
    }
  }

  const { data, error } = await admin
    .from("forum_topik")
    .update({
      judul: input.judul?.trim(),
      konten: input.konten?.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", topikId)
    .select(`
      id, judul, konten, kategori, kelas, penulis_id, created_at, updated_at,
      like_count, balasan_count,
      penulis:users!penulis_id (nama)
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    judul: data.judul,
    konten: data.konten,
    kategori: data.kategori as ForumKategori,
    kelas: data.kelas as "X" | "XI" | "XII",
    penulis_id: data.penulis_id,
    penulis_nama: getPenulisNama(data.penulis),
    penulis_inisial: "",
    created_at: data.created_at,
    updated_at: data.updated_at,
    like_count: data.like_count,
    balasan_count: data.balasan_count,
    user_liked: false,
  };
}

export async function deleteTopik(topikId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  
  // Verify ownership
  const { data: existing } = await admin
    .from("forum_topik")
    .select("penulis_id")
    .eq("id", topikId)
    .maybeSingle();

  if (!existing) throw new Error("Topik tidak ditemukan");
  if (existing.penulis_id !== user.id) throw new Error("Forbidden: Bukan penulis topik");

  const { error } = await admin
    .from("forum_topik")
    .delete()
    .eq("id", topikId);

  if (error) throw new Error(error.message);
}

export async function getBalasanList(topikId: string): Promise<ForumBalasan[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  
  // Get all replies for this topic (flat)
  const { data, error } = await admin
    .from("forum_balasan")
    .select(`
      id, topik_id, parent_id, konten, penulis_id, created_at, updated_at,
      like_count,
      penulis:users!penulis_id (nama)
    `)
    .eq("topik_id", topikId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  // Check user likes
  const balasanIds = data.map(b => b.id);
  const { data: likes } = await admin
    .from("forum_like")
    .select("balasan_id")
    .eq("user_id", user.id)
    .in("balasan_id", balasanIds);

  const likedIds = new Set(likes?.map(l => l.balasan_id) ?? []);

  // Build tree structure
  const balasanMap = new Map<string, ForumBalasan>();
  
  // First pass: create all balasan objects
  for (const b of data) {
    balasanMap.set(b.id, {
      id: b.id,
      topik_id: b.topik_id,
      parent_id: b.parent_id,
      konten: b.konten,
      penulis_id: b.penulis_id,
      penulis_nama: getPenulisNama(b.penulis),
      penulis_inisial: "",
      created_at: b.created_at,
      updated_at: b.updated_at,
      like_count: b.like_count,
      user_liked: likedIds.has(b.id),
      balasan_anak: [],
    });
  }

  // Second pass: build tree
  const roots: ForumBalasan[] = [];
  for (const b of data) {
    const balasan = balasanMap.get(b.id)!;
    if (b.parent_id) {
      const parent = balasanMap.get(b.parent_id);
      if (parent) {
        parent.balasan_anak.push(balasan);
      } else {
        roots.push(balasan);
      }
    } else {
      roots.push(balasan);
    }
  }

  return roots;
}

export async function createBalasan(input: CreateBalasanInput): Promise<ForumBalasan> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== "siswa" || profile.verification_status !== "terverifikasi") {
    throw new Error("Forbidden: Hanya siswa terverifikasi");
  }

  // Validate topic exists and user can access
  const admin = getSupabaseAdmin();
  const { data: topik } = await admin
    .from("forum_topik")
    .select("kelas")
    .eq("id", input.topik_id)
    .maybeSingle();

  if (!topik) throw new Error("Topik tidak ditemukan");
  if (profile.kelas !== topik.kelas) throw new Error("Forbidden: Kelas tidak cocok");

  // If replying to a reply, verify parent exists and same topic
  if (input.parent_id) {
    const { data: parent } = await admin
      .from("forum_balasan")
      .select("topik_id")
      .eq("id", input.parent_id)
      .maybeSingle();
    if (!parent || parent.topik_id !== input.topik_id) {
      throw new Error("Balasan induk tidak valid");
    }
  }

  // Validation
  if (!input.konten.trim() || input.konten.trim().length < 3) {
    throw new Error("Balasan minimal 3 karakter");
  }
  if (input.konten.length > 5000) {
    throw new Error("Balasan maksimal 5000 karakter");
  }

  const { data, error } = await admin
    .from("forum_balasan")
    .insert({
      topik_id: input.topik_id,
      parent_id: input.parent_id ?? null,
      konten: input.konten.trim(),
      penulis_id: user.id,
    })
    .select(`
      id, topik_id, parent_id, konten, penulis_id, created_at, updated_at,
      like_count,
      penulis:users!penulis_id (nama)
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    topik_id: data.topik_id,
    parent_id: data.parent_id,
    konten: data.konten,
    penulis_id: data.penulis_id,
    penulis_nama: getPenulisNama(data.penulis),
    penulis_inisial: "",
    created_at: data.created_at,
    updated_at: data.updated_at,
    like_count: data.like_count,
    user_liked: false,
    balasan_anak: [],
  };
}

export async function updateBalasan(balasanId: string, konten: string): Promise<ForumBalasan> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  
  // Verify ownership
  const { data: existing } = await admin
    .from("forum_balasan")
    .select("penulis_id, topik_id")
    .eq("id", balasanId)
    .maybeSingle();

  if (!existing) throw new Error("Balasan tidak ditemukan");
  if (existing.penulis_id !== user.id) throw new Error("Forbidden: Bukan penulis balasan");

  // Validation
  if (!konten.trim() || konten.trim().length < 3) {
    throw new Error("Balasan minimal 3 karakter");
  }
  if (konten.length > 5000) {
    throw new Error("Balasan maksimal 5000 karakter");
  }

  const { data, error } = await admin
    .from("forum_balasan")
    .update({
      konten: konten.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", balasanId)
    .select(`
      id, topik_id, parent_id, konten, penulis_id, created_at, updated_at,
      like_count,
      penulis:users!penulis_id (nama)
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    topik_id: data.topik_id,
    parent_id: data.parent_id,
    konten: data.konten,
    penulis_id: data.penulis_id,
    penulis_nama: getPenulisNama(data.penulis),
    penulis_inisial: "",
    created_at: data.created_at,
    updated_at: data.updated_at,
    like_count: data.like_count,
    user_liked: false,
    balasan_anak: [],
  };
}

export async function deleteBalasan(balasanId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  
  // Verify ownership
  const { data: existing } = await admin
    .from("forum_balasan")
    .select("penulis_id")
    .eq("id", balasanId)
    .maybeSingle();

  if (!existing) throw new Error("Balasan tidak ditemukan");
  if (existing.penulis_id !== user.id) throw new Error("Forbidden: Bukan penulis balasan");

  const { error } = await admin
    .from("forum_balasan")
    .delete()
    .eq("id", balasanId);

  if (error) throw new Error(error.message);
}

export async function toggleLikeTopik(topikId: string): Promise<{ liked: boolean; likeCount: number }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  
  // Check if already liked
  const { data: existing } = await admin
    .from("forum_like")
    .select("id")
    .eq("user_id", user.id)
    .eq("topik_id", topikId)
    .maybeSingle();

  if (existing) {
    // Unlike
    const { error } = await admin
      .from("forum_like")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    
    // Get updated count
    const { data: topik } = await admin
      .from("forum_topik")
      .select("like_count")
      .eq("id", topikId)
      .maybeSingle();
    
    return { liked: false, likeCount: topik?.like_count ?? 0 };
  } else {
    // Like
    const { error } = await admin
      .from("forum_like")
      .insert({ user_id: user.id, topik_id: topikId });
    if (error) throw new Error(error.message);
    
    const { data: topik } = await admin
      .from("forum_topik")
      .select("like_count")
      .eq("id", topikId)
      .maybeSingle();
    
    return { liked: true, likeCount: topik?.like_count ?? 0 };
  }
}

export async function toggleLikeBalasan(balasanId: string): Promise<{ liked: boolean; likeCount: number }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  
  const { data: existing } = await admin
    .from("forum_like")
    .select("id")
    .eq("user_id", user.id)
    .eq("balasan_id", balasanId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("forum_like")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    
    const { data: balasan } = await admin
      .from("forum_balasan")
      .select("like_count")
      .eq("id", balasanId)
      .maybeSingle();
    
    return { liked: false, likeCount: balasan?.like_count ?? 0 };
  } else {
    const { error } = await admin
      .from("forum_like")
      .insert({ user_id: user.id, balasan_id: balasanId });
    if (error) throw new Error(error.message);
    
    const { data: balasan } = await admin
      .from("forum_balasan")
      .select("like_count")
      .eq("id", balasanId)
      .maybeSingle();
    
    return { liked: true, likeCount: balasan?.like_count ?? 0 };
  }
}

export async function createLaporan(input: { 
  topik_id?: string; 
  balasan_id?: string; 
  alasan: string 
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  if (!input.alasan.trim() || input.alasan.trim().length < 10) {
    throw new Error("Alasan laporan minimal 10 karakter");
  }
  if (input.alasan.length > 1000) {
    throw new Error("Alasan laporan maksimal 1000 karakter");
  }

  const admin = getSupabaseAdmin();
  
  // Verify target exists
  if (input.topik_id) {
    const { data: topik } = await admin
      .from("forum_topik")
      .select("id")
      .eq("id", input.topik_id)
      .maybeSingle();
    if (!topik) throw new Error("Topik tidak ditemukan");
  }
  if (input.balasan_id) {
    const { data: balasan } = await admin
      .from("forum_balasan")
      .select("id")
      .eq("id", input.balasan_id)
      .maybeSingle();
    if (!balasan) throw new Error("Balasan tidak ditemukan");
  }

  const { error } = await admin
    .from("forum_laporan")
    .insert({
      user_id: user.id,
      topik_id: input.topik_id ?? null,
      balasan_id: input.balasan_id ?? null,
      alasan: input.alasan.trim(),
    });

  if (error) throw new Error(error.message);
}