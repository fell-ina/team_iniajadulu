import { NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

// 1. Inisialisasi Dua Klien ElevenLabs (Utama & Cadangan)
const elevenlabs1 = process.env.ELEVENLABS_API_KEY
  ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  : null;

const elevenlabs2 = process.env.ELEVENLABS_API_KEY_2
  ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY_2 })
  : null;

// Fungsi pembuat audio ElevenLabs dengan klien tertentu
async function generateElevenLabsAudio(client: ElevenLabsClient, text: string) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";

  const audioStream = await client.generate({
    voice: voiceId,
    text: text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.35,
      similarity_boost: 0.8,
      style: 0.35,
      use_speaker_boost: true,
    },
  });

  const chunks: Uint8Array[] = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Fungsi Cadangan Edge TTS
async function generateEdgeTTSAudio(text: string) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(
    "id-ID-GadisNeural",
    OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
  );
  const { audioStream } = await tts.toStream(text);

  const chunks: Uint8Array[] = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Endpoint Utama dengan 3 Lapisan Pertahanan
export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Teks kosong" }, { status: 400 });
    }

    let audioBuffer: any = null;

    // LAPISAN 1: Coba pakai API Key Pertama
    if (elevenlabs1) {
      try {
        audioBuffer = await generateElevenLabsAudio(elevenlabs1, text);
      } catch (err1) {
        console.warn("API Key 1 habis/error, mencoba API Key 2...", err1);
      }
    }

    // LAPISAN 2: Jika Lapisan 1 gagal, coba pakai API Key Kedua
    if (!audioBuffer && elevenlabs2) {
      try {
        audioBuffer = await generateElevenLabsAudio(elevenlabs2, text);
      } catch (err2) {
        console.warn(
          "API Key 2 juga habis/error, beralih ke Edge TTS...",
          err2,
        );
      }
    }

    // LAPISAN 3: Jika dua-duanya gagal, pakai Edge TTS gratisan
    if (!audioBuffer) {
      audioBuffer = await generateEdgeTTSAudio(text);
    }

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Seluruh layanan Voice TTS gagal total:", error);
    return NextResponse.json(
      { error: "Gagal memproses audio dari seluruh layanan TTS" },
      { status: 500 },
    );
  }
}
