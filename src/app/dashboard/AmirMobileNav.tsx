"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  LayoutGrid,
  LogIn,
  Search,
  X,
  BarChart3,
  Users,
  Banknote,
  Settings,
  Tag,
  MapPin,
  Briefcase,
  Languages,
  ListTodo,
  CreditCard
} from "lucide-react";

interface Props {
  currentTab: string;
}

const menuItems = [
  { href: "/dashboard?tab=analytics", label: "Dashboard", desc: "Analytics & finansial", icon: BarChart3, tab: "analytics" },
  { href: "/dashboard?tab=beranda", label: "Pesanan", desc: "Semua pesanan umrah", icon: ClipboardList, tab: "beranda" },
  { href: "/dashboard?tab=muthawif", label: "Muthawif", desc: "Kelola & verifikasi", icon: Users, tab: "muthawif" },
  { href: "/dashboard?tab=penarikan", label: "Penarikan", desc: "Kelola dana keluar", icon: Banknote, tab: "penarikan" },
  { href: "/dashboard?tab=biaya", label: "Biaya", desc: "Fee jasa & manajemen", icon: Settings, tab: "biaya" },
  { href: "/dashboard?tab=promo", label: "Promo", desc: "Diskon & voucher", icon: Tag, tab: "promo" },
  { href: "/dashboard?tab=kegiatan", label: "Kegiatan", desc: "Katalog aktivitas", icon: ListTodo, tab: "kegiatan" },
  { href: "/dashboard?tab=simulator", label: "Simulator", desc: "Test flow midtrans", icon: CreditCard, tab: "simulator" },
  { href: "/dashboard?tab=master_lokasi", label: "Lokasi", desc: "Area operasi", icon: MapPin, tab: "master_lokasi" },
  { href: "/dashboard?tab=master_layanan", label: "Layanan", desc: "Jenis layanan", icon: Briefcase, tab: "master_layanan" },
  { href: "/dashboard?tab=master_bahasa", label: "Bahasa", desc: "Bahasa komunikasi", icon: Languages, tab: "master_bahasa" },
];

export default function AmirMobileNav({ currentTab }: Props) {
  const [open, setOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPortalRoot(document.body));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = useCallback(async () => {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }, [router]);

  const isOrders = currentTab === "beranda";
  const isAnalytics = currentTab === "analytics";

  const navItemClass = (active: boolean) =>
    `flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] text-[0.7rem] font-extrabold no-underline touch-manipulation transition-colors ${
      active ? "bg-[var(--emerald-pale)] text-[var(--emerald)]" : "text-[var(--text-muted)]"
    }`;

  const sheetPortal = portalRoot
    ? createPortal(
        <>
          <div
            className={`fixed inset-0 z-[9000] bg-black/50 backdrop-blur-[4px] transition-opacity duration-200 ease-in-out md:hidden ${
              open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <section
            id="amir-mobile-menu-sheet"
            className={`fixed inset-x-0 bottom-0 z-[9001] rounded-t-[24px] bg-[var(--white)] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out md:hidden ${
              open ? "translate-y-0" : "translate-y-full"
            }`}
            style={{ padding: "1rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom)) 1.5rem" }}
            role="dialog"
            aria-modal="true"
            aria-label="Semua menu Amir"
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-[var(--sand)]" style={{ marginBottom: "1.5rem" }} />
            <div className="flex items-center justify-between" style={{ marginBottom: "2rem", padding: "0 0.5rem" }}>
              <div>
                <h3 className="m-0 text-[1.125rem] font-extrabold tracking-tight text-[var(--charcoal)]">Menu Admin AMIR</h3>
                <p className="m-0 mt-1 text-[0.8125rem] font-medium text-[var(--text-muted)]">Pilih menu untuk melanjutkan</p>
              </div>
              <button
                id="amir-mobile-menu-close"
                type="button"
                aria-label="Tutup menu"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--ivory-dark)] text-[var(--charcoal)] transition-colors active:scale-95 active:bg-[var(--border)]"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-x-4 gap-y-6">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.tab === currentTab;
                return (
                  <Link
                    id={`amir-sheet-${item.tab}`}
                    key={item.href}
                    href={item.href}
                    className="flex min-h-20 flex-col items-center gap-2 text-center no-underline"
                    onClick={() => setOpen(false)}
                  >
                    <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-[var(--radius-md)] border ${isActive ? 'bg-[var(--emerald-pale)] border-[var(--emerald)] text-[var(--emerald)]' : 'border-[var(--border)] bg-[var(--ivory-dark)] text-[var(--emerald)]'}`}>
                      <Icon size={20} />
                    </div>
                    <strong className={`block text-[0.65rem] font-bold leading-tight ${isActive ? 'text-[var(--emerald)]' : 'text-[var(--text-body)]'}`}>{item.label}</strong>
                  </Link>
                );
              })}
              <button
                id="amir-sheet-logout"
                type="button"
                className="flex min-h-20 cursor-pointer flex-col items-center gap-2 border-none bg-transparent p-0 text-center"
                onClick={handleLogout}
              >
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--ivory)] text-[var(--error)]">
                  <LogIn size={20} className="rotate-180" />
                </div>
                <strong className="block text-[0.65rem] font-bold leading-tight text-[var(--error)]">Keluar</strong>
              </button>
            </div>
          </section>
        </>,
        portalRoot
      )
    : null;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-[250] grid h-[calc(68px+env(safe-area-inset-bottom))] grid-cols-[1fr_4.875rem_1fr] items-center border-t border-[var(--border)] bg-[var(--white)] px-4 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[var(--shadow-md)] backdrop-blur-[18px] md:hidden"
        aria-label="Navigasi Amir"
      >
        <Link
          id="amir-mobile-nav-orders"
          href="/dashboard?tab=beranda"
          className={navItemClass(isOrders)}
        >
          <ClipboardList size={22} strokeWidth={isOrders ? 2.6 : 2.1} />
          <span>Pesanan</span>
        </Link>

        <div className="relative mx-auto h-16 w-16">
          <button
            id="amir-mobile-nav-menu"
            type="button"
            className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-light)] text-[var(--white)] shadow-[var(--shadow-emerald)] transition-transform duration-200 touch-manipulation active:scale-95"
            aria-label="Buka semua menu Amir"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <LayoutGrid size={26} strokeWidth={2.5} />
          </button>
        </div>

        <Link
          id="amir-mobile-nav-analytics"
          href="/dashboard?tab=analytics"
          className={navItemClass(isAnalytics)}
        >
          <BarChart3 size={22} strokeWidth={isAnalytics ? 2.6 : 2.1} />
          <span>Analitik</span>
        </Link>
      </nav>

      {sheetPortal}
    </>
  );
}
