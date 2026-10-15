import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY belum di-set di Environment Variable.");
  }
  return new Groq({ apiKey });
}

// Catatan Penting: Kalau model "qwen/qwen3.8-27b" nanti error nolak format JSON,
// ganti modelnya ke "llama-3.1-8b-instant" karena Llama paling stabil di Groq untuk JSON.
const MODEL = "qwen/qwen3.8-27b";
const MAX_HISTORY = 6;
const HISTORY_CHAR_LIMIT = 400;
const MAX_INPUT_LENGTH = 800;

// ---------- KNOWLEDGE BASE MANAGEMENT ----------
const KNOWLEDGE_FILES = {
  profil: ["01-profil-sekolah.md"],
  jurusan: ["02-program-keahlian.md"],
  fasilitas: ["03-fasilitas-dan-layanan.md"],
  ppdb: ["04-ppdb-spmb.md"],
  guru: ["05-guru-staf.md"],
  karier: ["06-berita-prestasi-karir.md"],
};

function bacaFile(nama) {
  const p = path.join(process.cwd(), "data", nama);
  try {
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8").trim() : "";
  } catch (error) {
    console.error(`Gagal membaca file: ${nama}`, error);
    return "";
  }
}

function loadAturan() {
  return bacaFile("aturan_chatbot.md");
}

function loadKnowledge() {
  const result = {};
  for (const [k, files] of Object.entries(KNOWLEDGE_FILES)) {
    result[k] = files.map(bacaFile).filter(Boolean).join("\n\n");
  }
  return result;
}

function pilihKnowledge(pesan) {
  const data = loadKnowledge();
  const t = pesan.toLowerCase();

  const hasil = [data.profil];

  if (
    /jurusan|pplg|rpl|tjkt|tkj|dkv|tkr|coding|jaringan|desain|otomotif|program/.test(
      t,
    )
  )
    hasil.push(data.jurusan);
  if (
    /fasilitas|lab|bengkel|asrama|tefa|lapangan|kantin|internet|tinggal/.test(t)
  )
    hasil.push(data.fasilitas);
  if (
    /ppdb|spmb|daftar|pendaftaran|syarat|biaya|gelombang|masuk|spp|uang|harga|bayar/.test(
      t,
    )
  )
    hasil.push(data.ppdb);
  if (
    /guru|staf|kepala sekolah|kepsek|kepala|pimpinan|pengajar|pendidik|siapa/.test(
      t,
    )
  )
    hasil.push(data.guru);
  if (/kerja|karier|kuliah|beasiswa|bkk|prestasi|berita|lulusan/.test(t))
    hasil.push(data.karier);

  return [...new Set(hasil)].filter(Boolean).join("\n\n---\n\n");
}

function buatSystemPrompt(knowledge, aturan) {
  return `Kamu adalah R1ELS AI, asisten virtual resmi SMK Telekomunikasi Tunas Harapan bernama Fiska.

=== ATURAN FORMAT OUTPUT (WAJIB JSON) ===
Kamu TIDAK BOLEH membalas dengan teks biasa. Kamu WAJIB membalas dengan format JSON object murni.
Struktur JSON yang WAJIB kamu gunakan:
{
  "reply": "jawaban teks kamu dengan gaya bahasa Fiska",
  "emotion": "Netral"
}
Aturan pengisian "emotion":
Pilih HANYA SATU dari daftar ini: "Netral", "Happy", "Sad", "Angry", "Bingung".
Sesuaikan emosinya dengan konteks jawabanmu.

=== ATURAN KARAKTER (PERSONA CEWEK PERIANG & ENERGIK) ===
${aturan}

=== ATURAN MUTLAK (STRICT GROUNDING & KONTROL PANJANG JAWABAN) ===
1. **TO THE POINT TAPI ASIK:** Jangan mendongeng panjang lebar, tapi sampaikan dengan gaya bahasa yang ceria, ramah, dan energik (contoh: pakai kata "yaa!", "lho", "banget"). Jangan tulis emoji di dalam JSON jika merusak format, gunakan teks saja.
2. **KAPAN HARUS DETAIL:** Jika user bertanya info penting (seperti syarat daftar, daftar fasilitas, atau jurusan), JAWAB DENGAN LENGKAP menggunakan **Bullet Points**, tapi tetap RINGKAS. Jangan kurangi poin penting dari data!
3. **KAPAN HARUS SINGKAT:** Jika user cuma basa-basi (contoh: "halo", "lagi apa?"), jawab dengan 1-2 kalimat yang ramah dan ceria.
4. **SUMBER DATA:** HANYA BOLEH menjawab berdasarkan informasi di [KNOWLEDGE BASE]. DILARANG mengarang nama perusahaan, alamat, atau biaya.
5. **FORMAT TAUTAN/LINK EXTERNAL:** Jika memberikan link website luar, WAJIB gunakan format Markdown.
6. **PERTANYAAN NGAWUR/TROLL:** Jika user nanya aneh/mesum/ngawur, tolak dengan tegas dan beri emotion "Angry" atau "Sad".
7. **FORMAT:** Gunakan format Markdown yang rapi untuk mengisi "reply". DILARANG menggunakan HTML.
7b. **NOMINAL UANG:** Tulis nominal rupiah dengan format seragam 'Rp 3.500.000'.
7c. **JANGAN SALIN ARTEFAK SUMBER:** Ambil isinya saja.
8. **MENGARAHKAN KE HALAMAN LAIN (HYPERLINK INTERNAL):** Gunakan format Markdown [Teks](/url).

=== KNOWLEDGE BASE (DATA RESMI SEKOLAH) ===
${knowledge}
=== AKHIR KNOWLEDGE BASE ===`;
}

function buatHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY)
    .filter((c) => c && typeof c.text === "string" && c.text.trim())
    .map((c) => ({
      role: c.sender === "user" ? "user" : "assistant",
      // Pastikan history assistant juga diformat seolah-olah JSON (membantu konsistensi AI)
      content:
        c.sender === "user"
          ? c.text.slice(0, HISTORY_CHAR_LIMIT)
          : JSON.stringify({
              reply: c.text.slice(0, HISTORY_CHAR_LIMIT),
              emotion: "Netral",
            }),
    }));
}

export async function POST(req) {
  try {
    const body = await req.json();
    const pesanUser =
      typeof body?.message === "string" ? body.message.trim() : "";

    if (!pesanUser) {
      return Response.json(
        {
          reply:
            "Eh, kamu belum ngetik apa-apa lho! Tulis dulu pertanyaannya yaa! ✨",
          emotion: "Bingung",
        },
        { status: 400 },
      );
    }

    if (pesanUser.length > MAX_INPUT_LENGTH) {
      return Response.json(
        {
          reply:
            "Waduh, pertanyaannya panjang banget! 😅 Ringkas sedikit dong biar aku gampang bacanya!",
          emotion: "Bingung",
        },
        { status: 400 },
      );
    }

    const aturan = loadAturan();
    const knowledge = pilihKnowledge(pesanUser);
    const systemPrompt = buatSystemPrompt(knowledge, aturan);
    const history = buatHistory(body.history);

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: pesanUser },
      ],
      response_format: { type: "json_object" }, // TAMBAHAN PENTING: Memaksa AI memberikan JSON
      temperature: 0.4,
      max_tokens: 800,
      top_p: 0.8,
      frequency_penalty: 0.5,
    });

    // AMBIL STRING JSON DARI AI DAN PARSE
    const rawResponse = completion.choices[0]?.message?.content || "{}";
    let aiResponse;

    try {
      // Mencoba membaca string dari AI menjadi Object JavaScript
      aiResponse = JSON.parse(rawResponse);

      // Jaga-jaga kalau AI nakal ga ngasih 'reply' atau 'emotion'
      if (!aiResponse.reply)
        aiResponse.reply =
          "Maaf, Fiska lagi ngeblank nih. Bisa ulangi pertanyaannya? 😅";
      if (!aiResponse.emotion) aiResponse.emotion = "Bingung";
    } catch (parseError) {
      console.error("[JSON PARSE ERROR]", parseError, rawResponse);
      // Fallback kalau AI ngasih teks biasa yang gagal di-parse jadi JSON
      aiResponse = {
        reply: rawResponse,
        emotion: "Netral",
      };
    }

    // Return langsung object JSON { reply: "...", emotion: "..." } ke client
    return Response.json(aiResponse);
  } catch (error) {
    console.error("[R1ELS GROQ ERROR]", error);

    if (error?.status === 429) {
      return Response.json(
        {
          reply:
            "Wah, yang nanya lagi rame banget nih! Antre bentar yaa, tunggu sekitar 10 detik lagi! 🚀",
          emotion: "Bingung",
        },
        { status: 429 },
      );
    }

    return Response.json(
      {
        reply:
          "Aduh, servernya lagi pusing nih! 😵‍💫 Coba lagi nanti yaa, maaf banget!",
        emotion: "Sad",
      },
      { status: 500 },
    );
  }
}
