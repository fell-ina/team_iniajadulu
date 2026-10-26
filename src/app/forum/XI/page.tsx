import { Metadata } from "next";
<<<<<<< HEAD
import ForumKelas from "@/components/forum/ForumKelas";
=======
import { ForumKelasClient } from "@/app/forum/[kelas]/page";
>>>>>>> 58afc2b6b60aca7b3cb0f44c4848068603233675

export const metadata: Metadata = {
  title: "Forum Kelas XI | SMK Telekomunikasi Tunas Harapan",
  description: "Diskusi siswa Kelas XI SMK Telekomunikasi Tunas Harapan",
};

export default function ForumKelasXIPage() {
  return (
<<<<<<< HEAD
    <ForumKelas
      kelas="XI"
      deskripsi="Diskusi tingkat lanjut: project, magang, dan persiapan kelulusan. Saling berbagi pengalaman."
    />
  );
}
=======
    <ForumKelasClient
      kelas="XI"
      label="Kelas XI"
      deskripsi="Diskusi tingkat lanjut: project, magang, dan persiapan kelulusan. Saling berbagi pengalaman."
      warna="blue"
      warnaHex="#3b82f6"
      warnaHover="#2563eb"
    />
  );
}
>>>>>>> 58afc2b6b60aca7b3cb0f44c4848068603233675
