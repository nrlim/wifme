"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const defaultRole = (searchParams.get("role") || "JAMAAH") as "JAMAAH" | "MUTHAWIF";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: defaultRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Password tidak cocok.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.error || "Terjadi kesalahan.");
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
        fontSize: "0.9375rem",
        zIndex: 10,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Kembali
      </Link>

      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 2 }}>
        {/* Logo Header */}
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
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
          <h1 style={{ fontSize: "clamp(1.375rem, 4vw, 1.625rem)", fontWeight: 800, marginBottom: "0.375rem", color: "white" }}>Buat Akun Baru</h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9375rem" }}>
            Bergabung dan mulai perjalanan spiritual Anda
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--white)",
          borderRadius: "var(--radius-xl)",
          padding: "clamp(1.25rem, 5vw, 1.75rem)",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
        }}>
          {/* Role Toggle */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
            marginBottom: "1.25rem",
            background: "var(--ivory-dark)",
            borderRadius: "var(--radius-md)",
            padding: "0.3rem",
          }}>
            {(["JAMAAH", "MUTHAWIF"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm({ ...form, role })}
                style={{
                  padding: "0.625rem",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  transition: "var(--transition)",
                  background: form.role === role ? "var(--white)" : "transparent",
                  color: form.role === role ? "var(--emerald)" : "var(--text-muted)",
                  boxShadow: form.role === role ? "var(--shadow-sm)" : "none",
                }}
              >
                {role === "JAMAAH" ? "Saya Jamaah" : "Saya Muthawif"}
              </button>
            ))}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Nama Lengkap</label>
              <input
                id="reg-name"
                type="text"
                className="form-input"
                placeholder="Ahmad Fauzi"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Minimal 8 karakter"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ paddingRight: "2.5rem" }}
                  required
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
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Konfirmasi Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="reg-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Ulangi password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  style={{ paddingRight: "2.5rem" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "0.9375rem", marginTop: "0.25rem" }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Daftar Sekarang"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Sudah punya akun?{" "}
            <Link href="/auth/login" style={{ color: "var(--emerald)", fontWeight: 600 }}>
              Masuk di sini
            </Link>
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.8)" }}>
          Dengan mendaftar, Anda menyetujui{" "}
          <Link href="#" style={{ color: "var(--gold)" }}>Syarat & Ketentuan</Link>{" "}
          kami.
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ height: "100dvh", background: "var(--ivory)", display: "flex", alignItems: "center", justifyContent: "center" }}><span className="spinner" style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--emerald)" }} /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
