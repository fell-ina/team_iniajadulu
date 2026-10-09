import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

// Batas teks agar tidak terlalu panjang diproses server.
const MAX_CHARS = 2000;

// Edge TTS hanya menyediakan 2 suara native Indonesia:
//   - id-ID-ArdiNeural  (laki-laki)
//   - id-ID-GadisNeural (perempuan)
// Jadi GadisNeural adalah satu-satunya suara cewek native yang tersedia.
const VOICE = process.env.TTS_VOICE || "id-ID-GadisNeural";

// Karakter suara Fiska: perempuan Indonesia yang bicara pelan dan lembut.
// Override lewat .env.local bila ingin bereksperimen tanpa ubah kode:
//   TTS_RATE, TTS_PITCH, TTS_VOLUME
const RATE = process.env.TTS_RATE || "-10%"; // lebih pelan -> terdengar tenang
const PITCH = process.env.TTS_PITCH || "+8Hz"; // naik tipis -> tetap feminin & natural
const VOLUME = process.env.TTS_VOLUME || "-8%"; // lebih pelan -> tidak menusuk

// msedge-tts menyisipkan teks apa adanya ke dalam SSML (XML) tanpa escaping.
// Tanpa escaping, karakter "&" (mis. "Biaya SPP & Pendaftaran") membuat
// dokumen SSML tidak valid => Edge TTS menolak request =>
// suara Fiska jatuh ke fallback browser yang terdengar jauh lebih robotik.
function escapeSsml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function POST(req: Request) {
  let tts: MsEdgeTTS | null = null;

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json({ error: "Teks kosong" }, { status: 400 });
    }

    const cleanText = text.slice(0, MAX_CHARS);

    tts = new MsEdgeTTS();

    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(escapeSsml(cleanText), {
      rate: RATE,
      pitch: PITCH,
      volume: VOLUME,
    });

    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("Edge TTS Internal Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses audio dari Edge TTS" },
      { status: 500 },
    );
  } finally {
    // Tutup koneksi WebSocket setelah selesai, sukses maupun gagal.
    tts?.close();
  }
}