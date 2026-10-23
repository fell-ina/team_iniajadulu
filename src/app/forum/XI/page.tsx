import { Metadata } from "next";
import ForumKelasXIClient from "./ForumKelasXIClient";

export const metadata: Metadata = {
  title: "Forum Kelas XI | SMK Telekomunikasi Tunas Harapan",
  description: "Diskusi siswa Kelas XI SMK Telekomunikasi Tunas Harapan",
};

export default function ForumKelasXIPage() {
  return <ForumKelasXIClient />;
}