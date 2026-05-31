"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, LayoutGrid, ClipboardList, LogIn, X, Wallet, Settings, HelpCircle, Activity, Info, Star, Users } from "lucide-react";

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
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  
  // Only apply transparent behavior on the landing page
  const isHero = pathname === "/";

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Trigger immediately
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

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

  // If we are not on the hero page, we force it to look "scrolled" (solid)
  const isTransparent = isHero && !scrolled && mounted;
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
          DESKTOP NAVBAR
      ══════════════════════════════════════ */}
      <nav
        id="main-nav"
        aria-label="Navigasi utama"
        data-transparent={isTransparent ? "true" : "false"}
        className="premium-navbar"
      >
        <div className="premium-navbar-inner">
          
          {/* ── Logo ── */}
          <Link href="/" className="nav-logo">
            <div className="nav-logo-img">
              <img src="/logo-icon.png" alt="Wifme" />
            </div>
            <div className="nav-logo-text">
              <span className="nav-brand">Wif<span className="nav-brand-accent">-Me</span></span>
            </div>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="nav-links">
            {NAV_LINKS.map((item) => (
              <a key={item.href} href={item.href} className="nav-link-item">
                {item.label}
              </a>
            ))}
          </div>

          {/* ── Desktop Auth ── */}
          <div className="nav-auth">
            {user ? (
              <>
                <Link href="/dashboard" className="nav-user-pill">
                  <div className="nav-user-avatar">{firstNameInitial}</div>
                  <span className="nav-user-name">{firstName}</span>
                </Link>
                <button onClick={handleLogout} className="nav-logout-btn">
                  Keluar
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="nav-login-btn">
                Masuk
              </Link>
            )}
          </div>

        </div>
      </nav>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM TAB BAR
      ══════════════════════════════════════ */}
      <div className="mobile-tab-bar">
        <Link href="/" className={`tab-item ${pathname === "/" ? "active" : ""}`}>
          <Home size={24} strokeWidth={pathname === "/" ? 2.5 : 2} />
          <span>Beranda</span>
        </Link>
        <Link href="/#search" className="tab-item">
          <Search size={24} strokeWidth={2} />
          <span>Cari</span>
        </Link>

        {/* Center Action Button */}
        <div className="tab-center-wrap">
          <button onClick={handleCenterAction} aria-label="Fitur Utama" className="tab-center-btn">
            <LayoutGrid size={28} strokeWidth={2.5} />
          </button>
        </div>

        {user ? (
          <Link href="/dashboard" className={`tab-item ${pathname.startsWith("/dashboard") && !pathname.includes("settings") ? "active" : ""}`}>
            <ClipboardList size={24} strokeWidth={pathname.startsWith("/dashboard") && !pathname.includes("settings") ? 2.5 : 2} />
            <span>Pesanan</span>
          </Link>
        ) : (
          <Link href="/#cara-kerja" className="tab-item">
            <ClipboardList size={24} strokeWidth={2} />
            <span>Panduan</span>
          </Link>
        )}

        {user ? (
          <Link href="/dashboard/settings" className={`tab-item ${pathname.includes("settings") ? "active" : ""}`}>
            <Settings size={24} strokeWidth={pathname.includes("settings") ? 2.5 : 2} />
            <span>Akun</span>
          </Link>
        ) : (
          <Link href="/auth/login" className={`tab-item ${pathname === "/auth/login" ? "active" : ""}`}>
            <LogIn size={24} strokeWidth={pathname === "/auth/login" ? 2.5 : 2} />
            <span>Masuk</span>
          </Link>
        )}
      </div>

      {/* ══════════════════════════════════════
          BOTTOM SHEET (Features Modal for Mobile)
      ══════════════════════════════════════ */}
      <div
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
        className={`bottom-sheet-backdrop ${menuOpen ? "open" : ""}`}
      />

      <div
        id="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu Fitur"
        className={`bottom-sheet-modal ${menuOpen ? "open" : ""}`}
      >
        <div className="bs-header">
          <h3>{user ? "Fitur Wifme" : "Menu Navigasi"}</h3>
          <button onClick={() => setMenuOpen(false)} className="bs-close-btn">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="bs-grid">
          {user ? (
            <>
              {features.map((feat) => (
                <Link key={feat.href} href={feat.href} onClick={() => setMenuOpen(false)} className="bs-item">
                  <div className="bs-icon-wrap">
                    {feat.icon}
                  </div>
                  <span>{feat.label}</span>
                </Link>
              ))}
              <button onClick={handleLogout} className="bs-item logout">
                <div className="bs-icon-wrap">
                  <LogIn size={20} className="logout-icon" />
                </div>
                <span>Keluar</span>
              </button>
            </>
          ) : (
            NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="bs-item">
                <div className="bs-icon-wrap">
                  {getNavIcon(link.href)}
                </div>
                <span>{link.label}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          PREMIUM CSS STYLES
      ══════════════════════════════════════ */}
      <style>{`
        /* ── Base Container ── */
        .premium-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 1.5rem clamp(1.5rem, 5vw, 4rem);
        }

        .premium-navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ── Scrolled State (Floating Pill) ── */
        .premium-navbar[data-transparent="false"] {
          padding: 0.75rem clamp(1rem, 4vw, 2rem);
        }
        
        .premium-navbar[data-transparent="false"] .premium-navbar-inner {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          padding: 0.5rem 0.5rem 0.5rem 1.25rem;
          box-shadow: 0 4px 24px rgba(27, 107, 74, 0.08), 0 1px 3px rgba(0,0,0,0.02);
        }

        /* ── Logo ── */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          text-decoration: none;
        }
        .nav-logo-img {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .nav-logo-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .nav-logo:hover .nav-logo-img {
          transform: scale(1.05);
        }
        
        .nav-brand {
          font-weight: 900;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
          transition: color 0.3s;
        }
        
        /* ── Dynamic Colors based on State ── */
        /* Transparent (Top) */
        .premium-navbar[data-transparent="true"] .nav-brand { color: white; }
        .premium-navbar[data-transparent="true"] .nav-brand-accent { color: var(--gold-light); }
        .premium-navbar[data-transparent="true"] .nav-link-item { color: rgba(255,255,255,0.85); }
        .premium-navbar[data-transparent="true"] .nav-link-item:hover { color: white; background: rgba(255,255,255,0.12); }
        
        .premium-navbar[data-transparent="true"] .nav-user-pill { border: 1.5px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: white; }
        .premium-navbar[data-transparent="true"] .nav-user-pill:hover { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.3); }
        .premium-navbar[data-transparent="true"] .nav-logout-btn { color: rgba(255,255,255,0.6); }
        .premium-navbar[data-transparent="true"] .nav-logout-btn:hover { color: white; }

        .premium-navbar[data-transparent="true"] .nav-login-btn {
          background: rgba(255,255,255,0.1);
          border: 1.5px solid rgba(255,255,255,0.3);
          color: white;
        }
        .premium-navbar[data-transparent="true"] .nav-login-btn:hover {
          background: white;
          color: var(--emerald);
          box-shadow: 0 4px 16px rgba(255,255,255,0.2);
        }

        /* Scrolled (Pill) */
        .premium-navbar[data-transparent="false"] .nav-brand { color: var(--charcoal); }
        .premium-navbar[data-transparent="false"] .nav-brand-accent { color: var(--gold); }
        .premium-navbar[data-transparent="false"] .nav-link-item { color: var(--text-body); }
        .premium-navbar[data-transparent="false"] .nav-link-item:hover { color: var(--emerald); background: var(--emerald-pale); }
        
        .premium-navbar[data-transparent="false"] .nav-user-pill { border: 1.5px solid var(--emerald-pale); background: white; color: var(--emerald); box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
        .premium-navbar[data-transparent="false"] .nav-user-pill:hover { background: var(--emerald-pale); border-color: var(--emerald); }
        .premium-navbar[data-transparent="false"] .nav-logout-btn { color: var(--text-muted); }
        .premium-navbar[data-transparent="false"] .nav-logout-btn:hover { color: var(--error); }

        .premium-navbar[data-transparent="false"] .nav-login-btn {
          background: var(--emerald);
          border: 1.5px solid var(--emerald);
          color: white;
          box-shadow: 0 4px 12px rgba(27,107,74,0.2);
        }
        .premium-navbar[data-transparent="false"] .nav-login-btn:hover {
          background: var(--emerald-light);
          transform: translateY(-1px);
        }

        /* ── Links ── */
        .nav-links {
          display: none;
          align-items: center;
          gap: 0.25rem;
        }
        .nav-link-item {
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9375rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        /* ── Auth Area ── */
        .nav-auth {
          display: none;
          align-items: center;
          gap: 0.75rem;
        }
        .nav-user-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 1rem 0.375rem 0.375rem;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .nav-user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gold), var(--gold-light));
          color: white;
          font-weight: 800;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-user-name {
          font-weight: 700;
          font-size: 0.875rem;
        }
        .nav-logout-btn {
          background: transparent;
          border: none;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.5rem;
          transition: color 0.2s;
          font-family: inherit;
        }
        .nav-login-btn {
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.9375rem;
          text-decoration: none;
          transition: all 0.2s;
        }

        /* ── Responsive ── */
        @media (min-width: 900px) {
          .nav-links { display: flex; }
          .nav-auth { display: flex; }
        }

        /* =========================================
           MOBILE TAB BAR (Floating Pill Style)
        ========================================= */
        .mobile-tab-bar {
          display: none;
          position: fixed;
          bottom: clamp(1rem, 4vw, 2rem);
          left: 1.25rem;
          right: 1.25rem;
          z-index: 190;
          height: 72px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0,0,0,0.04);
          justify-content: space-between;
          align-items: center;
          padding: 0 0.5rem;
        }
        
        @media (max-width: 899px) {
          .mobile-tab-bar { display: flex; }
          .premium-navbar { display: none; } /* Hide top nav entirely on mobile to focus on tab bar */
        }

        .tab-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          flex: 1;
          height: 100%;
          color: #9CA3AF;
          font-size: 0.625rem;
          font-weight: 700;
          transition: all 0.2s;
        }
        .tab-item.active {
          color: var(--emerald);
        }
        .tab-item.active span {
          color: var(--charcoal);
        }

        /* Center Action */
        .tab-center-wrap {
          position: relative;
          width: 80px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tab-center-btn {
          position: absolute;
          top: -24px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--emerald), var(--emerald-light));
          border: 4px solid var(--ivory);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(27,107,74,0.35);
          transition: transform 0.2s;
        }
        .tab-center-btn:active {
          transform: scale(0.92);
        }

        /* =========================================
           BOTTOM SHEET
        ========================================= */
        .bottom-sheet-backdrop {
          position: fixed;
          inset: 0;
          z-index: 210;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .bottom-sheet-backdrop.open {
          opacity: 1;
          pointer-events: auto;
        }

        .bottom-sheet-modal {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 220;
          background: var(--white);
          border-radius: 20px 20px 0 0;
          padding: 2rem 1.5rem calc(2rem + env(safe-area-inset-bottom));
          box-shadow: 0 -12px 40px rgba(0,0,0,0.15);
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .bottom-sheet-modal.open {
          transform: translateY(0);
        }

        .bs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .bs-header h3 {
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--charcoal);
          margin: 0;
        }
        .bs-close-btn {
          background: var(--ivory-dark);
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .bs-close-btn:hover {
          background: #FEE2E2;
          color: var(--error);
        }

        .bs-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem 0.5rem;
        }
        
        .bs-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
        .bs-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: var(--ivory);
          border: 1.5px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--emerald);
          transition: all 0.2s;
        }
        .bs-item span {
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--text-body);
          text-align: center;
          transition: color 0.2s;
        }
        
        .bs-item:hover .bs-icon-wrap {
          background: var(--emerald-pale);
          border-color: var(--emerald);
          transform: translateY(-2px);
        }
        .bs-item:hover span {
          color: var(--emerald);
        }

        .bs-item.logout .bs-icon-wrap {
          background: #FEF2F2;
          border-color: #FCA5A5;
          color: var(--error);
        }
        .bs-item.logout .logout-icon {
          transform: rotate(180deg);
        }
        .bs-item.logout:hover .bs-icon-wrap {
          background: var(--error);
          border-color: var(--error);
          color: white;
        }
        .bs-item.logout:hover span {
          color: var(--error);
        }
      `}</style>
    </>
  );
}
