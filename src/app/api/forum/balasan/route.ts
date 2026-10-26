import { NextResponse } from "next/server";
<<<<<<< HEAD
import {
  bolehIkutForum,
  buatAdmin,
  segarkanJumlahBalasan,
  sesiForum,
} from "@/lib/forum-server";
import type { Balasan } from "@/lib/forum-types";

/**
 * app/api/forum/balasan/route.ts
 * ---------------------------------------------------------------------------
 * POST /api/forum/balasan { topikId, konten, parentId? }
 *      -> menulis baris baru ke public.forum_balasan lalu menyegarkan
 *         forum_topik.balasan_count.
 * ---------------------------------------------------------------------------
 */
export const dynamic = "force-dynamic";

function teks(nilai: unknown): string {
  return typeof nilai === "string" ? nilai.trim() : "";
}

export async function POST(request: Request) {
  const sesi = await sesiForum();

  if (!sesi) {
    return NextResponse.json(
      { ok: false, message: "Anda harus masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  if (!bolehIkutForum(sesi)) {
    return NextResponse.json(
      { ok: false, message: "Akun Anda belum terverifikasi untuk ikut forum." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const topikId = teks(body?.topikId);
  const konten = teks(body?.konten);
  const parentId = teks(body?.parentId) || null;

  if (!topikId) {
    return NextResponse.json(
      { ok: false, message: "Diskusi yang dibalas tidak dikenal." },
      { status: 400 }
    );
  }
  if (!konten) {
    return NextResponse.json(
      { ok: false, message: "Balasan tidak boleh kosong." },
      { status: 400 }
    );
  }
  if (konten.length > 5000) {
    return NextResponse.json(
      { ok: false, message: "Balasan maksimal 5.000 karakter." },
      { status: 400 }
    );
  }

  const admin = buatAdmin();

  const { data: topik, error: galatTopik } = await admin
    .from("forum_topik")
    .select("id, kelas")
    .eq("id", topikId)
    .maybeSingle();

  if (galatTopik) {
    console.error("[forum/balasan POST] topik", galatTopik);
    return NextResponse.json(
      { ok: false, message: "Gagal memeriksa diskusi." },
      { status: 500 }
    );
  }
  if (!topik) {
    return NextResponse.json(
      { ok: false, message: "Diskusi tidak ditemukan." },
      { status: 404 }
    );
  }
  if (sesi.role === "siswa" && topik.kelas !== sesi.kelas) {
    return NextResponse.json(
      { ok: false, message: "Anda hanya bisa membalas di forum kelas Anda sendiri." },
      { status: 403 }
    );
  }

  if (parentId) {
    const { data: induk } = await admin
      .from("forum_balasan")
      .select("id, topik_id")
      .eq("id", parentId)
      .maybeSingle();

    if (!induk || induk.topik_id !== topikId) {
      return NextResponse.json(
        { ok: false, message: "Balasan yang ingin ditanggapi tidak ditemukan." },
        { status: 400 }
      );
    }
  }

  const { data, error } = await admin
    .from("forum_balasan")
    .insert({
      topik_id: topikId,
      parent_id: parentId,
      konten,
      penulis_id: sesi.userId,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[forum/balasan POST]", error);
    return NextResponse.json(
      { ok: false, message: "Gagal menyimpan balasan." },
      { status: 500 }
    );
  }

  await segarkanJumlahBalasan(topikId);

  const balasan: Balasan = {
    id: data.id as string,
    topikId,
    parentId,
    konten,
    penulisId: sesi.userId,
    penulisNama: sesi.nama,
    createdAt: data.created_at as string,
    balasanAnak: [],
  };

  return NextResponse.json({ ok: true, balasan }, { status: 201 });
}
=======
import { getBalasanList, createBalasan, CreateBalasanInput } from "@/lib/forum-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topikId = searchParams.get("topik_id");
    
    if (!topikId) {
      return NextResponse.json({ error: "topik_id wajib diisi" }, { status: 400 });
    }
    
    const balasan = await getBalasanList(topikId);
    return NextResponse.json(balasan);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input: CreateBalasanInput = {
      topik_id: body.topik_id,
      konten: body.konten,
      parent_id: body.parent_id ?? null,
    };

    if (!input.topik_id || !input.konten) {
      return NextResponse.json({ error: "topik_id dan konten wajib diisi" }, { status: 400 });
    }

    const balasan = await createBalasan(input);
    return NextResponse.json(balasan, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
>>>>>>> 58afc2b6b60aca7b3cb0f44c4848068603233675
