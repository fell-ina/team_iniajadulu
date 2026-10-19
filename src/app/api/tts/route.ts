import { NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { normalizeIndonesianSpeech } from "@/lib/speech";

// 1. Inisialisasi Dua Klien ElevenLabs (Utama & Cadangan)
const elevenlabs1 = process.env.ELEVENLABS_API_KEY
  ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  : null;

const elevenlabs2 = process.env.ELEVENLABS_API_KEY_2
  ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY_2 })
  : null;

// Voice ID default: voice perempuan native Indonesia (milik akun Key 1).
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "WADOyoQqjYMPuCv5eTTl";

// Voice untuk API key cadangan (Key 2). Voice custom/library ElevenLabs hanya
// bisa dipakai oleh akun/workspace pemiliknya: akun gratis Key 2 TIDAK bisa
// memakai voice custom Key 1 (404) maupun voice Voice Library (402). Jadi Key 2
// diarahkan ke voice "premade" bawaan akun (selalu tersedia & gratis).
// Ganti lewat ELEVENLABS_VOICE_ID_2 kalau mau suara lain.
const VOICE_ID_2_DEFAULT = "Xb7hH8MSUJpSbSDYk0k2"; // Alice - Clear, Engaging Educator
const VOICE_ID_2 = process.env.ELEVENLABS_VOICE_ID_2 || VOICE_ID_2_DEFAULT;

// Seed tetap supaya hasil sintesis konsisten antar-request.
const VOICE_SEED = Number(process.env.ELEVENLABS_SEED) || 20261014;

// Setting suara disamakan untuk kedua API key. stability sedang + style 0
// membuat timbre konsisten (tidak berubah-ubah tiap generate) tanpa kehilangan
// kejelasan pelafalan.
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
  speed: 1,
} as const;

type NomorKey = 1 | 2;
type Provider = "elevenlabs" | "edge";

// Fungsi pembuat audio ElevenLabs dengan klien tertentu
async function generateElevenLabsAudio(
  client: ElevenLabsClient,
  text: string,
  voiceId: string,
) {
  const audioStream = await client.generate({
    voice: voiceId,
    text: text,
    model_id: "eleven_multilingual_v2",
    seed: VOICE_SEED,
    voice_settings: VOICE_SETTINGS,
  });

  const chunks: Uint8Array[] = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Error yang layak dicoba ulang (rate limit / gangguan jaringan), bukan error
// permanen seperti kredensial salah, kuota habis, atau voice tidak ditemukan.
function bolehDicobaUlang(err: unknown): boolean {
  const e = err as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
    message?: string;
  };
  const status = e?.status ?? e?.statusCode ?? e?.response?.status;
  if (typeof status === "number") {
    if (status === 429) return true;
    if (status >= 500) return true;
    return false;
  }
  const pesan = String(e?.message ?? "").toLowerCase();
  if (
    pesan.includes("quota") ||
    pesan.includes("401") ||
    pesan.includes("403") ||
    pesan.includes("not a valid voice") ||
    pesan.includes("not found")
  ) {
    return false;
  }
  // Timeout, koneksi terputus, dan error tak dikenal -> layak dicoba ulang.
  return true;
}

const jeda = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ElevenLabs dengan percobaan ulang + backoff. Ini mencegah suara tiba-tiba
// berpindah ke Edge TTS hanya karena satu chunk gagal sesaat (mis. 429),
// padahal kredit ElevenLabs masih tersedia.
async function generateElevenLabsDenganUlang(
  client: ElevenLabsClient,
  text: string,
  voiceId: string,
  percobaan = 3,
): Promise<Buffer> {
  let errorTerakhir: unknown;
  for (let i = 0; i < percobaan; i++) {
    try {
      return await generateElevenLabsAudio(client, text, voiceId);
    } catch (err) {
      errorTerakhir = err;
      if (i === percobaan - 1 || !bolehDicobaUlang(err)) break;
      await jeda(400 * 2 ** i);
    }
  }
  throw errorTerakhir;
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

// Cache sisa kuota per API key agar tidak memanggil /v1/user tiap chunk.
type CacheKuota = { sisa: number; waktu: number };
const cacheKuota: Record<NomorKey, CacheKuota | null> = { 1: null, 2: null };
const KUOTA_TTL_MS = 60_000;

function apiKeyUntuk(noKey: NomorKey): string | undefined {
  return noKey === 1
    ? process.env.ELEVENLABS_API_KEY
    : process.env.ELEVENLABS_API_KEY_2;
}

async function sisaKarakterElevenLabs(noKey: NomorKey): Promise<number | null> {
  const cached = cacheKuota[noKey];
  if (cached && Date.now() - cached.waktu < KUOTA_TTL_MS) {
    return cached.sisa;
  }
  const apiKey = apiKeyUntuk(noKey);
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": apiKey },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      character_limit?: number;
      character_count?: number;
    };
    const sisa = Math.max(
      0,
      (data.character_limit ?? 0) - (data.character_count ?? 0),
    );
    cacheKuota[noKey] = { sisa, waktu: Date.now() };
    return sisa;
  } catch {
    return null;
  }
}

// Preflight: tentukan SATU sumber suara (satu API key, satu voice) untuk
// SELURUH jawaban. Dengan begitu suara tidak berpindah (Key 1 -> Key 2 -> Edge)
// di tengah jawaban.
export async function GET(req: Request) {
  const chars = Number(new URL(req.url).searchParams.get("chars")) || 0;
  const butuh = Math.max(chars, 1);

  const [sisa1, sisa2] = await Promise.all([
    sisaKarakterElevenLabs(1),
    sisaKarakterElevenLabs(2),
  ]);

  let provider: Provider = "edge";
  let key: NomorKey | 0 = 0;
  if (sisa1 !== null && sisa1 >= butuh) {
    provider = "elevenlabs";
    key = 1;
  } else if (sisa2 !== null && sisa2 >= butuh) {
    provider = "elevenlabs";
    key = 2;
  }

  return NextResponse.json(
    {
      provider,
      key,
      sisa1,
      sisa2,
      sisa: Math.max(sisa1 ?? 0, sisa2 ?? 0),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// Endpoint Utama dengan 3 Lapisan Pertahanan
export async function POST(req: Request) {
  try {
    const { text, provider, key } = (await req.json()) as {
      text?: string;
      provider?: Provider;
      key?: NomorKey;
    };

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Teks kosong" }, { status: 400 });
    }

    // Normalisasi bahasa Indonesia + nominal rupiah di sisi server juga,
    // supaya pelafalan tetap benar walau pemanggil mengirim teks mentah.
    const normalizedText = normalizeIndonesianSpeech(text);

    if (!normalizedText) {
      return NextResponse.json({ error: "Teks kosong" }, { status: 400 });
    }

    let audioBuffer: Buffer | null = null;
    let sumber: Provider = "edge";
    const paksaEdge = provider === "edge";

    // Urutkan key: yang di-pin preflight lebih dulu, key lain sebagai cadangan.
    const urutanKey: NomorKey[] = key === 2 ? [2, 1] : [1, 2];

    if (!paksaEdge) {
      for (const noKey of urutanKey) {
        const client = noKey === 1 ? elevenlabs1 : elevenlabs2;
        const voiceId = noKey === 1 ? VOICE_ID : VOICE_ID_2;
        if (!client) continue;

        // Lewati key yang kuotanya sudah diketahui habis (hemat waktu).
        const sisa = await sisaKarakterElevenLabs(noKey);
        if (sisa !== null && sisa < normalizedText.length) continue;

        try {
          audioBuffer = await generateElevenLabsDenganUlang(
            client,
            normalizedText,
            voiceId,
          );
          sumber = "elevenlabs";
          const c = cacheKuota[noKey];
          if (c) {
            c.sisa = Math.max(0, c.sisa - normalizedText.length);
            c.waktu = Date.now();
          }
          break;
        } catch (err) {
          console.warn(`API Key ${noKey} habis/error, mencoba opsi berikutnya...`, err);
        }
      }
    }

    // LAPISAN TERAKHIR: Jika semua ElevenLabs gagal, pakai Edge TTS.
    if (!audioBuffer) {
      audioBuffer = await generateEdgeTTSAudio(normalizedText);
      sumber = "edge";
    }

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-TTS-Source": sumber,
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
