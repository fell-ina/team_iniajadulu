import { NextResponse, NextRequest } from "next/server";
import { getTopikDetail, updateTopik, deleteTopik } from "@/lib/forum-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const { id } = await params;
    const topik = await getTopikDetail(id);
    
    if (!topik) {
      return NextResponse.json({ error: "Topik tidak ditemukan" }, { status: 404 });
    }
    
    return NextResponse.json(topik);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const input = {
      judul: body.judul,
      konten: body.konten,
    };

    const topik = await updateTopik(id, input);
    return NextResponse.json(topik);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const { id } = await params;
    await deleteTopik(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}