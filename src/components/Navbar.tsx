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
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          background: transparent ? "transparent" : "rgba(255,255,255,0.9)",
          backdropFilter: transparent ? "none" : "blur(16px)",
          borderBottom: transparent ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.05)",
          padding: "1rem 0",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ display: "flex", width: "100%", padding: "0 clamp(1.5rem, 5vw, 4rem)", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          {/* ── Logo ── */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 38, height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #1B6B4A, #27956A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: transparent ? "0 4px 14px rgba(0,0,0,0.25)" : "0 2px 8px rgba(27,107,74,0.2)",
              flexShrink: 0,
              transition: "box-shadow 0.3s",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ color: transparent ? "white" : "var(--charcoal)", fontWeight: 900, fontSize: "1.25rem", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  Wif<span style={{ color: "var(--gold)" }}>-Me</span>
                </span>
                <div style={{ color: transparent ? "rgba(255,255,255,0.7)" : "var(--emerald)", fontSize: "0.625rem", fontWeight: 800, letterSpacing: "0.08em", lineHeight: 1 }}>
                  PENDAMPING IBADAH UMROH
                </div>
              </div>
            </div>
          </Link>

          {/* ── Desktop Nav Links (hidden on mobile) ── */}
          <div className="nb-desktop-links" style={{ display: "none", alignItems: "center", gap: "0.125rem" }}>
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`nb-link ${transparent ? "nb-link-glass" : "nb-link-solid"}`}
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 550,
                  color: transparent ? "rgba(255,255,255,0.9)" : "#4a4a4a",
                  textDecoration: "none",
                  padding: "0.5rem 0.875rem",
                  borderRadius: "10px",
                  transition: "background 0.15s, color 0.15s",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* ── Desktop Auth (hidden on mobile) ── */}
          <div className="nb-desktop-auth" style={{ display: "none", alignItems: "center", gap: "0.5rem", flexShrink: 0, marginLeft: "1.5rem" }}>
            {/* Divider to separate from nav links */}
            <div style={{ width: 1, height: 24, background: transparent ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)", marginRight: "0.5rem" }} />
            
            {user ? (
              <>
                <Link href="/dashboard" className="nb-avatar-pill" style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.375rem 0.875rem 0.375rem 0.375rem",
                  borderRadius: "99px",
                  background: transparent ? "rgba(255,255,255,0.12)" : "rgba(27,107,74,0.08)",
                  border: `1.5px solid ${transparent ? "rgba(255,255,255,0.2)" : "rgba(27,107,74,0.15)"}`,
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "linear-gradient(135deg, #1B6B4A, #27956A)",
                    color: "white", fontWeight: 800, fontSize: "0.75rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{firstNameInitial}</div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: transparent ? "white" : "var(--emerald)", whiteSpace: "nowrap" }}>
                    {firstName}
                  </span>
                </Link>
                <button onClick={handleLogout} style={{
                  fontSize: "0.875rem", fontWeight: 600,
                  color: transparent ? "rgba(255,255,255,0.65)" : "#9CA3AF",
                  background: "none", border: "none", cursor: "pointer", padding: "0.5rem 0.375rem",
                }}>Keluar</button>
              </>
            ) : (
              <Link href="/auth/login" className={`nb-login-link ${transparent ? "nb-link-glass" : "nb-link-solid"}`} style={{
                fontSize: "0.9375rem", fontWeight: 700,
                color: transparent ? "rgba(255,255,255,0.95)" : "var(--emerald)",
                textDecoration: "none",
                padding: "0.5rem 1rem",
                borderRadius: "10px",
                transition: "background 0.15s, color 0.15s",
                whiteSpace: "nowrap",
              }}>
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
        className="nb-mobile-bottom-nav"
        style={{
          display: "flex",
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          paddingBottom: "env(safe-area-inset-bottom)",
          height: 64,
          zIndex: 190,
          justifyContent: "space-around",
          alignItems: "center",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.04)",
        }}
      >
        <Link href="/" className="bn-item" style={{ color: pathname === "/" ? "var(--emerald)" : "#9CA3AF" }}>
          <Home size={22} strokeWidth={pathname === "/" ? 2.5 : 2} />
          <span>Beranda</span>
        </Link>
        <Link href="/#search" className="bn-item" style={{ color: "#9CA3AF" }}>
          <Search size={22} />
          <span>Cari</span>
        </Link>

        {/* Center Action Button */}
        <div style={{ position: "relative", width: 64, height: 64 }}>
          <button
            onClick={handleCenterAction}
            aria-label="Fitur Utama"
            style={{
              position: "absolute",
              top: -24,
              left: "50%",
              transform: "translateX(-50%)",
              width: 56, height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--emerald), #27956A)",
              color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", cursor: "pointer",
              boxShadow: "0 8px 24px rgba(27,107,74,0.4)",
              transition: "transform 0.2s",
            }}
          >
            <LayoutGrid size={26} strokeWidth={2.5} />
          </button>
        </div>

        {user ? (
          <Link href="/dashboard" className="bn-item" style={{ color: pathname.startsWith("/dashboard") && !pathname.includes("settings") ? "var(--emerald)" : "#9CA3AF" }}>
            <ClipboardList size={22} strokeWidth={pathname.startsWith("/dashboard") && !pathname.includes("settings") ? 2.5 : 2} />
            <span>Pesanan</span>
          </Link>
        ) : (
          <Link href="/#cara-kerja" className="bn-item" style={{ color: "#9CA3AF" }}>
            <ClipboardList size={22} />
            <span>Panduan</span>
          </Link>
        )}

        {user ? (
          <Link href="/dashboard/settings" className="bn-item" style={{ color: pathname.includes("settings") ? "var(--emerald)" : "#9CA3AF" }}>
            <User size={22} strokeWidth={pathname.includes("settings") ? 2.5 : 2} />
            <span>Profil</span>
          </Link>
        ) : (
          <Link href="/auth/login" className="bn-item" style={{ color: pathname === "/auth/login" ? "var(--emerald)" : "#9CA3AF" }}>
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
        style={{
          position: "fixed", inset: 0, zIndex: 210,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      <div
        id="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu Fitur"
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 220,
          background: "white",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "24px 20px calc(24px + env(safe-area-inset-bottom))",
          transform: menuOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--charcoal)", margin: 0 }}>{user ? "Fitur Wifme" : "Menu Navigasi"}</h3>
          <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", color: "#6B7280", padding: 4, cursor: "pointer" }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px 12px" }}>
          {user ? (
            <>
              {features.map((feat) => (
                <Link
                  key={feat.href}
                  href={feat.href}
                  onClick={() => setMenuOpen(false)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textDecoration: "none" }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--ivory-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)", border: "1px solid var(--border)" }}>
                    {feat.icon}
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-body)", textAlign: "center" }}>{feat.label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <LogIn size={20} style={{ transform: "rotate(180deg)" }} />
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#EF4444", textAlign: "center" }}>Keluar</span>
              </button>
            </>
          ) : (
            NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textDecoration: "none" }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--ivory-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)", border: "1px solid var(--border)" }}>
                  {getNavIcon(link.href)}
                </div>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-body)", textAlign: "center" }}>{link.label}</span>
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
