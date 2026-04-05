"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface User {
  name: string;
  email: string;
  role: string;
}

interface NavbarProps {
  user?: User | null;
}

const NAV_LINKS = [
  { href: "/#search",     label: "Cari Muthawif", emoji: "🔍", desc: "Temukan muthawif tersedia" },
  { href: "/#cara-kerja", label: "Cara Kerja",     emoji: "📋", desc: "3 langkah mudah booking" },
  { href: "/#tentang",    label: "Tentang",         emoji: "✨", desc: "Kenali platform kami" },
];

export default function Navbar({ user }: NavbarProps) {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
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

  // lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // close drawer on Escape
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

  // Drawer nav links based on role
  const drawerLinks = user?.role === "JAMAAH"
    ? [
        { href: "/dashboard?tab=cari", label: "Cari Muthawif", emoji: "🔍", desc: "Temukan muthawif" },
        { href: "/dashboard",          label: "Dashboard",      emoji: "📊", desc: "Lihat pesanan saya" },
        { href: "/#cara-kerja",        label: "Cara Kerja",     emoji: "📋", desc: "Panduan booking" },
        { href: "/#tentang",           label: "Tentang Kami",   emoji: "✨", desc: "Info platform" },
      ]
    : user
    ? [
        { href: `/dashboard/${user.role.toLowerCase()}`, label: "Dashboard", emoji: "📊", desc: "Panel saya" },
        { href: "/#cara-kerja", label: "Cara Kerja",  emoji: "📋", desc: "Panduan" },
        { href: "/#tentang",    label: "Tentang",      emoji: "✨", desc: "Info platform" },
      ]
    : NAV_LINKS;

  return (
    <>
      {/* ══════════════════════════════════════
          NAVBAR BAR
      ══════════════════════════════════════ */}
      <nav
        id="main-nav"
        aria-label="Navigasi utama"
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 200,
          transition: "background 0.35s ease, box-shadow 0.35s ease, padding 0.3s ease, border-color 0.35s ease",
          background:   transparent ? "transparent" : "rgba(250,247,242,0.97)",
          backdropFilter: transparent ? "none" : "blur(18px)",
          WebkitBackdropFilter: transparent ? "none" : "blur(18px)",
          borderBottom: `1px solid ${transparent ? "rgba(255,255,255,0)" : "rgba(220,210,195,0.7)"}`,
          boxShadow:    transparent ? "none" : "0 2px 24px rgba(0,0,0,0.07)",
          padding:      transparent ? "1rem 0" : "0.75rem 0",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>

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
              <div style={{
                fontSize: "1.1875rem",
                fontWeight: 900,
                color: transparent ? "white" : "#1a1a1a",
                letterSpacing: "-0.025em",
                lineHeight: 1,
                transition: "color 0.3s",
              }}>
                Wif<span style={{ color: "#C4973B" }}>–Me</span>
              </div>
              {!transparent && (
                <div style={{ fontSize: "0.5625rem", fontWeight: 700, color: "#BDB5A6", letterSpacing: "0.07em", marginTop: "2px" }}>
                  MARKETPLACE MUTHAWIF
                </div>
              )}
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
          <div className="nb-desktop-auth" style={{ display: "none", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
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
              <>
                <Link href="/auth/login" className={`nb-login-link ${transparent ? "nb-link-glass" : "nb-link-solid"}`} style={{
                  fontSize: "0.9375rem", fontWeight: 600,
                  color: transparent ? "rgba(255,255,255,0.9)" : "#4a4a4a",
                  textDecoration: "none",
                  padding: "0.5rem 0.875rem",
                  borderRadius: "10px",
                  transition: "background 0.15s, color 0.15s",
                  whiteSpace: "nowrap",
                }}>Masuk</Link>
                <Link href="/auth/register" style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "0.5625rem 1.125rem",
                  borderRadius: "11px",
                  background: transparent ? "white" : "linear-gradient(135deg, #1B6B4A, #27956A)",
                  color: transparent ? "#1B6B4A" : "white",
                  fontWeight: 700, fontSize: "0.9375rem",
                  textDecoration: "none",
                  boxShadow: transparent ? "0 4px 16px rgba(0,0,0,0.18)" : "0 3px 10px rgba(27,107,74,0.28)",
                  whiteSpace: "nowrap",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}>Daftar Gratis</Link>
              </>
            )}
          </div>

          {/* ── Mobile Right Side: user avatar + hamburger ── */}
          <div className="nb-mobile-right" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>

            {/* If logged in on mobile: show mini avatar */}
            {user && (
              <Link
                href="/dashboard"
                aria-label={`Dashboard ${firstName}`}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg, #1B6B4A, #27956A)",
                  color: "white", fontWeight: 800, fontSize: "0.8125rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  textDecoration: "none",
                  border: `2px solid ${transparent ? "rgba(255,255,255,0.3)" : "rgba(27,107,74,0.2)"}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {firstNameInitial}
              </Link>
            )}

            {/* Hamburger toggle */}
            <button
              id="nav-hamburger"
              onClick={() => setMenuOpen(true)}
              aria-label="Buka menu navigasi"
              aria-haspopup="dialog"
              style={{
                width: 42, height: 42,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 10,
                background: transparent ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.05)",
                border: `1.5px solid ${transparent ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.07)"}`,
                cursor: "pointer",
                color: transparent ? "white" : "#2C2C2C",
                flexShrink: 0,
                padding: 0,
              }}
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <rect y="0"  width="18" height="2" rx="1" fill="currentColor"/>
                <rect y="6"  width="13" height="2" rx="1" fill="currentColor" opacity="0.7"/>
                <rect y="12" width="9"  height="2" rx="1" fill="currentColor" opacity="0.4"/>
              </svg>
            </button>
          </div>

        </div>
      </nav>

      {/* ══════════════════════════════════════
          MOBILE DRAWER BACKDROP
      ══════════════════════════════════════ */}
      <div
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 210,
          background: "rgba(10,20,15,0.6)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 0.32s ease",
        }}
      />

      {/* ══════════════════════════════════════
          MOBILE DRAWER PANEL (slide from right)
      ══════════════════════════════════════ */}
      <div
        id="nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        style={{
          position: "fixed",
          top: 0, right: 0, bottom: 0,
          zIndex: 220,
          width: "min(88vw, 320px)",
          display: "flex",
          flexDirection: "column",
          background: "#0d2818",
          transform: menuOpen ? "translateX(0)" : "translateX(calc(100% + 24px))",
          transition: "transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: menuOpen ? "-12px 0 48px rgba(0,0,0,0.45)" : "none",
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        {/* Decorative gradient overlay inside drawer */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "linear-gradient(170deg, #1B6B4A 0%, #0d2818 65%)",
          opacity: 0.9,
        }} />
        <div aria-hidden="true" style={{
          position: "absolute", top: "-40px", right: "-40px",
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(196,151,59,0.06)", pointerEvents: "none", zIndex: 0,
        }} />

        {/* ── Drawer header ── */}
        <div style={{
          position: "relative", zIndex: 1,
          padding: "1rem 1.25rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg, #1B6B4A, #27956A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 900, fontSize: "1.0625rem", letterSpacing: "-0.02em", lineHeight: 1 }}>
                Wif<span style={{ color: "#E4B55A" }}>–Me</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.07em", marginTop: 2 }}>
                MARKETPLACE MUTHAWIF
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Tutup menu"
            style={{
              width: 34, height: 34, borderRadius: 8,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── User card (if logged in) ── */}
        {user ? (
          <div style={{
            position: "relative", zIndex: 1,
            margin: "1rem 1.25rem 0",
            padding: "1rem",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", gap: "0.875rem",
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: "linear-gradient(135deg, #C4973B, #E4B55A)",
              color: "white", fontWeight: 900, fontSize: "1.25rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 4px 12px rgba(196,151,59,0.3)",
            }}>
              {firstNameInitial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.6875rem", fontWeight: 600, marginBottom: "0.125rem" }}>
                Selamat datang,
              </div>
              <div style={{ color: "white", fontWeight: 800, fontSize: "0.9375rem", lineHeight: 1.2 }}>
                {firstName}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6875rem", marginTop: "0.125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </div>
            </div>
          </div>
        ) : (
          /* Guest: quick CTA at top */
          <div style={{
            position: "relative", zIndex: 1,
            margin: "1rem 1.25rem 0",
            padding: "1rem",
            borderRadius: "16px",
            background: "rgba(196,151,59,0.12)",
            border: "1px solid rgba(196,151,59,0.2)",
          }}>
            <div style={{ color: "rgba(228,181,90,0.9)", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              🌙 Bergabung sekarang
            </div>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8125rem", lineHeight: 1.5, marginBottom: "0.875rem" }}>
              Temukan Muthawif terpercaya untuk Umrah Anda
            </p>
            <Link
              href="/auth/register"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0.625rem", borderRadius: "10px",
                background: "linear-gradient(135deg, #C4973B, #E4B55A)",
                color: "white", fontWeight: 700, fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              ✨ Daftar Gratis
            </Link>
          </div>
        )}

        {/* ── Nav links ── */}
        <div style={{ position: "relative", zIndex: 1, padding: "1rem 1rem 0", flex: 1 }}>
          <div style={{
            fontSize: "0.625rem", fontWeight: 700,
            color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em",
            marginBottom: "0.375rem", padding: "0 0.25rem",
          }}>
            NAVIGASI
          </div>

          {drawerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="drawer-lnk"
              style={{
                display: "flex", alignItems: "center", gap: "0.875rem",
                padding: "0.75rem 0.875rem",
                borderRadius: "13px",
                textDecoration: "none",
                marginBottom: "0.25rem",
                transition: "background 0.15s",
              }}
            >
              {/* Icon bubble */}
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.125rem",
              }}>
                {item.emoji}
              </div>

              {/* Text */}
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "rgba(255,255,255,0.95)", fontWeight: 700, fontSize: "0.9375rem", lineHeight: 1.2 }}>
                  {item.label}
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6875rem", marginTop: "0.125rem" }}>
                  {item.desc}
                </div>
              </div>

              {/* Arrow */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" style={{ marginLeft: "auto", flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{ position: "relative", zIndex: 1, padding: "1rem 1.25rem 2.5rem" }}>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1rem" }}>
            {user ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    padding: "0.875rem", borderRadius: "13px",
                    background: "rgba(255,255,255,0.1)",
                    border: "1.5px solid rgba(255,255,255,0.18)",
                    color: "white", fontWeight: 700, fontSize: "0.9375rem",
                    textDecoration: "none",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    padding: "0.875rem", borderRadius: "13px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1.5px solid rgba(239,68,68,0.25)",
                    color: "#FCA5A5", fontWeight: 600, fontSize: "0.875rem",
                    cursor: "pointer", fontFamily: "inherit", width: "100%",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Keluar
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          GLOBAL CSS
      ══════════════════════════════════════ */}
      <style>{`
        /* Mobile: show only right side controls, hide desktop blocks */
        .nb-desktop-links { display: none !important; }
        .nb-desktop-auth  { display: none !important; }
        .nb-mobile-right  { display: flex !important; }

        /* Desktop breakpoint */
        @media (min-width: 768px) {
          .nb-desktop-links { display: flex !important; }
          .nb-desktop-auth  { display: flex !important; }
          .nb-mobile-right  { display: none !important; }
        }

        /* Link hover states */
        .nb-link-glass:hover { background: rgba(255,255,255,0.12) !important; color: white !important; }
        .nb-link-solid:hover { background: rgba(27,107,74,0.08) !important; color: #1B6B4A !important; }

        /* Drawer link */
        .drawer-lnk:hover { background: rgba(255,255,255,0.09) !important; }
        .drawer-lnk:active { background: rgba(255,255,255,0.14) !important; }

        /* Prevent layout shift */
        #nav-drawer {
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </>
  );
}
