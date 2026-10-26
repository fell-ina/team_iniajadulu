import { Metadata } from "next";
<<<<<<< HEAD
import ForumKelas from "@/components/forum/ForumKelas";
=======
import { ForumKelasClient } from "@/app/forum/[kelas]/page";
>>>>>>> 58afc2b6b60aca7b3cb0f44c4848068603233675

export const metadata: Metadata = {
  title: "Forum Kelas XII | SMK Telekomunikasi Tunas Harapan",
  description: "Diskusi siswa Kelas XII SMK Telekomunikasi Tunas Harapan",
};

export default function ForumKelasXIIPage() {
  return (
<<<<<<< HEAD
    <ForumKelas
      kelas="XII"
      deskripsi="Persiapan ujian, wisuda, dan masa depan. Saling support menuju lulusan yang siap kerja."
    />
  );
}
=======
    <ForumKelasClient
      kelas="XII"
      label="Kelas XII"
      deskripsi="Persiapan ujian, wisuda, dan masa depan. Saling support menuju lulusan yang siap kerja."
      warna="purple"
      warnaHex="#a855f7"
      warnaHover="#9333ea"
    />
  );
}
>>>>>>> 58afc2b6b60aca7b3cb0f44c4848068603233675
