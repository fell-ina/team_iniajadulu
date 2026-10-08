import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Teks kosong" }, { status: 400 });
    }

    const tts = new MsEdgeTTS();

    // Set metadata ke suara cewek Indonesia (id-ID-GadisNeural)
    await tts.setMetadata(
      "id-ID-GadisNeural",
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
    );

    // Panggil toStream murni tanpa opsi parameter tambahan agar tidak crash
    const { audioStream } = await tts.toStream(text);

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
  }
}
