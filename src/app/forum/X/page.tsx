import { Metadata } from "next";
<<<<<<< HEAD
import ForumKelas from "@/components/forum/ForumKelas";
=======
import { ForumKelasClient } from "@/app/forum/[kelas]/page";
>>>>>>> 58afc2b6b60aca7b3cb0f44c4848068603233675

export const metadata: Metadata = {
  title: "Forum Kelas X | SMK Telekomunikasi Tunas Harapan",
  description: "Diskusi siswa Kelas X SMK Telekomunikasi Tunas Harapan",
};

export default function ForumKelasXPage() {
  return (
<<<<<<< HEAD
    <ForumKelas
      kelas="X"
      deskripsi="Ruang diskusi untuk angkatan terbaru. Kenalan, tanya jawab, dan belajar bersama dari dasar."
    />
  );
}
=======
    <ForumKelasClient
      kelas="X"
      label="Kelas X"
      deskripsi="Ruang diskusi untuk angkatan terbaru. Kenalan, tanya jawab, dan belajar bersama dari dasar."
      warna="emerald"
      warnaHex="#10b981"
      warnaHover="#059669"
    />
  );
}
>>>>>>> 58afc2b6b60aca7b3cb0f44c4848068603233675
