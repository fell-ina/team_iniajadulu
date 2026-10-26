"use client";

/**
 * components/dashboard/SidebarDashboard.tsx
 * ---------------------------------------------------------------------------
 * Sidebar biru di kiri untuk seluruh halaman /dashboard/*.
 *
 * - Desktop: sidebar tetap (fixed) setinggi layar.
 * - Mobile : tombol menu di bar atas, sidebar muncul sebagai drawer.
 * - Menu "Data Pengguna" hanya tampil untuk role admin.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardList,
  ExternalLink,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Newspaper,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

interface Props {
  nama: string;
  role: string;
  email: string;
}

interface ItemMenu {
  href: string;
  label: string;
  ikon: typeof LayoutDashboard;
  khususAdmin?: boolean;
}

const MENU: ItemMenu[] = [
  { href: "/dashboard", label: "Ringkasan", ikon: LayoutDashboard },
  { href: "/dashboard/pengguna", label: "Data Pengguna", ikon: Users, khususAdmin: true },
  { href: "/dashboard/spmb", label: "Pendaftar SPMB", ikon: ClipboardList, khususAdmin: true },
  { href: "/dashboard/verifikasi", label: "Verifikasi NISN", ikon: ShieldCheck },
  { href: "/dashboard/forum", label: "Moderasi Forum", ikon: Flag, khususAdmin: true },
  { href: "/dashboard/berita", label: "Berita", ikon: Newspaper },
];

const MENU_LAIN: ItemMenu[] = [
  { href: "/forum-guru", label: "Forum Guru", ikon: MessagesSquare },
];

function labelRole(role: string) {
  if (role === "admin") return "Administrator";
  if (role === "guru") return "Guru";
  return "Siswa";
}

function aktif(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SidebarDashboard({ nama, role, email }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [keluar, setKeluar] = useState(false);

  const menu = MENU.filter((m) => !m.khususAdmin || role === "admin");
  const inisial = (nama || email || "A").trim().charAt(0).toUpperCase() || "A";
  const halamanAktif = [...menu, ...MENU_LAIN].find((m) => aktif(pathname, m.href))?.label;

  // Tutup drawer setiap pindah halaman.
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  // Kunci scroll latar saat drawer terbuka (mobile).
  useEffect(() => {
    if (!drawer || typeof document === "undefined") return;
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = asal;
    };
  }, [drawer]);

  async function logout() {
    setKeluar(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* tetap arahkan ke halaman login */
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const isiSidebar = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link
        href="/dashboard"
        className="flex items-center gap-3 border-b border-white/10 px-5 py-5 transition hover:bg-white/5"
      >
        <Image
          src="/images/school/logo-transparent.png"
          alt="Logo SMK Telekomunikasi Tunas Harapan"
          width={38}
          height={38}
          className="rounded-full bg-white p-1 shadow-sm"
          priority
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold tracking-wide text-white">
            Tunas Harapan
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-[#C1E8FF]/60">
            Panel Admin
          </span>
        </span>
      </Link>

      {/* Navigasi */}
      <nav aria-label="Navigasi dashboard" className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#C1E8FF]/40">
          Kelola
        </p>
        <ul className="mt-2 space-y-1">
          {menu.map((item) => {
            const Ikon = item.ikon;
            const dipilih = aktif(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={dipilih ? "page" : undefined}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    dipilih
                      ? "bg-white/12 text-white shadow-sm"
                      : "text-[#C1E8FF]/70 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  {dipilih && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-2 left-0 w-1 rounded-full bg-[#C1E8FF]"
                    />
                  )}
                  <Ikon
                    size={17}
                    className={dipilih ? "text-[#C1E8FF]" : "text-[#C1E8FF]/60"}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <>
          <p className="mt-6 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#C1E8FF]/40">
              Lainnya
            </p>
            <ul className="mt-2 space-y-1">
              {MENU_LAIN.map((item) => {
                const Ikon = item.ikon;
                const dipilih = aktif(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        dipilih
                          ? "bg-white/12 text-white"
                          : "text-[#C1E8FF]/70 hover:bg-white/6 hover:text-white"
                      }`}
                    >
                      <Ikon size={17} className="text-[#C1E8FF]/60" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#C1E8FF]/70 transition hover:bg-white/6 hover:text-white"
                >
                  <ExternalLink size={17} className="text-[#C1E8FF]/60" />
                  Lihat situs
                </Link>
              </li>
          </ul>
        </>
      </nav>

      {/* Akun */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-white/6 px-3 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#C1E8FF] text-sm font-bold text-[#052659]">
            {inisial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{nama || "Pengguna"}</span>
            <span className="block truncate text-[11px] text-[#C1E8FF]/60">{labelRole(role)}</span>
          </span>
          <button
            type="button"
            onClick={logout}
            disabled={keluar}
            aria-label="Keluar dari akun"
            title="Keluar"
            className="grid size-8 shrink-0 place-items-center rounded-full text-[#C1E8FF]/70 transition hover:bg-red-500/20 hover:text-red-200 disabled:opacity-50"
          >
            <LogOut size={15} />
          </button>
        </div>
        <p className="mt-2 truncate px-2 text-[10px] text-[#C1E8FF]/35">{email}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-[#052659] lg:block">
        {isiSidebar}
      </aside>

      {/* Bar atas mobile */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-black/10 bg-[#052659] px-4 py-3 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Buka menu"
          aria-expanded={drawer}
          aria-controls="sidebar-dashboard"
          className="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
        >
          <Menu size={18} />
        </button>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">
            {halamanAktif ?? "Dashboard"}
          </span>
          <span className="block text-[10px] uppercase tracking-[.16em] text-[#C1E8FF]/60">
            Panel Admin
          </span>
        </span>
        <span className="ml-auto grid size-9 place-items-center rounded-full bg-[#C1E8FF] text-sm font-bold text-[#052659]">
          {inisial}
        </span>
      </header>

      {/* Drawer mobile */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-[#021024]/60 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawer(false)}
          >
            <motion.aside
              id="sidebar-dashboard"
              initial={{ x: -268 }}
              animate={{ x: 0 }}
              exit={{ x: -268 }}
              transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-64 max-w-[80vw] bg-[#052659] shadow-2xl"
            >
              <div className="flex items-center justify-end px-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDrawer(false)}
                  aria-label="Tutup menu"
                  className="grid size-8 place-items-center rounded-full text-[#C1E8FF]/70 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>
              {isiSidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
