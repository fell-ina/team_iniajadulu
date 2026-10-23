import { Metadata } from "next";
import ForumLandingClient from "./ForumLandingClient";

export const metadata: Metadata = {
  title: "Forum Siswa | SMK Telekomunikasi Tunas Harapan",
  description: "Forum diskusi siswa SMK Telekomunikasi Tunas Harapan berdasarkan kelas.",
};

export default function ForumLandingPage() {
  return <ForumLandingClient />;
}