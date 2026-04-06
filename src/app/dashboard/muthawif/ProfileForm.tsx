"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { updateMuthawifProfile } from "./actions";
import { useUI } from "@/components/UIProvider";
import { MapPin, Briefcase, Languages, Check, ChevronRight } from "lucide-react";

/* ── Types ──────────────────────────────────────────────────── */
type Profile = {
  bio: string | null;
  basePrice: number;
  operatingAreas: string[];
  experience: number;
  languages: string[];
  specializations: string[];
  verificationStatus: string;
};

/* ── Tokens ─────────────────────────────────────────────────── */
const C = {
  emerald: "#1B6B4A",
  emeraldLight: "#27956A",
  emeraldPale: "#EBF5EF",
  gold: "#C4973B",
  goldPale: "rgba(196,151,59,0.1)",
  purple: "#7C3AED",
  purplePale: "#F5F3FF",
  blue: "#0284C7",
  bluePale: "#F0F9FF",
  charcoal: "#2C2C2C",
  muted: "#8A8A8A",
  border: "#E0D8CC",
  ivory: "#FAF7F2",
  ivoryDark: "#F0EBE1",
  white: "#FFFFFF",
  error: "#C0392B",
  errorBg: "#FEF2F2",
};

/* ── Section registry ───────────────────────────────────────── */
type SectionId = "bio" | "pricing" | "areas" | "services" | "languages";

interface SectionDef {
  id: SectionId;
  step: number;
  label: string;
  sublabel: string;
  desc: string;
  tip: string;
  accent: string;
  accentPale: string;
  icon: React.ReactNode;
  required: boolean;
}

const SECTIONS: SectionDef[] = [
  {
    id: "bio",
    step: 1,
    label: "Personal Branding",
    sublabel: "Bio & cerita Anda",
    desc: "Ceritakan latar belakang, pengalaman, dan keunikan pelayanan spiritual Anda. Profil yang kuat dan personal meningkatkan peluang dipilih oleh Jamaah.",
    tip: "Tulis minimal 80 karakter. Sertakan pengalaman ibadah, jumlah Jamaah yang pernah Anda dampingi, dan keunggulan Anda.",
    accent: C.emerald,
    accentPale: C.emeraldPale,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    required: true,
  },
  {
    id: "pricing",
    step: 2,
    label: "Tarif & Pengalaman",
    sublabel: "Harga & lama bertugas",
    desc: "Tentukan tarif harian dan jumlah tahun pengalaman mendampingi Jamaah. Tarif yang kompetitif meningkatkan visibilitas Anda di daftar pencarian.",
    tip: "Rerata tarif Muthawif aktif di platform ini adalah Rp 500.000–750.000/hari.",
    accent: C.gold,
    accentPale: C.goldPale,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    required: true,
  },
  {
    id: "areas",
    step: 3,
    label: "Wilayah Operasi",
    sublabel: "Kota layanan Anda",
    desc: "Pilih wilayah pelayanan Anda. Jamaah akan menyaring Muthawif berdasarkan wilayah yang tersedia sesuai paket perjalanan mereka.",
    tip: "Muthawif yang mencakup lebih dari satu wilayah memiliki peluang 2× lebih besar untuk dipesan.",
    accent: C.emerald,
    accentPale: C.emeraldPale,
    icon: <MapPin size={18} />,
    required: true,
  },
  {
    id: "services",
    step: 4,
    label: "Jenis Layanan",
    sublabel: "Tipe ibadah yang Anda layani",
    desc: "Pilih jenis layanan ibadah yang Anda sediakan. Semakin spesifik Anda, semakin tepat Jamaah yang akan memesan jasa Anda.",
    tip: "Anda bisa memilih lebih dari satu jenis layanan.",
    accent: C.purple,
    accentPale: C.purplePale,
    icon: <Briefcase size={18} />,
    required: false,
  },
  {
    id: "languages",
    step: 5,
    label: "Bahasa",
    sublabel: "Bahasa komunikasi Anda",
    desc: "Pilih bahasa yang Anda kuasai untuk berkomunikasi dengan Jamaah. Kemampuan multibahasa membuka peluang Jamaah dari berbagai negara.",
    tip: "Muthawif yang fasih berbahasa Arab dan Inggris sangat diminati oleh Jamaah internasional.",
    accent: C.blue,
    accentPale: C.bluePale,
    icon: <Languages size={18} />,
    required: true,
  },
];

/* ── Input style ────────────────────────────────────────────── */
const iStyle: React.CSSProperties = {
  width: "100%", padding: "0.875rem 1rem", borderRadius: 12,
  border: `1.5px solid ${C.border}`, fontSize: "0.9375rem",
  color: C.charcoal, background: C.ivory, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
};

/* ── Chips ──────────────────────────────────────────────────── */
function ChipSelect({
  options, selected, onChange, accent, accentPale, icon,
}: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
  accent: string; accentPale: string; icon?: React.ReactNode;
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.375rem",
              padding: "0.5625rem 1rem", borderRadius: 99,
              border: `1.5px solid ${on ? accent : C.border}`,
              background: on ? accentPale : C.white, color: on ? accent : C.charcoal,
              fontWeight: on ? 700 : 500, fontSize: "0.875rem", cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.15s",
              boxShadow: on ? `0 0 0 3px ${accentPale}` : "none",
            }}
            onMouseEnter={(e) => { if (!on) { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; } }}
            onMouseLeave={(e) => { if (!on) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.charcoal; } }}
          >
            {on
              ? <span style={{ width: 16, height: 16, borderRadius: "50%", background: accent, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={9} color={C.white} strokeWidth={3.5} /></span>
              : icon && <span style={{ opacity: 0.4, display: "inline-flex" }}>{icon}</span>}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SelectedTags({ items, onRemove, accent }: { items: string[]; onRemove: (v: string) => void; accent: string }) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", padding: "0.75rem", marginTop: "0.75rem", background: `${accent}0a`, borderRadius: 10, border: `1px solid ${accent}22` }}>
      <span style={{ fontSize: "0.5625rem", fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.1em", alignSelf: "center", marginRight: "0.125rem" }}>Dipilih:</span>
      {items.map((item) => (
        <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.625rem", borderRadius: 99, background: C.white, border: `1px solid ${accent}33`, fontSize: "0.75rem", fontWeight: 700, color: accent }}>
          {item}
          <button type="button" onClick={() => onRemove(item)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: accent, opacity: 0.6, display: "inline-flex", alignItems: "center" }}>✕</button>
        </span>
      ))}
    </div>
  );
}

/* ── Tip ────────────────────────────────────────────────────── */
function Tip({ text, accent }: { text: string; accent: string }) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 0.875rem", background: `${accent}09`, border: `1px solid ${accent}20`, borderRadius: 10, marginTop: "1rem" }}>
      <span style={{ flexShrink: 0, fontSize: "0.9375rem" }}>💡</span>
      <p style={{ fontSize: "0.75rem", color: C.muted, lineHeight: 1.65, margin: 0 }}>{text}</p>
    </div>
  );
}

/* ── Empty master data warning ──────────────────────────────── */
function MasterDataEmpty({ adminLabel }: { adminLabel: string }) {
  return (
    <div style={{ padding: "1.25rem 1.5rem", background: C.ivoryDark, borderRadius: 12, border: `1px dashed ${C.border}`, display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
      <span style={{ fontSize: "1.25rem", flexShrink: 0, marginTop: "0.1rem" }}>⚙️</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: C.charcoal, marginBottom: "0.25rem" }}>
          {adminLabel} belum dikonfigurasi
        </div>
        <p style={{ fontSize: "0.8125rem", color: C.muted, margin: 0, lineHeight: 1.6 }}>
          Admin perlu menambahkan pilihan di <strong>Master Data → {adminLabel}</strong> sebelum opsi ini tersedia.
        </p>
      </div>
    </div>
  );
}

/* ── Section completion check ───────────────────────────────── */
function sectionFilled(
  id: SectionId,
  { bio, priceRaw, selectedAreas, selectedSpecs, selectedLangs }: {
    bio: string; priceRaw: number;
    selectedAreas: string[]; selectedSpecs: string[]; selectedLangs: string[];
  }
): boolean {
  if (id === "bio") return bio.trim().length >= 20;
  if (id === "pricing") return priceRaw >= 100_000;
  if (id === "areas") return selectedAreas.length > 0;
  if (id === "services") return selectedSpecs.length > 0;
  if (id === "languages") return selectedLangs.length > 0;
  return false;
}

function isSectionValid(id: SectionId, filled: boolean): boolean {
  const sec = SECTIONS.find(s => s.id === id);
  if (!sec) return false;
  return !sec.required || filled;
}

/* ── Section nav item ── */
function NavItem({
  sec,
  activeSection,
  setActiveSection,
  completionMap,
}: {
  sec: SectionDef;
  activeSection: SectionId;
  setActiveSection: (id: SectionId) => void;
  completionMap: Record<SectionId, boolean>;
}) {
  const isActive = activeSection === sec.id;
  const filled = completionMap[sec.id];
  return (
    <button type="button" onClick={() => setActiveSection(sec.id)} style={{
      width: "100%", textAlign: "left", fontFamily: "inherit",
      background: isActive ? `linear-gradient(135deg, ${sec.accentPale}, ${C.white})` : "transparent",
      border: `1px solid ${isActive ? sec.accent + "44" : "transparent"}`,
      borderRadius: 12, padding: "0.875rem 1rem", cursor: "pointer",
      display: "flex", alignItems: "center", gap: "0.75rem",
      transition: "all 0.18s",
      boxShadow: isActive ? `0 2px 12px ${sec.accent}14` : "none",
    }}>
      {/* Icon container */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: filled ? sec.accent : isActive ? sec.accentPale : C.ivoryDark,
        color: filled ? C.white : sec.accent,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}>
        {filled ? <Check size={17} color={C.white} strokeWidth={2.5} /> : sec.icon}
      </div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: isActive ? 800 : 600, fontSize: "0.8125rem", color: isActive ? C.charcoal : C.muted, lineHeight: 1.25 }}>{sec.label}</div>
        <div style={{ fontSize: "0.625rem", color: C.muted, marginTop: "0.1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sec.sublabel}</div>
      </div>
      {/* Status / chevron */}
      <div style={{ flexShrink: 0 }}>
        {filled && !isActive
          ? <span style={{ fontSize: "0.5rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: 99, background: sec.accentPale, color: sec.accent, border: `1px solid ${sec.accent}33` }}>✓</span>
          : <ChevronRight size={14} color={isActive ? sec.accent : C.border} />}
      </div>
    </button>
  );
}

/* ── Content area ── */
function SectionContent({
  activeSection,
  bio, setBio,
  priceRaw, setPriceRaw,
  experience, setExperience,
  selectedAreas, setSelectedAreas,
  selectedSpecs, setSelectedSpecs,
  selectedLangs, setSelectedLangs,
  supportedLocations, supportedServices, supportedLanguages,
  activeSecDef,
}: {
  activeSection: SectionId;
  bio: string; setBio: (v: string) => void;
  priceRaw: number; setPriceRaw: (v: number) => void;
  experience: number; setExperience: (v: number) => void;
  selectedAreas: string[]; setSelectedAreas: (v: string[]) => void;
  selectedSpecs: string[]; setSelectedSpecs: (v: string[]) => void;
  selectedLangs: string[]; setSelectedLangs: (v: string[]) => void;
  supportedLocations: string[]; supportedServices: string[]; supportedLanguages: string[];
  activeSecDef: SectionDef;
}) {
  switch (activeSection) {

    /* 1 ─ Bio */
    case "bio":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.4rem" }}>
              Biografi Lengkap <span style={{ color: C.error }}>*</span>
              <span style={{ fontWeight: 400, color: C.muted, marginLeft: "0.375rem" }}>(min. 20 karakter)</span>
            </label>
            <div style={{ position: "relative" }}>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={7}
                placeholder="Assalamu'alaikum. Saya muthawif berpengalaman yang telah mendampingi ratusan Jamaah dari berbagai negara selama 10 tahun terakhir. Berdomisili di Makkah, saya fasih berbahasa Arab dan Indonesia..."
                style={{ ...iStyle, resize: "vertical", lineHeight: 1.7, minHeight: 140, paddingBottom: "2.5rem" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.emerald; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
              <div style={{ position: "absolute", bottom: "0.875rem", right: "1rem", fontSize: "0.625rem", fontWeight: 700, color: bio.length < 20 ? C.error : C.emerald }}>
                {bio.length} kar. {bio.length < 20 ? `(butuh ${20 - bio.length} lagi)` : "✓"}
              </div>
            </div>
          </div>
          {bio.length >= 20 && (
            <div style={{ padding: "0.875rem 1rem", background: C.emeraldPale, border: `1px solid ${C.emerald}33`, borderRadius: 12, display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <Check size={16} color={C.emerald} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: C.emerald }}>Biografi sudah diisi dengan baik.</span>
            </div>
          )}
          <Tip text={activeSecDef.tip} accent={activeSecDef.accent} />
        </div>
      );

    /* 2 ─ Pricing */
    case "pricing": {
      // Shared control height so both input and stepper are identical
      const CTRL_H = 52;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", alignItems: "start" }}>

            {/* Price */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.4rem" }}>
                Tarif Per Hari (IDR) <span style={{ color: C.error }}>*</span>
              </label>
              <div style={{ position: "relative", height: CTRL_H }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", fontWeight: 800, fontSize: "0.875rem", color: C.muted, pointerEvents: "none", zIndex: 1 }}>Rp</span>
                <input type="text"
                  style={{ ...iStyle, paddingLeft: "2.875rem", height: "100%", boxSizing: "border-box" }}
                  placeholder="500.000"
                  value={priceRaw ? priceRaw.toLocaleString("id-ID") : ""}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setPriceRaw(v ? parseInt(v, 10) : 0); }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
            </div>

            {/* Experience stepper */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.4rem" }}>Lama Pengalaman</label>
              <div style={{ display: "flex", alignItems: "stretch", border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.ivory, height: CTRL_H }}>
                <button type="button" onClick={() => setExperience(Math.max(0, experience - 1))}
                  style={{ width: 48, background: "none", border: "none", borderRight: `1px solid ${C.border}`, fontSize: "1.25rem", cursor: "pointer", color: C.muted, transition: "all 0.15s", flexShrink: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.ivoryDark; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
                  −
                </button>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontWeight: 900, fontSize: "1.375rem", color: C.charcoal, lineHeight: 1 }}>{experience}</span>
                  <span style={{ fontSize: "0.5rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.1rem" }}>Tahun</span>
                </div>
                <button type="button" onClick={() => setExperience(Math.min(50, experience + 1))}
                  style={{ width: 48, background: "none", border: "none", borderLeft: `1px solid ${C.border}`, fontSize: "1.25rem", cursor: "pointer", color: C.gold, fontWeight: 700, transition: "all 0.15s", flexShrink: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.goldPale; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
                  ＋
                </button>
              </div>
            </div>
          </div>

          {/* Estimasi di bawah grid agar tidak mempengaruhi tinggi */}
          {priceRaw > 0 && (
            <p style={{ fontSize: "0.75rem", color: C.muted, margin: 0 }}>
              Estimasi 2 minggu: <strong style={{ color: C.charcoal }}>Rp {(priceRaw * 14).toLocaleString("id-ID")}</strong>
            </p>
          )}
        </div>
      );
    }

    /* 3 ─ Areas */
    case "areas":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.625rem" }}>
              Pilih Wilayah <span style={{ color: C.error }}>*</span>
              <span style={{ fontWeight: 400, color: C.muted, marginLeft: "0.375rem" }}>(boleh lebih dari satu)</span>
            </label>
            {supportedLocations.length === 0
              ? <MasterDataEmpty adminLabel="Wilayah Operasi" />
              : (
                <>
                  <ChipSelect options={supportedLocations} selected={selectedAreas} onChange={setSelectedAreas} accent={C.emerald} accentPale={C.emeraldPale} icon={<MapPin size={12} />} />
                  <SelectedTags items={selectedAreas} onRemove={(v) => setSelectedAreas(selectedAreas.filter((a) => a !== v))} accent={C.emerald} />
                  {selectedAreas.length === 0 && (
                    <p style={{ fontSize: "0.75rem", color: C.error, marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>⚠</span> Pilih minimal satu wilayah operasi.
                    </p>
                  )}
                </>
              )}
          </div>
          <Tip text={activeSecDef.tip} accent={activeSecDef.accent} />
        </div>
      );

    /* 4 ─ Services */
    case "services":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.625rem" }}>
              Pilih Jenis Layanan
              <span style={{ fontWeight: 400, color: C.muted, marginLeft: "0.375rem" }}>(boleh lebih dari satu)</span>
            </label>
            {supportedServices.length === 0
              ? <MasterDataEmpty adminLabel="Jenis Layanan" />
              : (
                <>
                  <ChipSelect options={supportedServices} selected={selectedSpecs} onChange={setSelectedSpecs} accent={C.purple} accentPale={C.purplePale} icon={<Briefcase size={12} />} />
                  <SelectedTags items={selectedSpecs} onRemove={(v) => setSelectedSpecs(selectedSpecs.filter((s) => s !== v))} accent={C.purple} />
                </>
              )}
          </div>
          <Tip text={activeSecDef.tip} accent={activeSecDef.accent} />
        </div>
      );

    /* 5 ─ Languages */
    case "languages":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.625rem" }}>
              Pilih Bahasa <span style={{ color: C.error }}>*</span>
              <span style={{ fontWeight: 400, color: C.muted, marginLeft: "0.375rem" }}>(boleh lebih dari satu)</span>
            </label>
            {supportedLanguages.length === 0
              ? <MasterDataEmpty adminLabel="Bahasa" />
              : (
                <>
                  <ChipSelect options={supportedLanguages} selected={selectedLangs} onChange={setSelectedLangs} accent={C.blue} accentPale={C.bluePale} icon={<Languages size={12} />} />
                  <SelectedTags items={selectedLangs} onRemove={(v) => setSelectedLangs(selectedLangs.filter((l) => l !== v))} accent={C.blue} />
                  {selectedLangs.length === 0 && (
                    <p style={{ fontSize: "0.75rem", color: C.error, marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>⚠</span> Pilih minimal satu bahasa.
                    </p>
                  )}
                </>
              )}
          </div>
          <Tip text={activeSecDef.tip} accent={activeSecDef.accent} />
        </div>
      );
    default:
      return null;
  }
}

/* ══════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════ */
export function ProfileForm({
  profile, userName, supportedLocations, supportedServices, supportedLanguages,
}: {
  profile: Profile | null;
  userName: string;
  supportedLocations: string[];
  supportedServices: string[];
  supportedLanguages: string[];
}) {
  const initialState = { success: false, message: "" };
  const [state, formAction, pending] = useActionState(updateMuthawifProfile, initialState);
  const { toast } = useUI();

  useEffect(() => {
    if (state.message) {
      if (state.success) toast("success", "Berhasil", state.message);
      else toast("error", "Gagal", state.message);
    }
  }, [state, toast]);

  const isStepperMode = !profile || profile.verificationStatus === "PENDING" || profile.verificationStatus === "REVIEW";

  /* State */
  const [bio, setBio] = useState(profile?.bio || "");
  const [priceRaw, setPriceRaw] = useState<number>(profile?.basePrice || 0);
  const [experience, setExperience] = useState(profile?.experience || 0);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(profile?.operatingAreas || []);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(profile?.specializations || []);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(profile?.languages || []);
  const [activeSection, setActiveSection] = useState<SectionId>("bio");
  // Ref-based submit action: synchronously readable at form submission time
  const submitActionRef = useRef<"DRAFT" | "NEXT" | "SAVE">(isStepperMode ? "DRAFT" : "SAVE");
  // Hidden form input ref for direct DOM mutation (avoids React controlled-value delay)
  const submitInputRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const setSubmitAction = (val: "DRAFT" | "NEXT" | "SAVE") => {
    submitActionRef.current = val;
    if (submitInputRef.current) submitInputRef.current.value = val;
  };

  const formState = { bio, priceRaw, selectedAreas, selectedSpecs, selectedLangs };

  const completionMap: Record<SectionId, boolean> = {
    bio: sectionFilled("bio", formState),
    pricing: sectionFilled("pricing", formState),
    areas: sectionFilled("areas", formState),
    services: sectionFilled("services", formState),
    languages: sectionFilled("languages", formState),
  };

  const filledCount = Object.values(completionMap).filter(Boolean).length;
  const requiredSections = SECTIONS.filter((s) => s.required);
  const allRequiredFilled = requiredSections.every((s) => completionMap[s.id]);

  const activeSecDef = SECTIONS.find((s) => s.id === activeSection)!;

  return (
    <form action={formAction}>
      {/* Hidden fields */}
      <input type="hidden" name="operatingAreas" value={selectedAreas.join(",")} />
      <input type="hidden" name="specializations" value={selectedSpecs.join(",")} />
      <input type="hidden" name="languages" value={selectedLangs.join(",")} />
      <input type="hidden" name="bio" value={bio} />
      <input type="hidden" name="basePrice" value={priceRaw} />
      <input type="hidden" name="experience" value={experience} />
      <input type="hidden" name="submitActionRaw" ref={submitInputRef} defaultValue={isStepperMode ? "DRAFT" : "SAVE"} />

      {/* Real hidden submit button, used to programmatically trigger form action */}
      <button type="submit" ref={submitBtnRef} style={{ display: "none" }} aria-hidden />

      {/* ── Top hero banner ─────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, #0d2818 0%, ${C.emerald} 55%, ${C.emeraldLight} 100%)`,
        borderRadius: 20, padding: "1.75rem 2rem", marginBottom: "1.5rem",
        color: C.white, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -40, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ fontSize: "0.625rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: "0.375rem" }}>
              Selamat datang, {userName} 👋
            </div>
            <h3 style={{ fontWeight: 900, fontSize: "1.25rem", margin: "0 0 0.375rem", lineHeight: 1.25, color: C.white }}>
              Lengkapi Profil Layanan Anda
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.6, maxWidth: 520 }}>
              Profil yang lengkap meningkatkan kepercayaan Jamaah dan mempercepat proses verifikasi oleh tim AMIR Wif-Me.
            </p>
          </div>
          {/* Progress ring area */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexShrink: 0 }}>
            {/* Circular progress indicator */}
            <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                <circle cx="36" cy="36" r="30" fill="none" stroke="#34D399" strokeWidth="6"
                  strokeDasharray={`${(filledCount / SECTIONS.length) * 188.5} 188.5`}
                  strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s ease" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontWeight: 900, fontSize: "1.125rem", color: C.white, lineHeight: 1 }}>{filledCount}</span>
                <span style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: "0.05em" }}>/{SECTIONS.length}</span>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.875rem", color: C.white }}>
                {filledCount === SECTIONS.length ? "Semua bagian terisi! 🎉" : `${SECTIONS.length - filledCount} bagian tersisa`}
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: "0.1rem" }}>
                {Math.round((filledCount / SECTIONS.length) * 100)}% selesai
              </div>
              {/* dots */}
              <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.5rem" }}>
                {SECTIONS.map((s) => (
                  <button key={s.id} type="button" onClick={() => setActiveSection(s.id)}
                    style={{ width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0, background: completionMap[s.id] ? "#34D399" : activeSection === s.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", transition: "all 0.2s" }}
                    title={s.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main two-column layout ────────────────────────── */}
      <div className="pf-layout">

        {/* LEFT: Section sidebar navigation */}
        <aside className="pf-sidebar">
          <div style={{ position: "sticky", top: "1.25rem" }}>
            <div style={{ padding: "0.5rem 0" }}>
              <div style={{ fontSize: "0.5rem", fontWeight: 900, color: C.muted, textTransform: "uppercase", letterSpacing: "0.12em", padding: "0 0.75rem", marginBottom: "0.375rem" }}>
                Bagian Profil
              </div>
              <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {SECTIONS.map((sec) => (
                  <NavItem
                    key={sec.id}
                    sec={sec}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    completionMap={completionMap}
                  />
                ))}
              </nav>
            </div>

            {/* Sidebar stats */}
            <div style={{ margin: "1rem 0 0", padding: "1rem", background: C.ivoryDark, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "0.5625rem", fontWeight: 900, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.625rem" }}>Status Pengisian</div>
              {SECTIONS.map((s) => {
                const filled = completionMap[s.id];
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: filled ? C.emerald : C.border, flexShrink: 0, transition: "background 0.2s" }} />
                    <span style={{ fontSize: "0.6875rem", color: filled ? C.charcoal : C.muted, fontWeight: filled ? 600 : 400, flex: 1 }}>{s.label}</span>
                    {!s.required && <span style={{ fontSize: "0.5rem", color: C.muted, fontWeight: 600 }}>opsional</span>}
                  </div>
                );
              })}
              <div style={{ marginTop: "0.875rem", height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(filledCount / SECTIONS.length) * 100}%`, background: `linear-gradient(90deg, ${C.emerald}, #34D399)`, borderRadius: 2, transition: "width 0.4s ease" }} />
              </div>
              <div style={{ fontSize: "0.625rem", color: C.muted, marginTop: "0.375rem", textAlign: "right", fontWeight: 700 }}>{filledCount}/{SECTIONS.length} terisi</div>
            </div>
          </div>
        </aside>

        {/* RIGHT: Active section content */}
        <div className="pf-content">
          {/* Section header */}
          <div style={{
            marginBottom: "1.5rem", paddingBottom: "1.25rem",
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: `linear-gradient(135deg, ${activeSecDef.accentPale}, ${C.white})`,
                border: `1.5px solid ${activeSecDef.accent}33`,
                color: activeSecDef.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {activeSecDef.icon}
              </div>
              <div>
                <div style={{ fontSize: "0.5625rem", fontWeight: 900, color: activeSecDef.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>
                  Langkah {activeSecDef.step} dari {SECTIONS.length}
                  {!activeSecDef.required && <span style={{ marginLeft: "0.5rem", opacity: 0.7 }}>• Opsional</span>}
                </div>
                <h2 style={{ fontWeight: 900, fontSize: "1.1875rem", color: C.charcoal, margin: "0 0 0.25rem", lineHeight: 1.25 }}>
                  {activeSecDef.label}
                </h2>
                <p style={{ fontSize: "0.8125rem", color: C.muted, margin: 0, lineHeight: 1.65 }}>
                  {activeSecDef.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic content */}
          <SectionContent
            activeSection={activeSection}
            bio={bio} setBio={setBio}
            priceRaw={priceRaw} setPriceRaw={setPriceRaw}
            experience={experience} setExperience={setExperience}
            selectedAreas={selectedAreas} setSelectedAreas={setSelectedAreas}
            selectedSpecs={selectedSpecs} setSelectedSpecs={setSelectedSpecs}
            selectedLangs={selectedLangs} setSelectedLangs={setSelectedLangs}
            supportedLocations={supportedLocations}
            supportedServices={supportedServices}
            supportedLanguages={supportedLanguages}
            activeSecDef={activeSecDef}
          />
        </div>
      </div>

      {/* ── All-filled success banner ─────────────────────── */}
      {allRequiredFilled && (
        <div style={{
          margin: "1.25rem 0 0", padding: "1rem 1.25rem",
          background: "linear-gradient(135deg, #EBF5EF, #D1FAE5)",
          border: `1px solid ${C.emerald}33`, borderRadius: 14,
          display: "flex", alignItems: "center", gap: "0.875rem",
        }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.emerald, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Check size={18} color={C.white} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: C.emerald }}>
              {filledCount === SECTIONS.length ? "Semua bagian terisi! Profil Anda siap dikirim 🎉" : "Bagian wajib sudah terisi!"}
            </div>
            <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: "0.125rem" }}>
              {isStepperMode ? "Klik \"Simpan & Lanjut\" untuk meneruskan ke tahap unggah dokumen." : "Klik \"Simpan Perubahan\" untuk memperbarui profil aktif Anda."}
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky CTA bar ───────────────────────────────── */}
      <div style={{
        position: "sticky", bottom: "1rem", zIndex: 30, marginTop: "1.25rem",
        padding: "0.875rem 1.25rem",
        background: "rgba(250,247,242,0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 16,
        border: "1px solid rgba(27,107,74,0.1)",
        boxShadow: "0 -2px 24px rgba(0,0,0,0.06), 0 8px 32px rgba(27,107,74,0.06)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: "1rem", flexWrap: "wrap",
      }}>
        {/* Left: context label */}
        <div>
          {isStepperMode ? (
            <>
              <p style={{ fontWeight: 800, fontSize: "0.875rem", color: C.charcoal, margin: 0 }}>Info Layanan — Langkah 1/3</p>
              <p style={{ fontSize: "0.6875rem", color: C.muted, margin: "0.1rem 0 0" }}>
                {allRequiredFilled
                  ? "Semua field wajib sudah diisi ✓"
                  : `${SECTIONS.filter((s) => s.required && !completionMap[s.id]).map((s) => s.label).join(", ")} belum diisi`
                }
              </p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 800, fontSize: "0.875rem", color: C.charcoal, margin: 0 }}>Profil Aktif</p>
              <p style={{ fontSize: "0.6875rem", color: C.muted, margin: "0.1rem 0 0" }}>Perubahan langsung ditampilkan ke Jamaah</p>
            </>
          )}
        </div>

        {/* Right: buttons */}
        {(() => {
          const sectionOrder: SectionId[] = ["bio", "pricing", "areas", "services", "languages"];
          const currentIdx = sectionOrder.indexOf(activeSection);
          const nextSection = sectionOrder[currentIdx + 1] ?? null;
          const currentSectionFilled = completionMap[activeSection];
          const currentSectionValid = isSectionValid(activeSection, currentSectionFilled);

          // Navigation mode: current section valid AND there's a next section
          const sectionAdvanceMode =
            isStepperMode &&
            currentSectionValid &&
            nextSection !== null;

          const canSubmit = allRequiredFilled || !isStepperMode;
          // Disabled only if: current section not valid AND can't submit
          const isDisabled = pending || (!currentSectionValid && !canSubmit);

          const nextSectionLabel = nextSection ? SECTIONS.find((s) => s.id === nextSection)?.label : null;
          const ctaAccent = activeSecDef.accent;
          const buttonActive = !isDisabled;

          const handlePrimaryClick = () => {
             // If we are in stepper mode and there's a next section, we should ONLY allow advancing if we aren't on the final trigger.
             if (sectionAdvanceMode) {
                setActiveSection(nextSection);
                return;
             }
             // Submit mode
             setSubmitAction(isStepperMode ? "NEXT" : "SAVE");
             submitBtnRef.current?.click();
          };

          return (
            <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
              {isStepperMode && (
                <button type="submit"
                  onClick={() => setSubmitAction("DRAFT")}
                  disabled={pending} formNoValidate
                  style={{ padding: "0.75rem 1.125rem", borderRadius: 11, border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontWeight: 700, fontSize: "0.875rem", cursor: pending ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  Simpan Draft
                </button>
              )}

              <button
                type="button"
                onClick={handlePrimaryClick}
                disabled={isDisabled}
                style={{
                  padding: "0.75rem 1.625rem", borderRadius: 11, border: "none",
                  background: !buttonActive ? C.ivoryDark : sectionAdvanceMode
                    ? `linear-gradient(135deg, ${ctaAccent}, ${ctaAccent}cc)`
                    : `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
                  color: !buttonActive ? C.muted : C.white,
                  fontWeight: 800, fontSize: "0.9375rem",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.5rem",
                  boxShadow: buttonActive ? `0 4px 18px ${sectionAdvanceMode ? ctaAccent : C.emerald}33` : "none",
                  transition: "all 0.25s",
                }}>
                {pending ? (
                  <><span className="spinner" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: C.white }} /> Memproses...</>
                ) : sectionAdvanceMode ? (
                  <>{nextSectionLabel ?? "Lanjut"} <ChevronRight size={16} /></>
                ) : isStepperMode ? (
                  <>Simpan & Lanjut <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>
                ) : (
                  <>Simpan Perubahan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg></>
                )}
              </button>
            </div>
          );
        })()}
      </div>

      <style jsx>{`
        .pf-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 2rem;
          align-items: start;
        }
        .pf-sidebar {
          background: ${C.white};
          border-radius: 20px;
          border: 1px solid ${C.border};
          padding: 0.75rem;
          min-height: 480px;
        }
        .pf-content {
          background: ${C.white};
          border-radius: 24px;
          border: 1px solid ${C.border};
          padding: 2.25rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          min-height: 480px;
        }
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 860px) {
          .pf-layout {
            grid-template-columns: 1fr;
          }
          .pf-sidebar {
            min-height: auto;
          }
        }
      `}</style>
    </form>
  );
}
