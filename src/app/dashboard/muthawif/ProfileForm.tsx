"use client";

import { useActionState, useState, useEffect } from "react";
import { updateMuthawifProfile } from "./actions";
import { useUI } from "@/components/UIProvider";
import { MapPin, Briefcase, Languages, Check } from "lucide-react";

type Profile = {
  bio: string | null;
  basePrice: number;
  operatingAreas: string[];
  experience: number;
  languages: string[];
  specializations: string[];
  verificationStatus: string;
};

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label
        style={{
          fontSize: "0.8125rem",
          fontWeight: 700,
          color: "var(--charcoal)",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </label>
      {hint && (
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

// ─── Reusable multi-select chip grid ───────────────────────────────────────
function MultiSelectChips({
  options,
  selected,
  onChange,
  itemIcon,
  accentColor = "var(--emerald)",
  accentPale = "var(--emerald-pale)",
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  itemIcon?: React.ReactNode;
  accentColor?: string;
  accentPale?: string;
}) {
  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}
    >
      {options.map((opt) => {
        const isOn = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.5rem 0.875rem",
              borderRadius: 99,
              border: `1.5px solid ${isOn ? accentColor : "var(--border)"}`,
              background: isOn ? accentPale : "white",
              color: isOn ? accentColor : "var(--charcoal)",
              fontSize: "0.8125rem",
              fontWeight: isOn ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "inherit",
              boxShadow: isOn ? `0 0 0 3px ${accentPale}` : "none",
            }}
            onMouseEnter={(e) => {
              if (!isOn) {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.color = accentColor;
              }
            }}
            onMouseLeave={(e) => {
              if (!isOn) {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--charcoal)";
              }
            }}
          >
            {isOn ? (
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: accentColor,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Check size={10} color="white" strokeWidth={3} />
              </span>
            ) : (
              itemIcon && (
                <span style={{ opacity: 0.5, display: "inline-flex" }}>
                  {itemIcon}
                </span>
              )
            )}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Selection summary badge strip ─────────────────────────────────────────
function SelectedBadges({
  items,
  onRemove,
  color = "var(--emerald)",
  pale = "var(--emerald-pale)",
}: {
  items: string[];
  onRemove: (val: string) => void;
  color?: string;
  pale?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.375rem",
        marginTop: "0.75rem",
        padding: "0.75rem",
        background: pale,
        borderRadius: 10,
        border: `1px solid ${color}22`,
      }}
    >
      <span
        style={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          color,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          alignSelf: "center",
          marginRight: "0.25rem",
          whiteSpace: "nowrap",
        }}
      >
        Dipilih:
      </span>
      {items.map((item) => (
        <span
          key={item}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.25rem 0.625rem",
            borderRadius: 99,
            background: "white",
            border: `1px solid ${color}44`,
            fontSize: "0.75rem",
            fontWeight: 700,
            color,
          }}
        >
          {item}
          <button
            type="button"
            onClick={() => onRemove(item)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              color,
              opacity: 0.6,
              marginLeft: "0.125rem",
            }}
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────
function FormSection({
  title,
  desc,
  icon,
  children,
  last = false,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "2rem",
        paddingBottom: last ? 0 : "2.5rem",
        borderBottom: last ? "none" : "1px solid var(--border)",
      }}
    >
      {/* Left: description column */}
      <div style={{ flex: "1 1 220px", maxWidth: 300 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            marginBottom: "0.625rem",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--emerald-pale)",
              color: "var(--emerald)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: "var(--charcoal)",
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {desc}
        </p>
      </div>

      {/* Right: inputs */}
      <div
        style={{
          flex: "2 1 340px",
          background: "white",
          borderRadius: 16,
          border: "1px solid var(--border)",
          padding: "1.5rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ProfileForm({
  profile,
  userName,
  supportedLocations,
  supportedServices,
  supportedLanguages,
}: {
  profile: Profile | null;
  userName: string;
  supportedLocations: string[];
  supportedServices: string[];
  supportedLanguages: string[];
}) {
  const initialState = { success: false, message: "" };
  const [state, formAction, pending] = useActionState(
    updateMuthawifProfile,
    initialState
  );

  const { toast } = useUI();

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast("success", "Berhasil", state.message);
      } else {
        toast("error", "Gagal", state.message);
      }
    }
  }, [state, toast]);

  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    profile?.operatingAreas?.length ? profile.operatingAreas : []
  );
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(
    profile?.specializations?.length ? profile.specializations : []
  );
  const [selectedLangs, setSelectedLangs] = useState<string[]>(
    profile?.languages?.length ? profile.languages : []
  );

  const isStepperMode =
    !profile ||
    profile.verificationStatus === "PENDING" ||
    profile.verificationStatus === "REVIEW";

  const [priceRaw, setPriceRaw] = useState<number>(
    profile?.basePrice || 500000
  );

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setPriceRaw(val ? parseInt(val, 10) : 0);
  };

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}
    >
      {/* SECTION 1: Biografi === */}
      <FormSection
        title="Personal Branding"
        desc="Ceritakan latar belakang dan pendekatan spiritual Anda. Profil yang menarik meningkatkan peluang dipilih Jamaah."
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        }
      >
        <FieldGroup
          label="Biografi Lengkap"
          hint="Deskripsikan pengalaman dan keunikan pelayanan Anda."
        >
          <textarea
            name="bio"
            className="form-input"
            rows={4}
            placeholder="Assalamu'alaikum. Saya muthawif berpengalaman yang tinggal di Makkah selama 10 tahun..."
            defaultValue={profile?.bio || ""}
            style={{ background: "transparent", resize: "none", padding: "0.875rem", lineHeight: "1.6" }}
          />
        </FieldGroup>
      </FormSection>

      {/* === SECTION 2: Tarif & Pengalaman === */}
      <FormSection
        title="Tarif & Pengalaman"
        desc="Tentukan tarif harian dan jumlah tahun pengalaman mendampingi jamaah ibadah."
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem" }}>
          <FieldGroup label="Tarif Per Hari (IDR)">
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 700 }}>
                Rp
              </span>
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
          <FieldGroup label="Pengalaman (Tahun)">
            <input
              name="experience"
              type="number"
              className="form-input"
              min={0}
              max={50}
              placeholder="5"
              defaultValue={profile?.experience || 0}
              style={{ background: "transparent" }}
            />
          </FieldGroup>
        </div>
      </FormSection>

      {/* === SECTION 3: Wilayah Operasi === */}
      <FormSection
        title="Wilayah Operasi"
        desc="Pilih satu atau lebih wilayah pelayanan yang Anda cover. Ini akan mempengaruhi hasil pencarian Jamaah."
        icon={<MapPin size={18} />}
      >
        <FieldGroup
          label="Pilih Wilayah"
          hint="Anda dapat memilih lebih dari satu wilayah."
        >
          {supportedLocations.length === 0 ? (
            <div style={{ padding: "1rem", background: "var(--ivory)", borderRadius: 10, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Belum ada wilayah yang dikonfigurasi oleh Admin.
            </div>
          ) : (
            <>
              <MultiSelectChips
                options={supportedLocations}
                selected={selectedAreas}
                onChange={setSelectedAreas}
                itemIcon={<MapPin size={12} />}
              />
              <SelectedBadges
                items={selectedAreas}
                onRemove={(v) => setSelectedAreas(selectedAreas.filter((a) => a !== v))}
              />
              {selectedAreas.length === 0 && (
                <p style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "0.5rem" }}>
                  ⚠ Pilih minimal satu wilayah operasi.
                </p>
              )}
            </>
          )}
          <input
            type="hidden"
            name="operatingAreas"
            value={selectedAreas.join(",")}
          />
        </FieldGroup>
      </FormSection>

      {/* === SECTION 4: Jenis Layanan === */}
      <FormSection
        title="Jenis Layanan"
        desc="Pilih jenis layanan yang Anda sediakan. Ini membantu Jamaah menemukan Muthawif yang sesuai kebutuhan mereka."
        icon={<Briefcase size={18} />}
      >
        <FieldGroup
          label="Pilih Layanan"
          hint="Anda dapat memilih lebih dari satu layanan."
        >
          {supportedServices.length === 0 ? (
            <div style={{ padding: "1rem", background: "var(--ivory)", borderRadius: 10, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Belum ada layanan yang dikonfigurasi oleh Admin.
            </div>
          ) : (
            <>
              <MultiSelectChips
                options={supportedServices}
                selected={selectedSpecs}
                onChange={setSelectedSpecs}
                itemIcon={<Briefcase size={12} />}
                accentColor="#7C3AED"
                accentPale="#F5F3FF"
              />
              <SelectedBadges
                items={selectedSpecs}
                onRemove={(v) => setSelectedSpecs(selectedSpecs.filter((s) => s !== v))}
                color="#7C3AED"
                pale="#F5F3FF"
              />
            </>
          )}
          <input
            type="hidden"
            name="specializations"
            value={selectedSpecs.join(",")}
          />
        </FieldGroup>
      </FormSection>

      {/* === SECTION 5: Bahasa === */}
      <FormSection
        title="Spesialisasi Bahasa"
        desc="Pilih bahasa yang Anda kuasai untuk berkomunikasi dengan Jamaah dari berbagai negara."
        icon={<Languages size={18} />}
        last
      >
        <FieldGroup
          label="Pilih Bahasa"
          hint="Anda dapat memilih lebih dari satu bahasa."
        >
          {supportedLanguages.length === 0 ? (
            <div style={{ padding: "1rem", background: "var(--ivory)", borderRadius: 10, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Belum ada bahasa yang dikonfigurasi oleh Admin.
            </div>
          ) : (
            <>
              <MultiSelectChips
                options={supportedLanguages}
                selected={selectedLangs}
                onChange={setSelectedLangs}
                itemIcon={<Languages size={12} />}
                accentColor="#0284C7"
                accentPale="#F0F9FF"
              />
              <SelectedBadges
                items={selectedLangs}
                onRemove={(v) => setSelectedLangs(selectedLangs.filter((l) => l !== v))}
                color="#0284C7"
                pale="#F0F9FF"
              />
              {selectedLangs.length === 0 && (
                <p style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "0.5rem" }}>
                  ⚠ Pilih minimal satu bahasa.
                </p>
              )}
            </>
          )}
          <input
            type="hidden"
            name="languages"
            value={selectedLangs.join(",")}
          />
        </FieldGroup>
      </FormSection>

      {/* === Sticky Footer CTA === */}
      <div
        style={{
          position: "sticky",
          bottom: "1rem",
          zIndex: 10,
          padding: "1rem 1.5rem",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          borderRadius: "16px",
          border: "1px solid rgba(27,107,74,0.15)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        {isStepperMode ? (
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--charcoal)", margin: 0 }}>
              Langkah 1 dari 3: Data Layanan
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.125rem 0 0 0" }}>
              Setelah simpan, Anda dapat mengunggah dokumen verifikasi.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--charcoal)", margin: 0 }}>
              Profil Langsung Tayang
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.125rem 0 0 0" }}>
              Setiap pembaruan langsung dilihat oleh calon Jamaah.
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input
            type="hidden"
            name="submitActionRaw"
            id="submitActionRaw"
            value={isStepperMode ? "DRAFT" : "SAVE"}
          />

          {isStepperMode && (
            <button
              type="submit"
              onClick={() => {
                const el = document.getElementById("submitActionRaw") as HTMLInputElement;
                if (el) el.value = "DRAFT";
              }}
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
            onClick={() => {
              const el = document.getElementById("submitActionRaw") as HTMLInputElement;
              if (el) el.value = isStepperMode ? "NEXT" : "SAVE";
            }}
            disabled={pending}
            className="btn btn-primary"
            style={{ padding: "0.75rem 1.75rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            {pending ? (
              <><span className="spinner" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} /> Memproses...</>
            ) : isStepperMode ? (
              <>Simpan &amp; Lanjut <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
            ) : (
              <>Simpan Perubahan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg></>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          form { gap: 2rem !important; }
        }
      `}</style>
    </form>
  );
}
