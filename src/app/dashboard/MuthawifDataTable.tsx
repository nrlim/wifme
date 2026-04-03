"use client";

import React, { useState, useTransition, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { approveMuthawif, rejectMuthawif, suspendMuthawif, activateMuthawif } from "./actions";

type Muthawif = any;
type Counts = { total: number; REVIEW: number; VERIFIED: number; PENDING: number; REJECTED: number };

const STATUS_META: Record<string, { label: string; bg: string; color: string; dot?: boolean }> = {
  PENDING:  { label: "Belum Lengkap",    bg: "#F3F4F6",             color: "#6B7280" },
  REVIEW:   { label: "Menunggu Review",  bg: "#FEF9C3",             color: "#A16207", dot: true },
  VERIFIED: { label: "Aktif",            bg: "rgba(27,107,74,0.1)", color: "var(--emerald)" },
  REJECTED: { label: "Ditolak",          bg: "#FEF2F2",             color: "var(--error)" },
};

export function MuthawifDataTable({
  muthawifs, total, page, totalPages, currentSearch, currentStatus, counts,
}: {
  muthawifs:     Muthawif[];
  total:         number;
  page:          number;
  totalPages:    number;
  currentSearch: string;
  currentStatus: string;
  counts:        Counts;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const qs       = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const navigate = (params: Record<string, string>) => {
    const next = new URLSearchParams(qs.toString());
    for (const [k, v] of Object.entries(params)) {
      if (!v || v === "ALL") next.delete(k); else next.set(k, v);
    }
    if ("q" in params || "status" in params) next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ q: searchRef.current?.value ?? "" });
  };

  const pageStart = total === 0 ? 0 : (page - 1) * 10 + 1;
  const pageEnd   = Math.min(page * 10, total);

  const FILTERS = [
    { value: "ALL",      label: "Semua",          count: counts.total },
    { value: "REVIEW",   label: "Perlu Review",   count: counts.REVIEW,   urgent: counts.REVIEW > 0 },
    { value: "VERIFIED", label: "Aktif",          count: counts.VERIFIED },
    { value: "PENDING",  label: "Belum Lengkap",  count: counts.PENDING },
    { value: "REJECTED", label: "Ditolak",        count: counts.REJECTED },
  ];

  const isActive = (v: string) => currentStatus === v || (!currentStatus && v === "ALL") || (currentStatus === "" && v === "ALL");

  return (
    <div style={{ background: "white", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>

      {/* ── Integrated Header ── */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>

        {/* Top row: title + search */}
        <div style={{ padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.25rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: counts.REVIEW > 0 ? "var(--error)" : "var(--emerald)" }} />
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--charcoal)" }}>
              Daftar Muthawif
            </span>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              {total === 0 ? "Tidak ada hasil" : `${pageStart}–${pageEnd} dari ${total}`}
            </span>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: 1, maxWidth: 340 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <svg style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={searchRef}
                defaultValue={currentSearch}
                placeholder="Cari nama atau email…"
                style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2.125rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.875rem", fontFamily: "inherit", background: "var(--ivory)", color: "var(--charcoal)", outline: "none" }}
                onFocus={e => (e.target.style.borderColor = "var(--emerald)")}
                onBlur={e =>  (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <button type="submit" style={{ padding: "0.5rem 1rem", borderRadius: "8px", background: "var(--emerald)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.8125rem", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              Cari
            </button>
          </form>
        </div>

        {/* Bottom row: status tabs */}
        <div style={{ padding: "0 1.5rem", display: "flex", gap: 0, overflowX: "auto" }}>
          {FILTERS.map(f => {
            const active = isActive(f.value);
            return (
              <button
                key={f.value}
                onClick={() => navigate({ status: f.value })}
                style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  padding: "0.75rem 1rem", background: "none", border: "none",
                  borderBottom: `2px solid ${active ? "var(--emerald)" : "transparent"}`,
                  color: active ? "var(--emerald)" : "var(--text-muted)",
                  cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 700 : 500,
                  fontSize: "0.8125rem", whiteSpace: "nowrap", transition: "all 0.15s",
                }}
                onMouseEnter={e => !active && (e.currentTarget.style.color = "var(--charcoal)")}
                onMouseLeave={e => !active && (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {f.label}
                {f.urgent && f.count > 0 && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--error)", display: "inline-block", flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ opacity: isPending ? 0.55 : 1, transition: "opacity 0.2s" }}>
        {muthawifs.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--ivory-dark)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div style={{ fontWeight: 700, color: "var(--charcoal)", marginBottom: "0.375rem" }}>Tidak ada hasil</div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Coba ubah kata kunci atau pilih filter yang berbeda.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--ivory)", borderBottom: "1px solid var(--border)" }}>
                  {[
                    { label: "Profil Muthawif", w: "auto" },
                    { label: "Lokasi", w: 140 },
                    { label: "Mendaftar", w: 130 },
                    { label: "Status", w: 160 },
                    { label: "Aksi", w: 90, right: true },
                  ].map(h => (
                    <th key={h.label} style={{ padding: "0.75rem 1.25rem", fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", width: h.w, textAlign: h.right ? "right" : "left" }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {muthawifs.map((profile) => {
                  const isExp = expandedId === profile.id;
                  const sm = STATUS_META[profile.verificationStatus] || STATUS_META.PENDING;
                  const getDocUrl = (p: string) => profile.documentsUrl.find((d: string) => d.startsWith(`${p}::`))?.split("::")[1] || "#";

                  return (
                    <React.Fragment key={profile.id}>
                      {/* Main row */}
                      <tr
                        onClick={() => setExpandedId(isExp ? null : profile.id)}
                        style={{ borderBottom: isExp ? "none" : "1px solid var(--border)", cursor: "pointer", background: isExp ? "var(--ivory)" : "transparent", transition: "background 0.12s" }}
                        onMouseEnter={e => !isExp && (e.currentTarget.style.background = "var(--ivory)")}
                        onMouseLeave={e => !isExp && (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Identity */}
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--emerald-pale)", color: "var(--emerald)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, overflow: "hidden", border: "1px solid var(--border)" }}>
                              {profile.user.photoUrl ? <img src={profile.user.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : profile.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: "var(--charcoal)", fontSize: "0.9375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.user.name}</div>
                              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "1rem 1.25rem", fontSize: "0.875rem", color: "var(--charcoal)", fontWeight: 500 }}>
                          {profile.location === "BOTH" ? "Makkah & Madinah" : profile.location || "–"}
                        </td>
                        <td style={{ padding: "1rem 1.25rem", fontSize: "0.8125rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {new Date(profile.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {sm.dot && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--error)", flexShrink: 0 }} />}
                            <span style={{ background: sm.bg, color: sm.color, padding: "0.3rem 0.75rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}>{sm.label}</span>
                          </div>
                        </td>
                        <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                          <button style={{ padding: "0.375rem 0.75rem", borderRadius: "7px", border: `1px solid ${isExp ? "transparent" : "var(--border)"}`, background: isExp ? "var(--emerald-pale)" : "white", color: isExp ? "var(--emerald)" : "var(--charcoal)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                            {isExp ? "Tutup" : "Detail"}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded panel */}
                      {isExp && (
                        <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--ivory)" }}>
                          <td colSpan={5} style={{ padding: "0 1.25rem 1.25rem" }}>
                            <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "14px", padding: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2rem" }} onClick={e => e.stopPropagation()}>
                              
                              {/* Profile meta */}
                              <div>
                                <div style={{ fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Metadata Profil</div>
                                <table style={{ width: "100%", fontSize: "0.875rem" }}><tbody>
                                  {[
                                    ["Pengalaman", `${profile.experience} Tahun`],
                                    ["Tarif Dasar", `Rp ${profile.basePrice?.toLocaleString("id-ID") || 0}`],
                                    ["Bahasa", profile.languages?.join(", ") || "–"],
                                    ["Spesialisasi", profile.specializations?.join(", ") || "–"],
                                  ].map(([k, v]) => (
                                    <tr key={k}>
                                      <td style={{ padding: "0.5rem 0", color: "var(--text-muted)", width: 110, verticalAlign: "top" }}>{k}</td>
                                      <td style={{ padding: "0.5rem 0", fontWeight: 600, color: "var(--charcoal)" }}>{v}</td>
                                    </tr>
                                  ))}
                                </tbody></table>
                              </div>

                              {/* Documents */}
                              <div>
                                <div style={{ fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Dokumen Arsip</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                  {[["ktp", "KTP Asli"], ["selfie", "Foto Selfie"], ["sertifikasi", "Sertifikasi"]].map(([prefix, label]) => (
                                    <a key={prefix} href={getDocUrl(prefix)} target="_blank" rel="noreferrer" className="doc-hover-link"
                                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", border: "1px solid var(--border)", borderRadius: "10px", textDecoration: "none", color: "var(--charcoal)", fontSize: "0.875rem", background: "var(--ivory)", transition: "all 0.15s" }}>
                                      <b style={{ fontWeight: 700 }}>{label}</b>
                                      <span style={{ color: "var(--emerald)", fontWeight: 700, fontSize: "0.8125rem" }}>Buka ↗</span>
                                    </a>
                                  ))}
                                </div>
                              </div>

                              {/* Admin actions */}
                              <div style={{ borderLeft: "1px dashed var(--border)", paddingLeft: "1.75rem" }}>
                                <div style={{ fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Tindakan AMIR</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                                  {profile.verificationStatus === "REVIEW" && (<>
                                    <form action={async () => { await approveMuthawif(profile.id); }}>
                                      <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}>✓ Setujui & Verifikasi</button>
                                    </form>
                                    <form action={async () => { await rejectMuthawif(profile.id); }}>
                                      <button type="submit" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", color: "var(--error)", borderColor: "#FCA5A5", padding: "0.75rem" }}>✕ Tolak Pendaftaran</button>
                                    </form>
                                  </>)}
                                  {profile.verificationStatus === "VERIFIED" && (
                                    <form action={async () => { await suspendMuthawif(profile.id); }}>
                                      <button type="submit" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", color: "var(--error)", borderColor: "#FCA5A5", padding: "0.75rem" }}>Cabut Akses (Suspend)</button>
                                    </form>
                                  )}
                                  {profile.verificationStatus === "REJECTED" && (
                                    <form action={async () => { await activateMuthawif(profile.id); }}>
                                      <button type="submit" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", color: "var(--emerald)", borderColor: "var(--emerald)", padding: "0.75rem" }}>Aktifkan Kembali</button>
                                    </form>
                                  )}
                                  {profile.verificationStatus === "PENDING" && (
                                    <div style={{ background: "var(--ivory-dark)", padding: "0.875rem 1rem", borderRadius: "10px", fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600, textAlign: "center" }}>
                                      Pendaftar sedang mengisi berkas — menunggu ajuan REVIEW.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ padding: "0.875rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Halaman <strong style={{ color: "var(--charcoal)" }}>{page}</strong> dari <strong style={{ color: "var(--charcoal)" }}>{totalPages}</strong>
            </span>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <button
                disabled={page <= 1 || isPending}
                onClick={() => navigate({ page: String(page - 1) })}
                style={{ padding: "0.4375rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: page <= 1 ? "var(--ivory)" : "white", color: page <= 1 ? "var(--text-muted)" : "var(--charcoal)", cursor: page <= 1 ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.8125rem", fontFamily: "inherit" }}
              >
                ←
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button key={p} onClick={() => navigate({ page: String(p) })}
                    style={{ padding: "0.4375rem 0.75rem", minWidth: 36, borderRadius: "8px", border: `1px solid ${p === page ? "var(--emerald)" : "var(--border)"}`, background: p === page ? "var(--emerald)" : "white", color: p === page ? "white" : "var(--charcoal)", cursor: "pointer", fontWeight: 700, fontSize: "0.8125rem", fontFamily: "inherit" }}>
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages || isPending}
                onClick={() => navigate({ page: String(page + 1) })}
                style={{ padding: "0.4375rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: page >= totalPages ? "var(--ivory)" : "white", color: page >= totalPages ? "var(--text-muted)" : "var(--charcoal)", cursor: page >= totalPages ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.8125rem", fontFamily: "inherit" }}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
