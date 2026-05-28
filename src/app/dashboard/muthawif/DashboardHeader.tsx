"use client";

import { useState } from "react";
import Link from "next/link";
import { useUI } from "@/components/UIProvider";
import { supabaseClient, bucketName, compressImage } from "@/lib/supabase-client";

type ProfileData = {
  bio: string | null;
  basePrice: number;
  location: string;
  experience: number;
  languages: string[];
  specializations: string[];
  verificationStatus: string;
  documentsUrl: string[];
} | null;



export function DashboardHeader({
  name,
  email,
  avatarUrl,
  title,
  profile,
  userName,
  whatsappNumber,
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
  title?: string;
  profile?: ProfileData;
  userName?: string;
  whatsappNumber?: string | null;
}) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
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

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "M";

  const docsCount = profile?.documentsUrl?.length ?? 0;

  return (
    <>
      <header className="muthawif-header" style={{ background: "linear-gradient(135deg, #0d2818 0%, #1B6B4A 100%)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        {/* LEFT */}
        <div className="muthawif-header-left">
          <div style={{ width: 34, height: 34, borderRadius: 9, overflow: "hidden", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            <img src="/logo-icon.png" alt="Wifme" width={34} height={34} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.15)", flexShrink: 0 }} className="header-divider-left" />
          <div>
            <p style={{ fontSize: "0.5875rem", color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1 }}>Wif–Me</p>
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "white", lineHeight: 1.2, marginTop: "0.2rem" }}>
              {title || "Panel Muthawif"}
            </h2>
          </div>
        </div>

        {/* RIGHT */}
        <div className="muthawif-header-right">
          <button onClick={() => setPanelOpen(true)} className="header-avatar-btn" title="Profil Saya" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "99px", padding: "0.375rem 0.875rem 0.375rem 0.375rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #C4973B, #E4B55A)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8125rem", overflow: "hidden", flexShrink: 0 }}>
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            </div>
            <div className="header-user-text">
              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "white", lineHeight: 1.2, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
              <div style={{ fontSize: "0.625rem", color: "rgba(228,181,90,0.9)", marginTop: "0.1rem", fontWeight: 600 }}>● Aktif</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" className="header-user-text">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </header>

      {/* ===== PROFILE OVERVIEW PANEL ===== */}
      {panelOpen && (
        <div onClick={() => setPanelOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, background: "white", height: "100%", boxShadow: "-16px 0 64px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", animation: "slideInRight 0.28s cubic-bezier(0.4,0,0.2,1)" }}>

            {/* === Header strip === */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Profil Saya</span>
              <button onClick={() => setPanelOpen(false)} style={{ background: "none", border: "1px solid var(--border)", cursor: "pointer", padding: "0.35rem", borderRadius: "8px", color: "var(--text-muted)", display: "flex" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* === Scrollable body === */}
            <div style={{ flex: 1, overflowY: "auto" }}>

              {/* Identity card */}
              <div style={{ padding: "2rem 1.5rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.875rem", textAlign: "center", background: "linear-gradient(180deg, var(--emerald-pale) 0%, white 100%)", borderBottom: "1px solid var(--border)", position: "relative" }}>
                <button onClick={() => setIsEditing(!isEditing)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "white", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.35rem 0.5rem", fontSize: "0.6875rem", fontWeight: 700, cursor: "pointer", color: "var(--text-muted)" }}>
                  {isEditing ? "Batal" : "Edit"}
                </button>
                {isEditing ? (
                  <form action={async (formData) => {
                    const { updateUserProfile } = await import("../userActions");
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
                    <div style={{ marginBottom: "0.5rem" }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", textAlign: "left", marginBottom: "0.2rem" }}>
                        Nomor WhatsApp <span style={{ fontWeight: 400 }}>(Mulai dengan 8xx atau 628xx)</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--charcoal)", fontWeight: 700, fontSize: "0.8125rem", pointerEvents: "none" }}>+62</span>
                        <input
                          name="whatsappNumber"
                          defaultValue={whatsappNumber?.replace(/^62/, "") || ""}
                          disabled={true}
                          style={{
                            width: "100%",
                            padding: "0.5rem 0.5rem 0.5rem 2.5rem",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            fontSize: "0.8125rem",
                            background: "var(--ivory-dark)",
                            color: "var(--text-muted)",
                          }}
                        />
                      </div>
                      <div style={{ fontSize: "0.625rem", color: "var(--gold)", marginTop: "0.25rem", display: "flex", gap: "0.25rem", alignItems: "center" }}>
                        <span>ℹ</span> Hubungi Admin/Amir untuk mengubah nomor WhatsApp.
                      </div>
                    </div>
                    <button type="submit" style={{ width: "100%", background: "var(--emerald)", color: "white", fontWeight: 700, fontSize: "0.8125rem", padding: "0.625rem", borderRadius: "8px", border: "none", cursor: "pointer", marginTop: "0.5rem" }}>Simpan Perubahan</button>
                  </form>
                ) : (
                  <>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "white", color: "var(--emerald)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 800, border: "3px solid white", boxShadow: "0 4px 20px rgba(27,107,74,0.18)" }}>
                      {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
                        <div style={{ fontWeight: 800, fontSize: "1.0625rem", color: "var(--charcoal)" }}>{name}</div>
                        {(!profile || profile.verificationStatus === "VERIFIED") && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--emerald)" stroke="var(--emerald)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <title>Akun Terverifikasi</title>
                            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                            <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="3" fill="none" />
                          </svg>
                        )}
                      </div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{email}</div>
                      {whatsappNumber && (
                        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.375rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          +{whatsappNumber}
                        </div>
                      )}
                      <span style={{ 
                        display: "inline-flex", alignItems: "center", gap: "0.375rem", marginTop: "0.625rem", 
                        background: profile?.verificationStatus === "VERIFIED" ? "var(--emerald)" : profile?.verificationStatus === "REJECTED" ? "var(--error)" : "var(--gold)", 
                        color: "white", fontSize: "0.6875rem", fontWeight: 700, padding: "0.3rem 0.75rem", borderRadius: "99px" 
                      }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          {profile?.verificationStatus === "VERIFIED" ? (
                            <polyline points="20 6 9 17 4 12"/>
                          ) : profile?.verificationStatus === "REJECTED" ? (
                            <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                          ) : (
                            <circle cx="12" cy="12" r="10"/>
                          )}
                        </svg>
                        {profile?.verificationStatus === "VERIFIED" ? "Muthawif Terverifikasi" : 
                         profile?.verificationStatus === "REJECTED" ? "Verifikasi Ditolak" : 
                         profile?.verificationStatus === "REVIEW" ? "Sedang Direview" : "Proses Verifikasi"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer — logout */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "white", flexShrink: 0 }}>
              <button onClick={handleLogout} disabled={loggingOut} style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", border: "1px solid #FCA5A5", background: loggingOut ? "#FEF2F2" : "white", color: "var(--error)", fontWeight: 700, fontSize: "0.875rem", cursor: loggingOut ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "all 0.2s" }}
                onMouseEnter={e => !loggingOut && (e.currentTarget.style.background = "#FEF2F2")}
                onMouseLeave={e => !loggingOut && (e.currentTarget.style.background = "white")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
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
