import { Metadata } from "next";
import ForumKelasXIIClient from "./ForumKelasXIIClient";

export const metadata: Metadata = {
  title: "Forum Kelas XII | SMK Telekomunikasi Tunas Harapan",
  description: "Diskusi siswa Kelas XII SMK Telekomunikasi Tunas Harapan",
};

export default function ForumKelasXIIPage() {
  return <ForumKelasXIIClient />;
}