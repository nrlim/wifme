"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useUI } from "@/components/UIProvider";
import { supabaseClient, bucketName, compressImage } from "@/lib/supabase-client";

export function AmirHeaderPanel({
  name,
  email,
  role,
  avatarUrl,
}: {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { toast, confirm } = useUI();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(avatarUrl || null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressedFile = await compressImage(file, 0.5);
      const fileExt = compressedFile.name.split('.').pop() || "jpg";
      const fileName = `profile_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error } = await supabaseClient.storage.from(bucketName).upload(filePath, compressedFile);
      if (error) throw error;

      const { data: urlData } = supabaseClient.storage.from(bucketName).getPublicUrl(filePath);
      setUploadedUrl(urlData.publicUrl);
    } catch (err) {
      toast("error", "Gagal", "Gagal mengunggah foto profil. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Logout",
      message: "Apakah Anda yakin ingin keluar?",
      confirmLabel: "Logout",
      cancelLabel: "Batal",
      variant: "danger",
    });
    if (!ok) return;

    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  };

  const ROLE_LABEL: Record<string, string> = {
    AMIR: "Administrator AMIR",
    JAMAAH: "Jamaah",
    MUTHAWIF: "Muthawif",
  };

  return (
    <>
      {/* Avatar trigger button */}
      <button
        onClick={() => setPanelOpen(true)}
        className="header-avatar-btn"
        title="Profil Saya"
      >
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--emerald-pale)", color: "var(--emerald)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: "0.875rem",
          border: "2px solid var(--border)",
          overflow: "hidden"
        }}>
          {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
        </div>
        <div className="header-user-text">
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--charcoal)", lineHeight: 1.2, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
          </div>
          <div style={{ fontSize: "0.6875rem", color: "var(--emerald)", marginTop: "0.1rem", fontWeight: 600 }}>
            ● {ROLE_LABEL[role] || role}
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" className="header-user-text">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Slide panel */}
      {panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 360, background: "white", height: "100%", boxShadow: "-16px 0 64px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", animation: "slideInRight 0.28s cubic-bezier(0.4,0,0.2,1)" }}
          >
            {/* Strip */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Profil Saya</span>
              <button onClick={() => setPanelOpen(false)} style={{ background: "none", border: "1px solid var(--border)", cursor: "pointer", padding: "0.35rem", borderRadius: "8px", color: "var(--text-muted)", display: "flex" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto" }}>

              {/* Identity card */}
              <div style={{ padding: "2rem 1.5rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.875rem", textAlign: "center", background: "linear-gradient(180deg, var(--emerald-pale) 0%, white 100%)", borderBottom: "1px solid var(--border)", position: "relative" }}>
                <button onClick={() => setIsEditing(!isEditing)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "white", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.35rem 0.5rem", fontSize: "0.6875rem", fontWeight: 700, cursor: "pointer", color: "var(--text-muted)" }}>
                  {isEditing ? "Batal" : "Edit"}
                </button>
                {isEditing ? (
                  <form action={async (formData) => {
                    const { updateUserProfile } = await import("./userActions");
                    await updateUserProfile({ success: false, message: "" }, formData);
                    setIsEditing(false);
                  }} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
                      <input type="hidden" name="photoUrl" value={uploadedUrl || ""} />
                      <label 
                        style={{ 
                          width: 84, height: 84, borderRadius: "50%", overflow: "hidden", 
                          background: "var(--emerald)", color: "white", display: "flex", 
                          alignItems: "center", justifyContent: "center", fontSize: "1.5rem", 
                          fontWeight: 800, border: "3px solid white", 
                          boxShadow: "0 4px 20px rgba(27,107,74,0.15)", position: "relative",
                          cursor: isUploading ? "not-allowed" : "pointer" 
                        }}
                        title="Klik untuk mengubah foto profil"
                      >
                        {uploadedUrl ? (
                          <img src={uploadedUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isUploading ? 0.5 : 1, transition: "opacity 0.2s" }} />
                        ) : (
                          initials
                        )}
                        <div 
                          style={{
                            position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            opacity: isUploading ? 1 : 0, transition: "opacity 0.2s", backdropFilter: "blur(2px)",
                          }}
                          onMouseEnter={(e) => !isUploading && (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={(e) => !isUploading && (e.currentTarget.style.opacity = "0")}
                        >
                          {isUploading ? (
                            <span className="spinner" style={{ width: 22, height: 22, borderWidth: 2.5, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                          ) : (
                            <>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                              <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.05em", color: "white", marginTop: "0.25rem" }}>UBAH</span>
                            </>
                          )}
                        </div>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} disabled={isUploading} />
                      </label>
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", textAlign: "left", marginBottom: "0.2rem" }}>Nama Lengkap</label>
                      <input name="name" defaultValue={name} required style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.8125rem" }} />
                    </div>
                    <button type="submit" style={{ width: "100%", background: "var(--emerald)", color: "white", fontWeight: 700, fontSize: "0.8125rem", padding: "0.625rem", borderRadius: "8px", border: "none", cursor: "pointer", marginTop: "0.5rem" }}>Simpan Perubahan</button>
                  </form>
                ) : (
                  <>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "var(--emerald)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 800, border: "3px solid white", boxShadow: "0 4px 20px rgba(27,107,74,0.25)" }}>
                      {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1.0625rem", color: "var(--charcoal)" }}>{name}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{email}</div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", marginTop: "0.625rem", background: "var(--emerald)", color: "white", fontSize: "0.6875rem", fontWeight: 700, padding: "0.3rem 0.75rem", borderRadius: "99px" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        {ROLE_LABEL[role] || role}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Quick links */}
              <div style={{ padding: "1.25rem 1.5rem" }}>
                <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Navigasi Cepat</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[
                    {
                      roles: ["AMIR", "MUTHAWIF", "JAMAAH"],
                      href: "/dashboard?tab=beranda",
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
                      label: "Riwayat Pesanan",
                      sub: "Lihat semua transaksi booking",
                    },
                    {
                      roles: ["JAMAAH"],
                      href: "/dashboard?tab=cari",
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
                      label: "Cari Muthawif",
                      sub: "Temukan pendamping ibadah terbaik",
                    },
                    {
                      roles: ["AMIR"],
                      href: "/dashboard?tab=muthawif",
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>,
                      label: "Manajemen Muthawif",
                      sub: "Review & verifikasi akun",
                    },
                    {
                      roles: ["MUTHAWIF"],
                      href: "/dashboard/muthawif?tab=wallet",
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>,
                      label: "Dompet Muthawif",
                      sub: "Escrow & Pencairan Dana",
                    },
                    {
                      roles: ["AMIR"],
                      href: "/dashboard?tab=simulator",
                      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
                      label: "Simulator Midtrans",
                      sub: "Testing Flow Pembayaran",
                    }
                  ].filter(action => action.roles.includes(role)).map(action => (
                    <Link
                      key={action.href}
                      href={action.href}
                      onClick={() => setPanelOpen(false)}
                      style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1rem", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--ivory)", textDecoration: "none", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--emerald)"; e.currentTarget.style.background = "var(--emerald-pale)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--ivory)"; }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: "10px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", color: "var(--charcoal)", flexShrink: 0 }}>
                        {action.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--charcoal)" }}>{action.label}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{action.sub}</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer — logout */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "white", flexShrink: 0 }}>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #FCA5A5", background: "white", color: "var(--error)", fontWeight: 700, fontSize: "0.875rem", cursor: loggingOut ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "all 0.2s" }}
                onMouseEnter={e => !loggingOut && (e.currentTarget.style.background = "#FEF2F2")}
                onMouseLeave={e => !loggingOut && (e.currentTarget.style.background = "white")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                {loggingOut ? "Keluar..." : "Keluar dari Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </>
  );
}
