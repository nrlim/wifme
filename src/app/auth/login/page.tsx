"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        const userRole = data.user?.role;
        const target = userRole === "AMIR" || userRole === "MUTHAWIF" ? "/dashboard" : redirect;
        router.push(target);
        router.refresh();
      } else {
        setError(data.error || "Login gagal.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #0f3d28 0%, #1B6B4A 45%, #2A8A60 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "5rem 1.25rem 2rem",
      position: "relative",
      overflowX: "hidden",
    }}>
      {/* Decorative geometric pattern */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-15%", right: "-10%", width: "60vw", maxWidth: 700, height: "60vw", maxHeight: 700, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", top: "10%", right: "5%", width: "30vw", maxWidth: 360, height: "30vw", maxHeight: 360, borderRadius: "50%", background: "rgba(196, 151, 59, 0.08)", border: "1px solid rgba(196, 151, 59, 0.12)" }} />
        <div style={{ position: "absolute", bottom: "-5%", left: "-5%", width: "40vw", maxWidth: 480, height: "40vw", maxHeight: 480, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }} />
        <svg style={{ position: "absolute", bottom: 0, right: "8%", opacity: 0.04, width: 280 }} viewBox="0 0 200 180" fill="white">
          <rect x="20" y="60" width="160" height="120" rx="4"/>
          <rect x="80" y="110" width="40" height="70"/>
          <rect x="10" y="55" width="180" height="12"/>
          <polygon points="100,10 10,55 190,55"/>
        </svg>
      </div>

      <Link href="/" style={{
        position: "absolute",
        top: "1.25rem",
        left: "1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        color: "white",
        textDecoration: "none",
        fontWeight: 600,
        zIndex: 10,
        fontSize: "0.9375rem",
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Kembali
      </Link>

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 2 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.5rem" }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "11px",
              background: "linear-gradient(135deg, var(--emerald-light), var(--emerald))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "white" }}>
              Wif<span style={{ color: "var(--gold)" }}>-Me</span>
            </span>
          </Link>
          <h1 style={{ fontSize: "clamp(1.375rem, 4vw, 1.625rem)", fontWeight: 800, marginBottom: "0.375rem", color: "white" }}>Selamat Datang</h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9375rem" }}>
            Masuk untuk melanjutkan booking Muthawif
          </p>
        </div>

        <div style={{
          background: "var(--white)",
          borderRadius: "var(--radius-xl)",
          padding: "clamp(1.5rem, 5vw, 2.25rem)",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
        }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="form-label" htmlFor="login-password">Password</label>
                <Link href="#" style={{ fontSize: "0.8125rem", color: "var(--emerald)", fontWeight: 500 }}>
                  Lupa password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ paddingRight: "2.5rem" }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              id="login-submit"
              style={{ width: "100%", justifyContent: "center", padding: "0.9375rem", marginTop: "0.25rem" }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Masuk"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Belum punya akun?{" "}
            <Link href={`/auth/register?redirect=${encodeURIComponent(redirect)}`} style={{ color: "var(--emerald)", fontWeight: 600 }}>
              Daftar gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ height: "100dvh", background: "var(--ivory)", display: "flex", alignItems: "center", justifyContent: "center" }}><span className="spinner" style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--emerald)" }} /></div>}>
      <LoginForm />
    </Suspense>
  );
}
