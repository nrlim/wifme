"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, LayoutGrid, ClipboardList, User, LogIn, X, Wallet, Settings, HelpCircle, Activity, Info, Star, Users } from "lucide-react";

interface UserData {
  name: string;
  email: string;
  role: string;
}

interface NavbarProps {
  user?: UserData | null;
}

const NAV_LINKS = [
  { href: "/#search",       label: "Cari Muthawif" },
  { href: "/#cara-kerja",   label: "Cara Kerja" },
  { href: "/#tentang",      label: "Tentang Kami" },
  { href: "/#top-muthawif", label: "Muthawif Pilihan" },
  { href: "/#testimoni",    label: "Testimoni" },
  { href: "/#bergabung",    label: "Bergabung" },
];

export default function Navbar({ user }: NavbarProps) {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false); // Used for mobile bottom sheet now
  const [mounted,   setMounted]   = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const isHero   = pathname === "/";

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // lock body scroll when bottom sheet open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // close bottom sheet on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = useCallback(async () => {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }, [router]);

  const transparent = isHero && !scrolled && mounted;
  const firstNameInitial = user?.name?.charAt(0).toUpperCase() ?? "U";
  const firstName = user?.name?.split(" ")[0] ?? "";

  const handleCenterAction = () => {
    setMenuOpen(true);
  };

  const getNavIcon = (href: string) => {
    if (href.includes("search")) return <Search size={20} />;
    if (href.includes("cara-kerja")) return <Info size={20} />;
    if (href.includes("tentang")) return <HelpCircle size={20} />;
    if (href.includes("top-muthawif")) return <Star size={20} />;
    if (href.includes("testimoni")) return <ClipboardList size={20} />;
    if (href.includes("bergabung")) return <Users size={20} />;
    return <LayoutGrid size={20} />;
  };

  // Features list for bottom sheet
  const features = user?.role === "JAMAAH"
    ? [
        { href: "/dashboard?tab=cari", label: "Cari", icon: <Search size={20} /> },
        { href: "/dashboard", label: "Pesanan", icon: <ClipboardList size={20} /> },
        { href: "/dashboard/wallet", label: "Dompet", icon: <Wallet size={20} /> },
        { href: "/dashboard/settings", label: "Pengaturan", icon: <Settings size={20} /> },
        { href: "/bantuan", label: "Bantuan", icon: <HelpCircle size={20} /> },
      ]
    : user
    ? [
        { href: `/dashboard/${user.role.toLowerCase()}`, label: "Dashboard", icon: <Activity size={20} /> },
        { href: `/dashboard/${user.role.toLowerCase()}/bookings`, label: "Pesanan", icon: <ClipboardList size={20} /> },
        { href: `/dashboard/${user.role.toLowerCase()}/wallet`, label: "Dompet", icon: <Wallet size={20} /> },
        { href: `/dashboard/${user.role.toLowerCase()}/settings`, label: "Pengaturan", icon: <Settings size={20} /> },
      ]
    : [];

  return (
    <>
      {/* ══════════════════════════════════════
          TOP NAVBAR BAR
      ══════════════════════════════════════ */}
      <nav
        id="main-nav"
        aria-label="Navigasi utama"
        className={`fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300 ease-in-out ${
          transparent
            ? "bg-transparent backdrop-blur-none border-b border-white/10"
            : "bg-white/90 backdrop-blur-md border-b border-black/5"
        }`}
      >
        <div className="flex w-full px-[clamp(1.5rem,5vw,4rem)] items-center justify-between gap-4">
          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
            <div className={`w-[38px] h-[38px] rounded-[10px] bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-light)] flex items-center justify-center shrink-0 transition-shadow duration-300 ${
              transparent ? "shadow-[0_4px_14px_rgba(0,0,0,0.25)]" : "shadow-[0_2px_8px_rgba(27,107,74,0.2)]"
            }`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <div>
              <div className="flex flex-col gap-[2px]">
                <span className={`font-black text-xl tracking-[-0.02em] leading-none ${
                  transparent ? "text-white" : "text-[var(--charcoal)]"
                }`}>
                  Wif<span className="text-[var(--gold)]">-Me</span>
                </span>
                <div className={`text-[10px] font-extrabold tracking-widest leading-none ${
                  transparent ? "text-white/70" : "text-[var(--emerald)]"
                }`}>
                  PENDAMPING IBADAH UMROH
                </div>
              </div>
            </div>
          </Link>

          {/* ── Desktop Nav Links (hidden on mobile) ── */}
          <div className="nb-desktop-links hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`nb-link text-[15px] font-[550] no-underline py-2 px-3.5 rounded-[10px] transition-colors duration-150 tracking-[-0.01em] whitespace-nowrap ${
                  transparent
                    ? "text-white/90 hover:bg-white/12 hover:text-white"
                    : "text-[#4a4a4a] hover:bg-[var(--emerald-pale)] hover:text-[var(--emerald)]"
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* ── Desktop Auth (hidden on mobile) ── */}
          <div className="nb-desktop-auth hidden md:flex items-center gap-2 shrink-0 ml-6">
            {/* Divider to separate from nav links */}
            <div className={`w-[1px] h-6 mr-2 ${
              transparent ? "bg-white/20" : "bg-black/10"
            }`} />
            
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 p-1.5 pr-3.5 rounded-full no-underline transition-colors duration-200 border-[1.5px] ${
                    transparent
                      ? "bg-white/12 border-white/20 hover:bg-white/20"
                      : "bg-[var(--emerald-pale)] border-[var(--emerald)]/15 hover:bg-[var(--emerald-pale)]/80"
                  }`}
                >
                  <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-light)] text-white font-extrabold text-xs flex items-center justify-center">
                    {firstNameInitial}
                  </div>
                  <span className={`text-sm font-bold whitespace-nowrap ${
                    transparent ? "text-white" : "text-[var(--emerald)]"
                  }`}>
                    {firstName}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className={`text-sm font-semibold bg-transparent border-none cursor-pointer py-2 px-1.5 transition-colors duration-150 ${
                    transparent ? "text-white/65 hover:text-white" : "text-gray-400 hover:text-red-500"
                  }`}
                >
                  Keluar
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className={`text-[15px] font-bold no-underline py-2 px-4 rounded-[10px] transition-colors duration-150 whitespace-nowrap ${
                  transparent
                    ? "text-white/95 bg-white/10 hover:bg-white/20"
                    : "text-[var(--emerald)] bg-[var(--emerald-pale)] hover:bg-[var(--emerald)] hover:text-white"
                }`}
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM NAVIGATION
      ══════════════════════════════════════ */}
      <div
        className="nb-mobile-bottom-nav flex md:hidden fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-md border-t border-black/5 pb-[env(safe-area-inset-bottom)] h-16 z-[190] justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
      >
        <Link href="/" className={`bn-item ${pathname === "/" ? "text-[var(--emerald)]" : "text-[#9CA3AF]"}`}>
          <Home size={22} strokeWidth={pathname === "/" ? 2.5 : 2} />
          <span>Beranda</span>
        </Link>
        <Link href="/#search" className="bn-item text-[#9CA3AF]">
          <Search size={22} />
          <span>Cari</span>
        </Link>

        {/* Center Action Button */}
        <div className="relative w-16 h-16">
          <button
            onClick={handleCenterAction}
            aria-label="Fitur Utama"
            className="absolute top-[-24px] left-1/2 translate-x-[-50%] w-14 h-14 rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-light)] text-white flex items-center justify-center border-none cursor-pointer shadow-[0_8px_24px_rgba(27,107,74,0.4)] active:scale-95 transition-transform"
          >
            <LayoutGrid size={26} strokeWidth={2.5} />
          </button>
        </div>

        {user ? (
          <Link href="/dashboard" className={`bn-item ${pathname.startsWith("/dashboard") && !pathname.includes("settings") ? "text-[var(--emerald)]" : "text-[#9CA3AF]"}`}>
            <ClipboardList size={22} strokeWidth={pathname.startsWith("/dashboard") && !pathname.includes("settings") ? 2.5 : 2} />
            <span>Pesanan</span>
          </Link>
        ) : (
          <Link href="/#cara-kerja" className="bn-item text-[#9CA3AF]">
            <ClipboardList size={22} />
            <span>Panduan</span>
          </Link>
        )}

        {user ? (
          <Link href="/bantuan" className={`bn-item ${pathname.includes("bantuan") ? "text-[var(--emerald)]" : "text-[#9CA3AF]"}`}>
            <HelpCircle size={22} strokeWidth={pathname.includes("bantuan") ? 2.5 : 2} />
            <span>Bantuan</span>
          </Link>
        ) : (
          <Link href="/auth/login" className={`bn-item ${pathname === "/auth/login" ? "text-[var(--emerald)]" : "text-[#9CA3AF]"}`}>
            <LogIn size={22} strokeWidth={pathname === "/auth/login" ? 2.5 : 2} />
            <span>Masuk</span>
          </Link>
        )}
      </div>

      {/* ══════════════════════════════════════
          BOTTOM SHEET (Features Modal)
      ══════════════════════════════════════ */}
      <div
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[210] bg-black/50 backdrop-blur-[4px] transition-opacity duration-300 ease-in-out ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        id="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu Fitur"
        className={`fixed bottom-0 left-0 right-0 z-[220] bg-[var(--ivory)] border-t border-[var(--border)] rounded-t-[24px] px-5 pt-6 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-[0_-8px_40px_rgba(0,0,0,0.15)] transition-transform duration-[350ms] cubic-bezier(0.32, 0.72, 0, 1) ${
          menuOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-[var(--charcoal)] m-0">{user ? "Fitur Wifme" : "Menu Navigasi"}</h3>
          <button onClick={() => setMenuOpen(false)} className="bg-transparent border-none text-gray-500 p-1 cursor-pointer hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-x-3 gap-y-4">
          {user ? (
            <>
              {features.map((feat) => (
                <Link
                  key={feat.href}
                  href={feat.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-2 no-underline group"
                >
                  <div className="w-[52px] h-[52px] rounded-2xl bg-white border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex items-center justify-center text-[var(--emerald)] group-hover:border-[var(--emerald)] group-hover:bg-[var(--emerald-pale)] transition-colors duration-150">
                    {feat.icon}
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-body)] text-center group-hover:text-[var(--emerald)] transition-colors">{feat.label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer p-0 group"
              >
                <div className="w-[52px] h-[52px] rounded-2xl bg-red-50 border border-red-200/40 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors duration-150">
                  <LogIn size={20} className="rotate-180" />
                </div>
                <span className="text-xs font-semibold text-red-500 text-center">Keluar</span>
              </button>
            </>
          ) : (
            NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center gap-2 no-underline group"
              >
                <div className="w-[52px] h-[52px] rounded-2xl bg-white border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex items-center justify-center text-[var(--emerald)] group-hover:border-[var(--emerald)] group-hover:bg-[var(--emerald-pale)] transition-colors duration-150">
                  {getNavIcon(link.href)}
                </div>
                <span className="text-xs font-semibold text-[var(--text-body)] text-center group-hover:text-[var(--emerald)] transition-colors">{link.label}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          GLOBAL CSS
      ══════════════════════════════════════ */}
      <style>{`
        /* Desktop styles */
        @media (min-width: 768px) {
          .nb-desktop-links { display: flex !important; }
          .nb-desktop-auth  { display: flex !important; }
          .nb-mobile-bottom-nav { display: none !important; }
          
          /* Need to hide the bottom sheet and backdrop on desktop if accidentally triggered */
          #bottom-sheet { display: none !important; }
        }

        /* Bottom Nav Item styling */
        .bn-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          flex: 1;
          font-size: 0.6875rem;
          font-weight: 600;
          transition: color 0.2s;
        }

        /* Link hover states */
        .nb-link-glass:hover { background: rgba(255,255,255,0.12) !important; color: white !important; }
        .nb-link-solid:hover { background: rgba(27,107,74,0.08) !important; color: #1B6B4A !important; }
      `}</style>
    </>
  );
}

