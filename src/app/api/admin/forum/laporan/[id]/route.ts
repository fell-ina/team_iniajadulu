import { NextResponse } from "next/server";
import { POLA_UUID, sesiAdminForum } from "@/lib/admin-forum";
import { buatAdmin } from "@/lib/dashboard";

/**
 * app/api/admin/forum/laporan/[id]/route.ts
 * ---------------------------------------------------------------------------
 * PATCH /api/admin/forum/laporan/:id { status } -> ubah status laporan siswa.
 *
 * Status memakai enum public.forum_laporan_status yang sudah ada:
 *   pending | diproses | selesai | ditolak
 *
 * Hanya admin. Trigger forum_laporan_updated_at (sudah ada) memperbarui
 * updated_at. Tidak ada perubahan skema/RLS.
 * ---------------------------------------------------------------------------
 */
export const dynamic = "force-dynamic";

const STATUS_VALID = ["pending", "diproses", "selesai", "ditolak"] as const;

type StatusLaporan = (typeof STATUS_VALID)[number];

const LABEL_STATUS: Record<StatusLaporan, string> = {
  pending: "menunggu",
  diproses: "diproses",
  selesai: "selesai",
  ditolak: "ditolak",
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { admin, galat } = await sesiAdminForum();
  if (galat) return galat;

  const { id } = await params;
  if (!id || !POLA_UUID.test(id)) {
    return NextResponse.json(
      { ok: false, message: "ID laporan tidak valid." },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const statusMinta = typeof body?.status === "string" ? body.status.trim().toLowerCase() : "";

  if (!(STATUS_VALID as readonly string[]).includes(statusMinta)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Status laporan harus salah satu: pending, diproses, selesai, ditolak.",
      },
      { status: 400 }
    );
  }

  const status = statusMinta as StatusLaporan;
  const db = buatAdmin();

  const { data: laporan, error: galatBaca } = await db
    .from("forum_laporan")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (galatBaca) {
    console.error("[moderasi forum] gagal membaca laporan:", galatBaca.message);
    return NextResponse.json(
      { ok: false, message: "Gagal memeriksa laporan." },
      { status: 500 }
    );
  }

  if (!laporan) {
    return NextResponse.json(
      { ok: false, message: "Laporan tidak ditemukan atau sudah dihapus." },
      { status: 404 }
    );
  }

  const { data: terubah, error } = await db
    .from("forum_laporan")
    .update({ status })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[moderasi forum] gagal mengubah status laporan:", error.message);
    return NextResponse.json(
      { ok: false, message: "Gagal memperbarui status laporan. Coba lagi." },
      { status: 500 }
    );
  }

  if (!terubah || terubah.length === 0) {
    console.error("[moderasi forum] status laporan tidak berubah:", id);
    return NextResponse.json(
      {
        ok: false,
        message: "Status laporan tidak berubah. Muat ulang halaman lalu coba lagi.",
      },
      { status: 500 }
    );
  }

  console.info(
    `[moderasi forum] admin ${admin.userId} mengubah laporan ${id} -> ${status}`
  );

  return NextResponse.json({
    ok: true,
    id,
    status,
    message: `Laporan ditandai ${LABEL_STATUS[status]}.`,
  });
}
