"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateMuthawifProfile } from "./actions";

type Profile = {
  bio: string | null;
  basePrice: number;
  location: string;
  experience: number;
  languages: string[];
  specializations: string[];
  verificationStatus: string;
};

const SPECIALIZATION_OPTIONS = [
  { value: "Haji", label: "🕋 Haji" },
  { value: "Umrah", label: "🕌 Umrah" },
  { value: "Ziarah", label: "🗺️ Ziarah" },
  { value: "Umrah Ramadan", label: "🌙 Umrah Ramadan" },
  { value: "Paket VIP", label: "⭐ Paket VIP" },
];

const LANGUAGE_OPTIONS = [
  "Indonesia",
  "Arab",
  "Inggris",
  "Malaysia",
  "Prancis",
  "Urdu",
];

const LOCATION_OPTIONS = [
  { value: "MAKKAH", label: "Makkah" },
  { value: "MADINAH", label: "Madinah" },
  { value: "BOTH", label: "Makkah & Madinah" },
];

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--charcoal)", letterSpacing: "0.01em" }}>{label}</label>
      {hint && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>{hint}</p>}
      {children}
    </div>
  );
}

export function ProfileForm({ profile, userName }: { profile: Profile | null; userName: string }) {
  const initialState = { success: false, message: "" };
  const [state, formAction, pending] = useActionState(updateMuthawifProfile, initialState);

  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(profile?.specializations || []);

  const isStepperMode = !profile || profile.verificationStatus === "PENDING" || profile.verificationStatus === "REVIEW";

  const initialPrice = profile?.basePrice || 500000;
  const [priceRaw, setPriceRaw] = useState<number>(initialPrice);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setPriceRaw(val ? parseInt(val, 10) : 0);
  };

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "3rem", padding: "1rem 0" }}>
      {state.message && (
        <div className={state.success ? "alert alert-success" : "alert alert-error"}>
          {state.message}
        </div>
      )}

      {/* === SECTION 1: Biografi & Personal Branding === */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", paddingBottom: "3rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ flex: "1 1 250px", maxWidth: "340px" }}>
          <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--charcoal)", margin: 0 }}>Personal Branding</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
            Ceritakan latar belakang Anda. Profil yang menarik akan meningkatkan peluang Jamaah memilih Anda sebagai pendamping ibadah.
          </p>
        </div>
        
        <div style={{ flex: "2 1 400px", background: "white", borderRadius: "12px", border: "1px solid var(--border)", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <FieldGroup label="Biografi Lengkap" hint="Deskripsikan pendekatan spiritual atau pengalaman unik Anda saat melayani jamaah.">
            <textarea
              name="bio"
              className="form-input"
              rows={4}
              placeholder="Assalamu'alaikum. Saya adalah muthawif berpengalaman yang telah tinggal di Makkah selama 10 tahun..."
              defaultValue={profile?.bio || ""}
              style={{ background: "transparent", resize: "none", padding: "0.875rem", lineHeight: "1.6" }}
            />
          </FieldGroup>
        </div>
      </div>

      {/* === SECTION 2: Wilayah & Harga === */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", paddingBottom: "3rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ flex: "1 1 250px", maxWidth: "340px" }}>
          <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--charcoal)", margin: 0 }}>Operasional & Tarif</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
            Tentukan kota operasional utama Anda, pengalaman kerja, serta tarif harian yang sesuai.
          </p>
        </div>

        <div style={{ flex: "2 1 400px", background: "white", borderRadius: "12px", border: "1px solid var(--border)", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
            <FieldGroup label="Wilayah Operasi">
              <select
                name="location"
                className="form-input form-select"
                defaultValue={profile?.location || "MAKKAH"}
                style={{ background: "transparent" }}
              >
                {LOCATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FieldGroup>

            <FieldGroup label="Pengalaman (Tahun)">
              <input
                name="experience"
                type="number"
                className="form-input"
                min={0} max={50}
                placeholder="5"
                defaultValue={profile?.experience || 0}
                style={{ background: "transparent" }}
              />
            </FieldGroup>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup label="Tarif Per Hari (IDR)">
                <div style={{ position: "relative", maxWidth: "300px" }}>
                  <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 700 }}>Rp</span>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: "2.75rem", background: "transparent" }}
                    placeholder="500.000"
                    value={priceRaw ? priceRaw.toLocaleString("id-ID") : ""}
                    onChange={handlePriceChange}
                    required
                  />
                  <input type="hidden" name="basePrice" value={priceRaw} />
                </div>
              </FieldGroup>
            </div>
          </div>
        </div>
      </div>

      {/* === SECTION 3: Spesialisasi === */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", paddingBottom: "2rem" }}>
        <div style={{ flex: "1 1 250px", maxWidth: "340px" }}>
          <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--charcoal)", margin: 0 }}>Spesialisasi & Bahasa</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.5rem", lineHeight: 1.6 }}>
            Pilih jenis layanan yang Anda kuasai beserta kemampuan bahasa asing untuk mempermudah komunikasi dengan Jamaah.
          </p>
        </div>

        <div style={{ flex: "2 1 400px", background: "white", borderRadius: "12px", border: "1px solid var(--border)", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <FieldGroup label="Layanan yang Dikuasai">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
              {SPECIALIZATION_OPTIONS.map((opt) => {
                const isSelected = selectedSpecs.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    style={{
                      padding: "0.625rem 1rem",
                      borderRadius: "8px",
                      border: `1px solid ${isSelected ? "var(--emerald)" : "var(--border)"}`,
                      background: isSelected ? "var(--emerald-pale)" : "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: isSelected ? "var(--emerald)" : "var(--charcoal)",
                      transition: "all 0.15s ease",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="spec_check"
                      value={opt.value}
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedSpecs([...selectedSpecs, opt.value]);
                        else setSelectedSpecs(selectedSpecs.filter((s) => s !== opt.value));
                      }}
                      style={{ display: "none" }}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
            <input type="hidden" name="specializations" value={selectedSpecs.join(",")} id="specializations-hidden" />
          </FieldGroup>

          <FieldGroup label="Bahasa yang Dikuasai" hint="Ketik secara manual dipisah dengan koma, atau klik tombol saran di bawah.">
            <input
              name="languages"
              type="text"
              className="form-input"
              placeholder="Contoh: Indonesia, Arab, Inggris"
              defaultValue={profile?.languages?.join(", ") || "Indonesia"}
              required
              style={{ background: "transparent" }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.375rem" }}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={(e) => {
                    const input = (e.currentTarget.closest("div")?.previousElementSibling) as HTMLInputElement;
                    if (!input) return;
                    const current = input.value.split(",").map((l) => l.trim()).filter(Boolean);
                    if (current.includes(lang)) {
                      input.value = current.filter((l) => l !== lang).join(", ");
                    } else {
                      input.value = [...current, lang].join(", ");
                    }
                  }}
                  style={{ padding: "0.25rem 0.75rem", borderRadius: "99px", border: "1px dashed var(--border)", background: "transparent", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600, color: "var(--text-muted)", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--emerald)"; e.currentTarget.style.color = "var(--emerald)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  + {lang}
                </button>
              ))}
            </div>
          </FieldGroup>
        </div>
      </div>

      {/* === Sticky Footer CTA === */}
      <div style={{ position: "sticky", bottom: "1rem", zIndex: 10, padding: "1rem 1.5rem", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", borderRadius: "16px", border: "1px solid rgba(27, 107, 74, 0.15)", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        {isStepperMode ? (
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--charcoal)", margin: 0 }}>Langkah 1 dari 3: Data Layanan</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.125rem 0 0 0" }}>Setelah simpan, Anda akan dapat mengunggah dokumen verifikasi.</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--charcoal)", margin: 0 }}>Profil Langsung Tayang</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.125rem 0 0 0" }}>Setiap pembaruan akan langsung dilihat oleh calon Jamaah.</p>
          </div>
        )}
        
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input type="hidden" name="submitActionRaw" id="submitActionRaw" value={isStepperMode ? "DRAFT" : "SAVE"} />
          
          {isStepperMode && (
            <button
              type="submit"
              onClick={() => { const el = document.getElementById("submitActionRaw") as HTMLInputElement; if (el) el.value = "DRAFT"; }}
              disabled={pending}
              className="btn btn-secondary"
              formNoValidate
              style={{ padding: "0.75rem 1.25rem", fontSize: "0.875rem" }}
            >
              {pending ? "Menyimpan..." : "Simpan Draft"}
            </button>
          )}

          <button
            type="submit"
            onClick={() => { const el = document.getElementById("submitActionRaw") as HTMLInputElement; if (el) el.value = isStepperMode ? "NEXT" : "SAVE"; }}
            disabled={pending}
            className="btn btn-primary"
            style={{ padding: "0.75rem 1.75rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            {pending ? (
              <><span className="spinner" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} /> Memproses...</>
            ) : isStepperMode ? (
              <>Simpan & Lanjut <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
            ) : (
              <>Simpan Perubahan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg></>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
