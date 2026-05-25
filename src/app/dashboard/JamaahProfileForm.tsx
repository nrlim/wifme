"use client";

import React, { useState } from "react";
import { User, Lock, ChevronLeft } from "lucide-react";

type SectionId = "akun" | "keamanan";

interface SectionDef {
  id: SectionId;
  label: string;
  desc: string;
  icon: React.ReactNode;
  accentClass: string;
}

const SECTIONS: SectionDef[] = [
  {
    id: "akun",
    label: "Informasi Pribadi",
    desc: "Ubah nama, foto profil, dan info dasar lainnya.",
    icon: <User size={18} strokeWidth={2.5} />,
    accentClass: "bg-[var(--emerald)]",
  },
  {
    id: "keamanan",
    label: "Keamanan Akun",
    desc: "Perbarui kata sandi untuk melindungi akun Anda.",
    icon: <Lock size={18} strokeWidth={2.5} />,
    accentClass: "bg-[var(--gold)]",
  },
];

interface JamaahProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl: string | null;
  };
}

export default function JamaahProfileForm({ user }: JamaahProfileFormProps) {
  const [mobileView, setMobileView] = useState<"MENU" | "FORM">("MENU");
  const [activeSection, setActiveSection] = useState<SectionId>("akun");
  
  // Form States
  const [name, setName] = useState(user.name || "");
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const activeSecDef = SECTIONS.find((s) => s.id === activeSection)!;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeSection === "akun") {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("photoUrl", photoUrl);
        await new Promise((r) => setTimeout(r, 1000));
        alert("Profil berhasil diperbarui!");
      } else if (activeSection === "keamanan") {
        if (newPassword !== confirmPassword) {
          alert("Kata sandi baru tidak cocok!");
          setLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
        alert("Kata sandi berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[260px_1fr]">
      
      {/* LEFT: Section sidebar navigation */}
      <aside className={`bg-transparent md:min-h-[400px] md:rounded-[var(--radius-lg)] md:border md:border-[var(--border)] md:bg-[var(--white)] md:p-3 ${mobileView === "FORM" ? "hidden md:block" : "block"}`}>
        <div className="md:sticky md:top-5">
          <div className="py-2">
            <div className="text-[0.5rem] font-black text-[var(--text-muted)] uppercase tracking-[0.12em] px-3 mb-1.5">
              Menu Pengaturan
            </div>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    id={`jamaah-profile-section-${sec.id}`}
                    type="button"
                    onClick={() => {
                      setActiveSection(sec.id);
                      setMobileView("FORM");
                    }}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-[var(--radius-md)] border cursor-pointer transition-all duration-200 text-left ${
                      isActive 
                        ? "border-transparent bg-[var(--ivory-dark)] text-[var(--charcoal)] shadow-[var(--shadow-sm)] md:shadow-none" 
                        : "mb-2 border-[var(--border)] bg-[var(--white)] text-[var(--text-muted)] shadow-[var(--shadow-sm)] hover:bg-[var(--ivory)] md:mb-0 md:border-transparent md:bg-transparent md:shadow-none"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-[var(--radius-sm)] shrink-0 flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? `${sec.accentClass} text-[var(--white)]` 
                        : `border border-[var(--border)] bg-[var(--white)] text-[var(--text-muted)]`
                    }`}>
                      {sec.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-[0.875rem] font-extrabold">{sec.label}</div>
                      <div className="text-[0.625rem] text-[var(--text-muted)] mt-[2px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {sec.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* RIGHT: Form content */}
      <div className={`min-h-[400px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--white)] p-5 shadow-[var(--shadow-sm)] md:p-9 ${mobileView === "MENU" ? "hidden md:block" : "block"}`}>
        <form onSubmit={handleSave}>
          
          {/* Section header */}
          <div className="mb-6 pb-5 border-b border-[var(--border)]">
            <button
              type="button"
              id="jamaah-profile-back-to-menu"
              className="mb-5 flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[0.875rem] font-extrabold text-[var(--charcoal)] md:hidden"
              onClick={() => setMobileView("MENU")}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--ivory-dark)] text-[var(--text-muted)]">
                <ChevronLeft size={18} strokeWidth={2.5} />
              </div>
              Menu Pengaturan
            </button>
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--white)] shadow-[var(--shadow-md)] ${activeSecDef.accentClass}`}> 
                {activeSecDef.icon}
              </div>
              <div>
                <div className={`mb-1 text-[0.5625rem] font-black uppercase tracking-[0.1em] ${activeSection === "akun" ? "text-[var(--emerald)]" : "text-[var(--gold)]"}`}>
                  Pengaturan Profil
                </div>
                <h2 className="font-black text-[1.1875rem] text-[var(--charcoal)] m-0 mb-1 leading-[1.25]">
                  {activeSecDef.label}
                </h2>
                <p className="text-[0.8125rem] text-[var(--text-muted)] m-0 leading-[1.65]">
                  {activeSecDef.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-5">
            {activeSection === "akun" && (
              <>
                <div>
                  <label className="block text-[0.75rem] font-extrabold text-[var(--charcoal)] mb-2">
                    Email (Tidak dapat diubah)
                  </label>
                  <input
                    id="jamaah-profile-email"
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--ivory-dark)] px-4 py-3 text-[0.875rem] text-[var(--text-muted)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] font-extrabold text-[var(--charcoal)] mb-2">
                    Nama Lengkap <span className="text-[var(--error)]">*</span>
                  </label>
                  <input
                    id="jamaah-profile-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--white)] px-4 py-3 text-[0.875rem] text-[var(--charcoal)] outline-none transition-colors focus:border-[var(--emerald)] focus:ring-1 focus:ring-[var(--emerald)]"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] font-extrabold text-[var(--charcoal)] mb-2">
                    URL Foto Profil
                  </label>
                  <input
                    id="jamaah-profile-photo-url"
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--white)] px-4 py-3 text-[0.875rem] text-[var(--charcoal)] outline-none transition-colors focus:border-[var(--emerald)] focus:ring-1 focus:ring-[var(--emerald)]"
                  />
                  {photoUrl && (
                    <div className="mt-4 flex items-center gap-4">
                      <img src={photoUrl} alt="Preview" className="h-16 w-16 rounded-full border-2 border-[var(--emerald)] object-cover" />
                      <span className="text-[0.75rem] text-[var(--text-muted)] font-semibold">Pratinjau Foto</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeSection === "keamanan" && (
              <>
                <div className="mb-2 flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--ivory)] p-4 text-[0.8125rem] text-[var(--gold)]">
                  <Lock size={20} />
                  Fitur ubah kata sandi ini akan segera hadir di pembaruan selanjutnya.
                </div>
                <div>
                  <label className="block text-[0.75rem] font-extrabold text-[var(--text-muted)] mb-2">
                    Kata Sandi Saat Ini
                  </label>
                  <input id="jamaah-profile-current-password" type="password" value={currentPassword} disabled className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--ivory-dark)] px-4 py-3 outline-none" />
                </div>
                <div>
                  <label className="block text-[0.75rem] font-extrabold text-[var(--text-muted)] mb-2">
                    Kata Sandi Baru
                  </label>
                  <input id="jamaah-profile-new-password" type="password" value={newPassword} disabled className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--ivory-dark)] px-4 py-3 outline-none" />
                </div>
              </>
            )}
          </div>
          
          <div className="mt-8 flex justify-end">
             <button
              type="submit"
              disabled={loading || (activeSection === "keamanan")}
              id="jamaah-profile-submit"
              className={`flex items-center gap-2 rounded-[var(--radius-md)] border-none px-6 py-3 text-[0.9375rem] font-extrabold transition-all duration-200 ${
                loading || activeSection === "keamanan" 
                  ? "cursor-not-allowed bg-[var(--text-muted)] text-[var(--white)]" 
                  : "cursor-pointer bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-light)] text-[var(--white)] shadow-[var(--shadow-emerald)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              }`}
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
