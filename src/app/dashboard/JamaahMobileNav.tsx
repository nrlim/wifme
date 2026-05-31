"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, LayoutGrid, LogIn, Search, X, User, Route } from "lucide-react";

interface Props {
  currentTab: string;
}

const menuItems = [
  { href: "/dashboard?tab=beranda", label: "Pesanan", desc: "Riwayat dan status Booking", icon: ClipboardList, tab: "beranda" },
  { href: "/dashboard?tab=cari", label: "Cari Muthawif", desc: "Temukan Muthawif tersedia", icon: Search, tab: "cari" },
  { href: "/dashboard?tab=itinerary", label: "Itinerary", desc: "Agenda kegiatan booking", icon: Route, tab: "itinerary" },
];

export default function JamaahMobileNav({ currentTab }: Props) {
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
  const isSearch = currentTab === "cari";

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
            id="jamaah-mobile-menu-sheet"
            className={`fixed inset-x-0 bottom-0 z-[9001] rounded-t-[var(--radius-lg)] bg-[var(--white)] shadow-[var(--shadow-lg)] transition-transform duration-300 ease-out md:hidden ${
              open ? "translate-y-0" : "translate-y-full"
            }`}
            style={{ 
              boxSizing: "border-box", 
              padding: "1.75rem 1.5rem calc(3rem + env(safe-area-inset-bottom)) 1.5rem",
              width: "100%"
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Semua menu Jamaah"
          >
            <div className="mx-auto h-1 w-12 rounded-full bg-[var(--sand)]" style={{ marginBottom: "1.5rem" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "2.5rem" }}>
              <div>
                <h3 className="m-0 text-[1.05rem] font-black text-[var(--charcoal)]">Menu Jamaah</h3>
                <p className="m-0 mt-1 text-[0.78rem] text-[var(--text-muted)]">Akses cepat fitur utama Wifme</p>
              </div>
              <button
                id="jamaah-mobile-menu-close"
                type="button"
                aria-label="Tutup menu"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--ivory)] text-[var(--charcoal)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-x-3 gap-y-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    id={`jamaah-sheet-${item.tab}`}
                    key={item.href}
                    href={item.href}
                    className="flex min-h-20 flex-col items-center gap-2 text-center no-underline"
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--ivory-dark)] text-[var(--emerald)]">
                      <Icon size={20} />
                    </div>
                    <strong className="block text-[0.75rem] font-bold leading-tight text-[var(--text-body)]">{item.label}</strong>
                  </Link>
                );
              })}
              <button
                id="jamaah-sheet-logout"
                type="button"
                className="flex min-h-20 cursor-pointer flex-col items-center gap-2 border-none bg-transparent p-0 text-center"
                onClick={handleLogout}
              >
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--ivory)] text-[var(--error)]">
                  <LogIn size={20} className="rotate-180" />
                </div>
                <strong className="block text-[0.75rem] font-bold leading-tight text-[var(--error)]">Keluar</strong>
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
        aria-label="Navigasi Jamaah"
      >
        <Link
          id="jamaah-mobile-nav-orders"
          href="/dashboard?tab=beranda"
          className={navItemClass(isOrders)}
        >
          <ClipboardList size={22} strokeWidth={isOrders ? 2.6 : 2.1} />
          <span>Pesanan</span>
        </Link>

        <div className="relative mx-auto h-16 w-16">
          <button
            id="jamaah-mobile-nav-menu"
            type="button"
            className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-light)] text-[var(--white)] shadow-[var(--shadow-emerald)] transition-transform duration-200 touch-manipulation"
            aria-label="Buka semua menu Jamaah"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <LayoutGrid size={26} strokeWidth={2.5} />
          </button>
        </div>

        <Link
          id="jamaah-mobile-nav-search"
          href="/dashboard?tab=cari"
          className={navItemClass(isSearch)}
        >
          <Search size={22} strokeWidth={isSearch ? 2.6 : 2.1} />
          <span>Cari</span>
        </Link>
      </nav>

      {sheetPortal}
    </>
  );
}
