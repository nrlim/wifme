"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, LayoutGrid, LogIn, Search, X } from "lucide-react";

interface Props {
  currentTab: string;
}

const menuItems = [
  { href: "/dashboard?tab=beranda", label: "Pesanan", desc: "Riwayat dan status Booking", icon: ClipboardList, tab: "beranda" },
  { href: "/dashboard?tab=cari", label: "Cari Muthawif", desc: "Temukan Muthawif tersedia", icon: Search, tab: "cari" },
];

export default function JamaahMobileNav({ currentTab }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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

  return (
    <>
      <nav className="jm-bottom-nav" aria-label="Navigasi Jamaah">
        <Link
          id="jamaah-mobile-nav-orders"
          href="/dashboard?tab=beranda"
          className={`jm-nav-item${isOrders ? " jm-nav-item-active" : ""}`}
        >
          <ClipboardList size={22} strokeWidth={isOrders ? 2.6 : 2.1} />
          <span>Pesanan</span>
        </Link>

        <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto" }}>
          <button
            id="jamaah-mobile-nav-menu"
            type="button"
            className="jm-nav-menu-button"
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
          className={`jm-nav-item${isSearch ? " jm-nav-item-active" : ""}`}
        >
          <Search size={22} strokeWidth={isSearch ? 2.6 : 2.1} />
          <span>Cari</span>
        </Link>
      </nav>

      <div
        className={`jm-sheet-backdrop${open ? " jm-sheet-backdrop-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <section
        id="jamaah-mobile-menu-sheet"
        className={`jm-menu-sheet${open ? " jm-menu-sheet-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Semua menu Jamaah"
      >
        <div className="jm-sheet-handle" />
        <div className="jm-sheet-header">
          <div>
            <h3>Menu Jamaah</h3>
            <p>Akses cepat fitur utama Wifme</p>
          </div>
          <button id="jamaah-mobile-menu-close" type="button" aria-label="Tutup menu" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="jm-sheet-grid">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                id={`jamaah-sheet-${item.tab}`}
                key={item.href}
                href={item.href}
                className="jm-sheet-card"
                onClick={() => setOpen(false)}
              >
                <div className="jm-sheet-icon"><Icon size={20} /></div>
                <strong>{item.label}</strong>
              </Link>
            );
          })}
          <button id="jamaah-sheet-logout" type="button" className="jm-sheet-card jm-sheet-danger" onClick={handleLogout}>
            <div className="jm-sheet-icon"><LogIn size={20} style={{ transform: "rotate(180deg)" }} /></div>
            <strong>Keluar</strong>
          </button>
        </div>
      </section>

      <style>{`
        .jm-bottom-nav { display: none; }
        .jm-sheet-backdrop,
        .jm-menu-sheet { display: none; }

        @media (max-width: 768px) {
          .jm-bottom-nav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 230;
            height: calc(68px + env(safe-area-inset-bottom));
            padding: 0.45rem max(1rem, env(safe-area-inset-left)) calc(0.45rem + env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-right));
            background: rgba(255,255,255,0.96);
            border-top: 1px solid rgba(27,107,74,0.12);
            box-shadow: 0 -12px 32px rgba(27,107,74,0.12);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            display: grid;
            grid-template-columns: 1fr 78px 1fr;
            align-items: center;
          }
          .jm-nav-item {
            min-height: 50px;
            color: #8A8A8A;
            text-decoration: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.2rem;
            border-radius: 8px;
            font-size: 0.7rem;
            font-weight: 800;
            touch-action: manipulation;
          }
          .jm-nav-item-active {
            color: var(--emerald);
            background: var(--emerald-pale);
          }
          .jm-nav-menu-button {
            position: absolute;
            top: -24px;
            left: 50%;
            transform: translateX(-50%);
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--emerald), #27956A);
            color: #fff;
            box-shadow: 0 8px 24px rgba(27,107,74,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            cursor: pointer;
            transition: transform 0.2s;
            touch-action: manipulation;
          }
          .jm-sheet-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 240;
            background: rgba(5,15,10,0.52);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.22s ease;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          }
          .jm-sheet-backdrop-open {
            opacity: 1;
            pointer-events: auto;
          }
          .jm-menu-sheet {
            display: block;
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 250;
            background: #fff;
            border-radius: 24px 24px 0 0;
            padding: 0.7rem 1rem calc(1rem + env(safe-area-inset-bottom));
            box-shadow: 0 -18px 52px rgba(0,0,0,0.18);
            transform: translateY(105%);
            transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
          }
          .jm-menu-sheet-open { transform: translateY(0); }
          .jm-sheet-handle {
            width: 42px;
            height: 4px;
            border-radius: 999px;
            background: #D7D1C7;
            margin: 0 auto 0.9rem;
          }
          .jm-sheet-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .jm-sheet-header h3 {
            margin: 0;
            color: var(--charcoal);
            font-size: 1.05rem;
            font-weight: 900;
          }
          .jm-sheet-header p {
            margin: 0.15rem 0 0;
            color: var(--text-muted);
            font-size: 0.78rem;
          }
          .jm-sheet-header button {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            border: 1px solid var(--border);
            background: var(--ivory);
            color: var(--charcoal);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .jm-sheet-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px 12px;
          }
          .jm-sheet-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            cursor: pointer;
            background: none;
            border: none;
            padding: 0;
          }
          .jm-sheet-icon {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            background: var(--ivory-dark);
            color: var(--emerald);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border);
          }
          .jm-sheet-card strong {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-body);
            text-align: center;
            display: block;
          }
          .jm-sheet-danger .jm-sheet-icon {
            background: rgba(239,68,68,0.1);
            color: #EF4444;
            border: 1px solid rgba(239,68,68,0.2);
          }
          .jm-sheet-danger strong {
            color: #EF4444;
          }
        }
      `}</style>
    </>
  );
}
