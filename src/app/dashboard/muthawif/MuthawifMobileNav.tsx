"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, LayoutGrid, LogIn, CalendarClock, X, Wallet, Route } from "lucide-react";

interface Props {
  currentTab: string;
}

const menuItems = [
  { href: "/dashboard/muthawif?tab=earnings", label: "Dashboard", desc: "Pendapatan & Statistik", icon: LayoutGrid, tab: "earnings" },
  { href: "/dashboard/muthawif/bookings?status=ALL&page=1", label: "Pesanan", desc: "Riwayat pesanan masuk", icon: ClipboardList, tab: "bookings" },
  { href: "/dashboard/muthawif?tab=itinerary", label: "Itinerary", desc: "Agenda kegiatan booking", icon: Route, tab: "itinerary" },
  { href: "/dashboard/muthawif?tab=schedule", label: "Jadwal", desc: "Kelola ketersediaan", icon: CalendarClock, tab: "schedule" },
  { href: "/dashboard/muthawif?tab=wallet", label: "Dompet", desc: "Saldo & Penarikan", icon: Wallet, tab: "wallet" },
];

export default function MuthawifMobileNav({ currentTab }: Props) {
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

  // Handle active states for bottom bar
  const isBookings = currentTab === "bookings";
  const isSchedule = currentTab === "schedule";

  return (
    <>
      <nav className="mm-bottom-nav" aria-label="Navigasi Muthawif">
        <Link
          id="muthawif-mobile-nav-bookings"
          href="/dashboard/muthawif/bookings?status=ALL&page=1"
          className={`mm-nav-item${isBookings ? " mm-nav-item-active" : ""}`}
        >
          <ClipboardList size={22} strokeWidth={isBookings ? 2.6 : 2.1} />
          <span>Pesanan</span>
        </Link>

        <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto" }}>
          <button
            id="muthawif-mobile-nav-menu"
            type="button"
            className="mm-nav-menu-button"
            aria-label="Buka semua menu Muthawif"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <LayoutGrid size={26} strokeWidth={2.5} />
          </button>
        </div>

        <Link
          id="muthawif-mobile-nav-schedule"
          href="/dashboard/muthawif?tab=schedule"
          className={`mm-nav-item${isSchedule ? " mm-nav-item-active" : ""}`}
        >
          <CalendarClock size={22} strokeWidth={isSchedule ? 2.6 : 2.1} />
          <span>Jadwal</span>
        </Link>
      </nav>

      <div
        className={`mm-sheet-backdrop${open ? " mm-sheet-backdrop-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <section
        id="muthawif-mobile-menu-sheet"
        className={`mm-menu-sheet${open ? " mm-menu-sheet-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Semua menu Muthawif"
      >
        <div className="mm-sheet-handle" />
        <div className="mm-sheet-header">
          <div>
            <h3>Menu Muthawif</h3>
            <p>Akses cepat fitur utama Wif-Me</p>
          </div>
          <button id="muthawif-mobile-menu-close" type="button" aria-label="Tutup menu" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="mm-sheet-grid">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.tab === currentTab;
            return (
              <Link
                id={`muthawif-sheet-${item.tab}`}
                key={item.href}
                href={item.href}
                className={`mm-sheet-card${isActive ? " mm-sheet-card-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <div className="mm-sheet-icon"><Icon size={20} /></div>
                <strong>{item.label}</strong>
              </Link>
            );
          })}
          <button id="muthawif-sheet-logout" type="button" className="mm-sheet-card mm-sheet-danger" onClick={handleLogout}>
            <div className="mm-sheet-icon"><LogIn size={20} style={{ transform: "rotate(180deg)" }} /></div>
            <strong>Keluar</strong>
          </button>
        </div>
      </section>

      <style>{`
        .mm-bottom-nav { display: none; }
        .mm-sheet-backdrop,
        .mm-menu-sheet { display: none; }

        @media (max-width: 768px) {
          .mm-bottom-nav {
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
          .mm-nav-item {
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
          .mm-nav-item-active {
            color: var(--emerald);
            background: var(--emerald-pale);
          }
          .mm-nav-menu-button {
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
          .mm-sheet-backdrop {
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
          .mm-sheet-backdrop-open {
            opacity: 1;
            pointer-events: auto;
          }
          .mm-menu-sheet {
            display: block;
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 250;
            background: #fff;
            border-radius: 24px 24px 0 0;
            padding: 1.75rem 1.5rem calc(3rem + env(safe-area-inset-bottom)) 1.5rem;
            box-shadow: 0 -18px 52px rgba(0,0,0,0.18);
            transform: translateY(105%);
            transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
            box-sizing: border-box;
            width: 100%;
          }
          .mm-menu-sheet-open { transform: translateY(0); }
          .mm-sheet-handle {
            width: 48px;
            height: 4px;
            border-radius: 999px;
            background: #D7D1C7;
            margin: 0 auto 1.5rem;
          }
          .mm-sheet-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 2.5rem;
          }
          .mm-sheet-header h3 {
            margin: 0;
            color: var(--charcoal);
            font-size: 1.05rem;
            font-weight: 900;
          }
          .mm-sheet-header p {
            margin: 0.15rem 0 0;
            color: var(--text-muted);
            font-size: 0.78rem;
          }
          .mm-sheet-header button {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            border: 1px solid var(--border);
            background: var(--ivory);
            color: var(--charcoal);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .mm-sheet-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px 12px;
            margin-bottom: 0.5rem;
          }
          .mm-sheet-card {
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
          .mm-sheet-card:active .mm-sheet-icon { transform: scale(0.93); }
          .mm-sheet-card-active .mm-sheet-icon {
            background: var(--emerald-pale);
            border-color: var(--emerald);
            color: var(--emerald);
          }
          .mm-sheet-card-active strong {
            color: var(--emerald);
          }
          .mm-sheet-icon {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            background: var(--ivory-dark);
            color: var(--emerald);
            border: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.1s;
          }
          .mm-sheet-card strong {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-body);
            text-align: center;
            display: block;
          }
          .mm-sheet-danger .mm-sheet-icon {
            background: rgba(239,68,68,0.1);
            color: #EF4444;
            border: 1px solid rgba(239,68,68,0.2);
          }
          .mm-sheet-danger strong {
            color: #EF4444;
          }
        }
      `}</style>
    </>
  );
}
