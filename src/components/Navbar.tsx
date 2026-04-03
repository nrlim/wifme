"use client";

import { useState, useEffect } from "react";
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

export default function Navbar({ user }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const isHero = pathname === "/";

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
          background: scrolled
            ? "rgba(250, 247, 242, 0.95)"
            : isHero
            ? "transparent"
            : "rgba(250, 247, 242, 0.95)",
          backdropFilter: scrolled || !isHero ? "blur(12px)" : "none",
          borderBottom: scrolled || !isHero ? "1px solid var(--border)" : "none",
          boxShadow: scrolled ? "var(--shadow-sm)" : "none",
          padding: scrolled ? "0.75rem 0" : "1.25rem 0",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--emerald), var(--emerald-light))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <div>
              <span style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: scrolled || !isHero ? "var(--charcoal)" : "white",
                letterSpacing: "-0.02em",
              }}>
                Wif<span style={{ color: "var(--gold)" }}>-Me</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }} className="desktop-nav">
            {[
              { href: user?.role === "JAMAAH" ? "/dashboard?tab=cari" : "/#search", label: "Cari Muthawif" },
              { href: "/#cara-kerja", label: "Cara Kerja" },
              { href: "/#tentang", label: "Tentang" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  color: scrolled || !isHero ? "var(--text-body)" : "rgba(255,255,255,0.9)",
                  transition: "var(--transition)",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: scrolled || !isHero ? "var(--emerald)" : "rgba(255,255,255,0.9)",
                  }}
                >
                  {user.name.split(" ")[0]}
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: scrolled || !isHero ? "var(--charcoal)" : "rgba(255,255,255,0.92)",
                    padding: "0.5rem 0.875rem",
                    borderRadius: "var(--radius-sm)",
                    transition: "var(--transition)",
                  }}
                >
                  Masuk
                </Link>
                <Link href="/auth/register" className="btn btn-primary btn-sm">
                  Daftar
                </Link>
              </>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: scrolled || !isHero ? "var(--charcoal)" : "white",
              }}
              className="hamburger"
              aria-label="Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12"/>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div style={{
            background: "var(--white)",
            borderTop: "1px solid var(--border)",
            padding: "1.25rem",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { href: user?.role === "JAMAAH" ? "/dashboard?tab=cari" : "/#search", label: "Cari Muthawif" },
                { href: "/#cara-kerja", label: "Cara Kerja" },
                { href: "/#tentang", label: "Tentang" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-body)", padding: "0.5rem 0" }}
                >
                  {item.label}
                </Link>
              ))}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {user ? (
                  <button onClick={handleLogout} className="btn btn-secondary w-full">Keluar</button>
                ) : (
                  <>
                    <Link href="/auth/login" className="btn btn-secondary w-full">Masuk</Link>
                    <Link href="/auth/register" className="btn btn-primary w-full">Daftar Gratis</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .hamburger {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
