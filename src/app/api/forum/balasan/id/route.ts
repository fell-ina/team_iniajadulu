import { NextResponse, NextRequest } from "next/server";
import { updateBalasan, deleteBalasan } from "@/lib/forum-api";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { konten } = body;

    if (!konten) {
      return NextResponse.json({ error: "Konten wajib diisi" }, { status: 400 });
    }

    const balasan = await updateBalasan(id, konten);
    return NextResponse.json(balasan);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const { id } = await params;
    await deleteBalasan(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}