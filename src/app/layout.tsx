import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Hanya dua keluarga font yang benar-benar dipakai di CSS (body & heading).
// Geist Mono tidak direferensikan di mana pun, jadi tidak ikut diunduh.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SMK Telekomunikasi Tunas Harapan",
  description: "Website profil dan informasi SMK Telekomunikasi Tunas Harapan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" className={`${geistSans.variable} ${spaceGrotesk.variable} antialiased`}><body>{children}</body></html>;
}
