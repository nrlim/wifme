"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/UIProvider";
import type { Prisma } from "@prisma/client";
import { ClipboardList, Plus, X, Layers, Trash2, Edit2, MapPin, Clock, Package, GripVertical, Save } from "lucide-react";
import { Reorder } from "framer-motion";
import Link from "next/link";

type Activity = Prisma.ActivityGetPayload<{}>;
type BundleType = Prisma.ActivityBundleGetPayload<{ include: { items: { include: { activity: true } } } }>;

interface Props {
  initialActivities: Activity[];
  initialBundles?: BundleType[];
}

export default function ActivityManagement({ initialActivities, initialBundles }: Props) {
  const router = useRouter();
  const { toast, confirm } = useUI();
  
  const [activeTab, setActiveTab] = useState<"satuan" | "paket">("satuan");
  
  // -- STATE UNTUK KEGIATAN SATUAN --
  const [activities, setActivities] = useState<Activity[]>(() => [...initialActivities].sort((a, b) => a.sortOrder - b.sortOrder));
  const [showActModal, setShowActModal] = useState(false);
  const [actEditingId, setActEditingId] = useState<string | null>(null);
  const [isSavingAct, setIsSavingAct] = useState(false);
  const [actName, setActName] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [actPrice, setActPrice] = useState("");
  const [actLocation, setActLocation] = useState("");
  const [actDuration, setActDuration] = useState("");
  const [actIsActive, setActIsActive] = useState(true);
  const [isReorderingAct, setIsReorderingAct] = useState(false);
  const [hasReorderedAct, setHasReorderedAct] = useState(false);

  // -- STATE UNTUK PAKET BUNDLING --
  const safeInitialBundles = initialBundles || [];
  const [bundles, setBundles] = useState<BundleType[]>([...safeInitialBundles].sort((a, b) => a.sortOrder - b.sortOrder));
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [bundleEditingId, setBundleEditingId] = useState<string | null>(null);
  const [isSavingBundle, setIsSavingBundle] = useState(false);

  useEffect(() => {
    setActivities([...initialActivities].sort((a, b) => a.sortOrder - b.sortOrder));
  }, [initialActivities]);

  useEffect(() => {
    if (initialBundles) {
      setBundles([...initialBundles].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  }, [initialBundles]);

  const [bundleName, setBundleName] = useState("");
  const [bundleDesc, setBundleDesc] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [bundleIsActive, setBundleIsActive] = useState(true);
  const [bundleActivityIds, setBundleActivityIds] = useState<string[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [hasReordered, setHasReordered] = useState(false);

  // Pagination for Activities
  const [currentActPage, setCurrentActPage] = useState(1);
  const ACT_PAGE_SIZE = 10;
  const totalActItems = activities.length;
  const totalActPages = Math.max(1, Math.ceil(totalActItems / ACT_PAGE_SIZE));
  const safeActPage = Math.min(Math.max(1, currentActPage), totalActPages);
  const paginatedActivities = activities.slice((safeActPage - 1) * ACT_PAGE_SIZE, safeActPage * ACT_PAGE_SIZE);

  // Pagination for Bundles
  const [currentBundlePage, setCurrentBundlePage] = useState(1);
  const BUNDLE_PAGE_SIZE = 10;
  const totalBundleItems = bundles.length;
  const totalBundlePages = Math.max(1, Math.ceil(totalBundleItems / BUNDLE_PAGE_SIZE));
  const safeBundlePage = Math.min(Math.max(1, currentBundlePage), totalBundlePages);
  const paginatedBundles = bundles.slice((safeBundlePage - 1) * BUNDLE_PAGE_SIZE, safeBundlePage * BUNDLE_PAGE_SIZE);

  // == HANDLERS UNTUK KEGIATAN ==
  const resetActForm = () => {
    setActName(""); setActDesc(""); setActPrice(""); setActLocation(""); setActDuration("");
    setActIsActive(true); setActEditingId(null);
  };

  const handleEditAct = (act: Activity) => {
    setActName(act.name); setActDesc(act.description || ""); setActPrice(act.price.toString());
    setActLocation(act.location || ""); setActDuration(act.duration || "");
    setActIsActive(act.isActive);
    setActEditingId(act.id); setShowActModal(true);
  };

  const handleSaveAct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAct(true);
    const payload = {
      name: actName, description: actDesc, price: Number(actPrice),
      location: actLocation, duration: actDuration, isActive: actIsActive
    };
    try {
      const url = actEditingId ? `/api/activities/${actEditingId}` : `/api/activities`;
      const res = await fetch(url, { method: actEditingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Gagal menyimpan data");
      const data = await res.json();
      let newActs = [...activities];
      if (actEditingId) newActs = newActs.map(a => a.id === actEditingId ? data.activity : a);
      else newActs.push(data.activity);
      setActivities(newActs.sort((a, b) => a.sortOrder - b.sortOrder));
      resetActForm(); setShowActModal(false); router.refresh();
      toast("success", "Berhasil", "Kegiatan disimpan.");
    } catch (err) {
      toast("error", "Error", "Gagal menyimpan kegiatan.");
    } finally { setIsSavingAct(false); }
  };

  const handleDeleteAct = async (act: Activity) => {
    const ok = await confirm({ title: "Hapus Kegiatan", message: `Yakin ingin menghapus secara permanen "${act.name}"?`, confirmLabel: "Ya, Hapus", variant: "danger" });
    if (!ok) return;
    setIsSavingAct(true);
    try {
      const res = await fetch(`/api/activities/${act.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      setActivities(activities.filter(a => a.id !== act.id));
      toast("success", "Terhapus", `Kegiatan ${act.name} dihapus.`);
      router.refresh();
    } catch (err) { toast("error", "Error", "Gagal menghapus kegiatan."); } finally { setIsSavingAct(false); }
  };

  const handleSaveReorderAct = async () => {
    setIsReorderingAct(true);
    try {
      const payload = activities.map((a, idx) => ({ id: a.id, sortOrder: idx }));
      const res = await fetch("/api/activities/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload })
      });
      if (!res.ok) throw new Error("Gagal menyimpan urutan");
      
      setHasReorderedAct(false);
      toast("success", "Berhasil", "Urutan kegiatan berhasil disimpan.");
      router.refresh();
    } catch (err) {
      toast("error", "Error", "Gagal menyimpan urutan kegiatan.");
    } finally {
      setIsReorderingAct(false);
    }
  };

  // == HANDLERS UNTUK BUNDLE ==
  const resetBundleForm = () => {
    setBundleName(""); setBundleDesc(""); setBundlePrice("");
    setBundleIsActive(true); setBundleActivityIds([]); setBundleEditingId(null);
  };

  const handleEditBundle = (bdl: BundleType) => {
    setBundleName(bdl.name); setBundleDesc(bdl.description || ""); setBundlePrice(bdl.price.toString());
    setBundleIsActive(bdl.isActive);
    setBundleActivityIds(bdl.items.map(i => i.activityId));
    setBundleEditingId(bdl.id); setShowBundleModal(true);
  };

  const handleSaveBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bundleActivityIds.length === 0) {
      toast("error", "Peringatan", "Pilih minimal 1 kegiatan untuk paket ini.");
      return;
    }
    setIsSavingBundle(true);
    const payload = {
      name: bundleName, description: bundleDesc, price: Number(bundlePrice),
      isActive: bundleIsActive, activityIds: bundleActivityIds
    };
    try {
      const url = bundleEditingId ? `/api/activity-bundles/${bundleEditingId}` : `/api/activity-bundles`;
      const res = await fetch(url, { method: bundleEditingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Gagal menyimpan data");
      const data = await res.json();
      let newBdls = [...bundles];
      if (bundleEditingId) newBdls = newBdls.map(b => b.id === bundleEditingId ? data.bundle : b);
      else newBdls.push(data.bundle);
      setBundles(newBdls.sort((a, b) => a.sortOrder - b.sortOrder));
      resetBundleForm(); setShowBundleModal(false); router.refresh();
      toast("success", "Berhasil", "Paket disimpan.");
    } catch (err) { toast("error", "Error", "Gagal menyimpan paket."); } finally { setIsSavingBundle(false); }
  };

  const handleDeleteBundle = async (bdl: BundleType) => {
    const ok = await confirm({ title: "Hapus Paket", message: `Yakin ingin menghapus permanen paket "${bdl.name}"?`, confirmLabel: "Ya, Hapus", variant: "danger" });
    if (!ok) return;
    setIsSavingBundle(true);
    try {
      const res = await fetch(`/api/activity-bundles/${bdl.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      setBundles(bundles.filter(b => b.id !== bdl.id));
      toast("success", "Terhapus", `Paket ${bdl.name} dihapus.`);
      router.refresh();
    } catch (err) { toast("error", "Error", "Gagal menghapus paket."); } finally { setIsSavingBundle(false); }
  };

  const toggleBundleActivity = (id: string) => {
    if (bundleActivityIds.includes(id)) {
      setBundleActivityIds(bundleActivityIds.filter(x => x !== id));
    } else {
      setBundleActivityIds([...bundleActivityIds, id]);
    }
  };

  const handleSaveReorder = async () => {
    setIsReordering(true);
    try {
      const payload = bundles.map((b, idx) => ({ id: b.id, sortOrder: idx }));
      const res = await fetch("/api/activity-bundles/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload })
      });
      if (!res.ok) throw new Error("Gagal menyimpan urutan");
      
      setHasReordered(false);
      toast("success", "Berhasil", "Urutan paket berhasil disimpan.");
      router.refresh();
    } catch (err) {
      toast("error", "Error", "Gagal menyimpan urutan paket.");
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>

        {/* ─── TABS NAV ─── */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
          <button
            onClick={() => setActiveTab("satuan")}
            style={{
              padding: "0.625rem 1.25rem", borderRadius: 99, fontWeight: 700, fontSize: "0.875rem",
              background: activeTab === "satuan" ? "var(--charcoal)" : "transparent",
              color: activeTab === "satuan" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer", transition: "all 0.2s"
            }}
          >
            Kegiatan Satuan
          </button>
          <button
            onClick={() => setActiveTab("paket")}
            style={{
              padding: "0.625rem 1.25rem", borderRadius: 99, fontWeight: 700, fontSize: "0.875rem",
              background: activeTab === "paket" ? "var(--charcoal)" : "transparent",
              color: activeTab === "paket" ? "white" : "var(--text-muted)",
              border: "none", cursor: "pointer", transition: "all 0.2s"
            }}
          >
            Paket Bundling
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB KEGIATAN SATUAN */}
        {/* ========================================================= */}
        {activeTab === "satuan" && (
          <>
            <div style={{ background: "linear-gradient(135deg, #0d2818 0%, #1B6B4A 60%, #27956A 100%)", borderRadius: 20, padding: "1.75rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", boxShadow: "0 8px 32px rgba(27,107,74,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Layers size={26} color="white" />
                </div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Total Kegiatan Terdaftar</div>
                  <div style={{ color: "white", fontSize: "2.25rem", fontWeight: 900, lineHeight: 1.1 }}>{totalActItems}</div>
                </div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "0 2px 16px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <div style={{ padding: "1.375rem 1.75rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, var(--emerald-pale), rgba(27,107,74,0.15))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)" }}>
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--charcoal)" }}>Katalog Kegiatan Master</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>Anda bisa <strong style={{color: "var(--charcoal)"}}>drag & drop</strong> baris tabel untuk mengatur urutan.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {hasReorderedAct && (
                    <button type="button" onClick={handleSaveReorderAct} disabled={isReorderingAct} className="act-save-btn" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "white", color: "#16a34a", border: "1px solid #16a34a", borderRadius: 12, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(22,163,74,0.15)" }}>
                      <Save size={16} /> {isReorderingAct ? "Menyimpan..." : "Simpan Urutan"}
                    </button>
                  )}
                  <button type="button" onClick={() => { resetActForm(); setShowActModal(true); }} className="act-add-btn" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "linear-gradient(135deg, #1B6B4A, #27956A)", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(27,107,74,0.3)" }}>
                    <Plus size={16} /> Tambah Kegiatan
                  </button>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
                  <thead>
                    <tr style={{ background: "#FAFAFA" }}>
                      <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", width: 56, textAlign: "center" }}>Urut</th>
                      <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" }}>Info Kegiatan</th>
                      <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" }}>Biaya & Wilayah</th>
                      <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right", width: 140 }}>Aksi</th>
                    </tr>
                  </thead>
                  <Reorder.Group 
                    as="tbody" 
                    values={paginatedActivities} 
                    onReorder={(newOrder) => {
                      const newActivities = [...activities];
                      const startIndex = (safeActPage - 1) * ACT_PAGE_SIZE;
                      newActivities.splice(startIndex, ACT_PAGE_SIZE, ...newOrder);
                      setActivities(newActivities);
                      setHasReorderedAct(true);
                    }}
                  >
                    {paginatedActivities.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: "4rem 1rem", textAlign: "center" }}>
                          <ClipboardList size={40} style={{ margin: "0 auto", color: "#CBD5E1", marginBottom: "0.75rem" }} />
                          <div style={{ fontWeight: 700, color: "var(--charcoal)", fontSize: "0.9375rem" }}>Belum Ada Kegiatan Terdaftar</div>
                        </td>
                      </tr>
                    )}
                    {paginatedActivities.map((act, idx) => {
                      const globalIdx = (safeActPage - 1) * ACT_PAGE_SIZE + idx + 1;
                      return (
                        <Reorder.Item 
                          as="tr" 
                          key={act.id} 
                          value={act}
                          className="act-row" 
                          style={{ borderTop: "1px solid var(--border)", cursor: "grab", background: "#ffffff" }}
                          whileDrag={{ scale: 1.01, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", background: "#f8fafc", position: "relative", zIndex: 10 }}
                        >
                          <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                              <GripVertical size={16} color="#CBD5E1" style={{ cursor: "grab" }} />
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ivory)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)" }}>
                                {globalIdx}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--charcoal)" }}>{act.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Clock size={12} /> {act.duration || "—"}</span>
                            </div>
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--emerald)" }}>Rp {act.price.toLocaleString("id-ID")}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <MapPin size={12} /> {act.location === "BOTH" ? "Makkah & Madinah" : act.location || "—"}
                            </div>
                          </td>
                          <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.75rem", borderRadius: 99, background: act.isActive ? "var(--emerald-pale)" : "#FEF2F2", color: act.isActive ? "var(--emerald)" : "#DC2626", border: `1px solid ${act.isActive ? '#a7f3d0' : '#FECACA'}`, fontSize: "0.75rem", fontWeight: 700 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: act.isActive ? "var(--emerald)" : "#EF4444", display: "inline-block" }} />
                              {act.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                              <button type="button" className="act-icon-btn act-edit-btn" onClick={() => handleEditAct(act)} disabled={isSavingAct}><Edit2 size={14} /></button>
                              <button type="button" className="act-icon-btn act-delete-btn" onClick={() => handleDeleteAct(act)} disabled={isSavingAct}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                </table>
              </div>

              <div style={{ padding: "0.875rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {totalActItems === 0 ? "Tidak ada data" : <>Halaman <strong style={{ color: "var(--charcoal)" }}>{safeActPage}</strong> dari <strong style={{ color: "var(--charcoal)" }}>{totalActPages}</strong></>}
                </span>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button onClick={() => setCurrentActPage(p => Math.max(1, p - 1))} disabled={safeActPage === 1} className="act-page-btn" style={{ padding: "0.4375rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: safeActPage === 1 ? "var(--ivory)" : "white", cursor: safeActPage === 1 ? "not-allowed" : "pointer" }}>←</button>
                  <button onClick={() => setCurrentActPage(p => Math.min(totalActPages, p + 1))} disabled={safeActPage === totalActPages} className="act-page-btn" style={{ padding: "0.4375rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: safeActPage === totalActPages ? "var(--ivory)" : "white", cursor: safeActPage === totalActPages ? "not-allowed" : "pointer" }}>→</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB PAKET BUNDLING */}
        {/* ========================================================= */}
        {activeTab === "paket" && (
          <>
            <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)", borderRadius: 20, padding: "1.75rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", boxShadow: "0 8px 32px rgba(37,99,235,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Package size={26} color="white" />
                </div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Total Paket Terdaftar</div>
                  <div style={{ color: "white", fontSize: "2.25rem", fontWeight: 900, lineHeight: 1.1 }}>{totalBundleItems}</div>
                </div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "0 2px 16px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <div style={{ padding: "1.375rem 1.75rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, #eff6ff, #dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                    <Package size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--charcoal)" }}>Katalog Paket (Bundling)</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>Anda bisa <strong style={{color: "var(--charcoal)"}}>drag & drop</strong> baris tabel untuk mengatur urutan.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {hasReordered && (
                    <button type="button" onClick={handleSaveReorder} disabled={isReordering} className="bundle-save-btn" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "white", color: "#16a34a", border: "1px solid #16a34a", borderRadius: 12, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(22,163,74,0.15)" }}>
                      <Save size={16} /> {isReordering ? "Menyimpan..." : "Simpan Urutan"}
                    </button>
                  )}
                  <button type="button" onClick={() => { resetBundleForm(); setShowBundleModal(true); }} className="bundle-add-btn" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "linear-gradient(135deg, #1e40af, #2563eb)", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}>
                    <Plus size={16} /> Tambah Paket
                  </button>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
                  <thead>
                    <tr style={{ background: "#FAFAFA" }}>
                      <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", width: 56, textAlign: "center" }}>Urut</th>
                      <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" }}>Nama Paket & Isi</th>
                      <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" }}>Harga Paket</th>
                      <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "0.75rem 1.5rem", fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right", width: 140 }}>Aksi</th>
                    </tr>
                  </thead>
                  <Reorder.Group 
                    as="tbody" 
                    values={paginatedBundles} 
                    onReorder={(newOrder) => {
                      const newBundles = [...bundles];
                      const startIndex = (safeBundlePage - 1) * BUNDLE_PAGE_SIZE;
                      newBundles.splice(startIndex, BUNDLE_PAGE_SIZE, ...newOrder);
                      setBundles(newBundles);
                      setHasReordered(true);
                    }}
                  >
                    {paginatedBundles.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: "4rem 1rem", textAlign: "center" }}>
                          <Package size={40} style={{ margin: "0 auto", color: "#CBD5E1", marginBottom: "0.75rem" }} />
                          <div style={{ fontWeight: 700, color: "var(--charcoal)", fontSize: "0.9375rem" }}>Belum Ada Paket Terdaftar</div>
                        </td>
                      </tr>
                    )}
                    {paginatedBundles.map((bdl, idx) => {
                      const globalIdx = (safeBundlePage - 1) * BUNDLE_PAGE_SIZE + idx + 1;
                      return (
                        <Reorder.Item 
                          as="tr" 
                          key={bdl.id} 
                          value={bdl}
                          className="act-row" 
                          style={{ borderTop: "1px solid var(--border)", cursor: "grab", background: "#ffffff" }}
                          whileDrag={{ scale: 1.01, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", background: "#f8fafc", position: "relative", zIndex: 10 }}
                        >
                          <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                              <GripVertical size={16} color="#CBD5E1" style={{ cursor: "grab" }} />
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ivory)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)" }}>
                                {globalIdx}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--charcoal)" }}>{bdl.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                              Terdiri dari: <strong style={{ color: "var(--charcoal)" }}>{bdl.items.length} kegiatan</strong>
                            </div>
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "#2563eb" }}>Rp {bdl.price.toLocaleString("id-ID")}</div>
                          </td>
                          <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.75rem", borderRadius: 99, background: bdl.isActive ? "#eff6ff" : "#FEF2F2", color: bdl.isActive ? "#2563eb" : "#DC2626", border: `1px solid ${bdl.isActive ? '#bfdbfe' : '#FECACA'}`, fontSize: "0.75rem", fontWeight: 700 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: bdl.isActive ? "#3b82f6" : "#EF4444", display: "inline-block" }} />
                              {bdl.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                              <button type="button" className="act-icon-btn act-edit-btn" onClick={() => handleEditBundle(bdl)} disabled={isSavingBundle}><Edit2 size={14} /></button>
                              <button type="button" className="act-icon-btn act-delete-btn" onClick={() => handleDeleteBundle(bdl)} disabled={isSavingBundle}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                </table>
              </div>

              <div style={{ padding: "0.875rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {totalBundleItems === 0 ? "Tidak ada data" : <>Halaman <strong style={{ color: "var(--charcoal)" }}>{safeBundlePage}</strong> dari <strong style={{ color: "var(--charcoal)" }}>{totalBundlePages}</strong></>}
                </span>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button onClick={() => setCurrentBundlePage(p => Math.max(1, p - 1))} disabled={safeBundlePage === 1} className="act-page-btn" style={{ padding: "0.4375rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: safeBundlePage === 1 ? "var(--ivory)" : "white", cursor: safeBundlePage === 1 ? "not-allowed" : "pointer" }}>←</button>
                  <button onClick={() => setCurrentBundlePage(p => Math.min(totalBundlePages, p + 1))} disabled={safeBundlePage === totalBundlePages} className="act-page-btn" style={{ padding: "0.4375rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: safeBundlePage === totalBundlePages ? "var(--ivory)" : "white", cursor: safeBundlePage === totalBundlePages ? "not-allowed" : "pointer" }}>→</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── MODAL KEGIATAN SATUAN ─── */}
      {showActModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowActModal(false); resetActForm(); } }} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 540, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(27,107,74,0.1)", border: "1px solid rgba(27,107,74,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)" }}>
                  {actEditingId ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--charcoal)" }}>{actEditingId ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Konfigurasi detail kegiatan satuan</div>
                </div>
              </div>
              <button type="button" onClick={() => { setShowActModal(false); resetActForm(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.375rem", borderRadius: 8, color: "var(--text-muted)" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveAct} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Nama Kegiatan *</label><input type="text" required value={actName} onChange={e => setActName(e.target.value)} disabled={isSavingAct} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--border)", outline: "none", fontFamily: "inherit" }} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Deskripsi Opsional</label><textarea value={actDesc} onChange={e => setActDesc(e.target.value)} disabled={isSavingAct} rows={2} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--border)", outline: "none", fontFamily: "inherit", resize: "vertical" }} /></div>
                <div><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Estimasi Durasi (misal: 2 Jam)</label><input type="text" value={actDuration} onChange={e => setActDuration(e.target.value)} disabled={isSavingAct} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--border)", outline: "none", fontFamily: "inherit" }} /></div>
                <div><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Wilayah Layanan</label><select value={actLocation} onChange={e => setActLocation(e.target.value)} disabled={isSavingAct} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--border)", outline: "none", fontFamily: "inherit", background: "white" }}><option value="">Pilih Lokasi...</option><option value="MAKKAH">Makkah</option><option value="MADINAH">Madinah</option><option value="BOTH">Keduanya (Makkah & Madinah)</option></select></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Harga Dasar Kegiatan *</label><input type="number" required value={actPrice} onChange={e => setActPrice(e.target.value)} disabled={isSavingAct} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--border)", outline: "none", fontFamily: "inherit" }} /></div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                <button type="submit" disabled={isSavingAct || !actName} style={{ padding: "0.75rem 1.5rem", borderRadius: 10, background: "var(--charcoal)", color: "white", fontWeight: 700, cursor: "pointer", border: "none" }}>{isSavingAct ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL PAKET BUNDLING ─── */}
      {showBundleModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowBundleModal(false); resetBundleForm(); } }} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 640, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #eff6ff, #dbeafe)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                  {bundleEditingId ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--charcoal)" }}>{bundleEditingId ? "Edit Paket Bundling" : "Buat Paket Bundling"}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Satu paket berisi kombinasi dari kegiatan master</div>
                </div>
              </div>
              <button type="button" onClick={() => { setShowBundleModal(false); resetBundleForm(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.375rem", borderRadius: 8, color: "var(--text-muted)" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveBundle} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Nama Paket *</label><input type="text" required value={bundleName} onChange={e => setBundleName(e.target.value)} disabled={isSavingBundle} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--border)", outline: "none", fontFamily: "inherit" }} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Deskripsi / Ringkasan</label><textarea value={bundleDesc} onChange={e => setBundleDesc(e.target.value)} disabled={isSavingBundle} rows={2} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--border)", outline: "none", fontFamily: "inherit", resize: "vertical" }} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Harga Paket (Diskon) *</label><input type="number" required value={bundlePrice} onChange={e => setBundlePrice(e.target.value)} disabled={isSavingBundle} style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--border)", outline: "none", fontFamily: "inherit" }} /></div>
              </div>

              {/* Pilih Kegiatan didalam Paket */}
              <div style={{ marginTop: "0.5rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pilih Kegiatan ke dalam Paket</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.5rem", maxHeight: 200, overflowY: "auto", border: "1px solid var(--border)", padding: "0.5rem", borderRadius: 10, background: "var(--ivory)" }}>
                  {activities.map(act => (
                    <label key={act.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "white", padding: "0.75rem", borderRadius: 8, cursor: "pointer", border: bundleActivityIds.includes(act.id) ? "1px solid #3b82f6" : "1px solid var(--border)" }}>
                      <input type="checkbox" checked={bundleActivityIds.includes(act.id)} onChange={() => toggleBundleActivity(act.id)} disabled={isSavingBundle} style={{ accentColor: "#2563eb", width: 16, height: 16 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--charcoal)" }}>{act.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
                          <span>Rp {act.price.toLocaleString("id-ID")}</span>
                          <span>·</span>
                          <span>{act.duration || "Tanpa durasi"}</span>
                          <span>·</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                            <MapPin size={10} /> {act.location === "BOTH" ? "Makkah & Madinah" : act.location || "—"}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                  {activities.length === 0 && (
                    <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--text-muted)" }}>Belum ada kegiatan master yang tersedia.</div>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Terpilih: {bundleActivityIds.length} Kegiatan
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                <button type="submit" disabled={isSavingBundle || !bundleName || bundleActivityIds.length === 0} style={{ padding: "0.75rem 1.5rem", borderRadius: 10, background: "#2563eb", color: "white", fontWeight: 700, cursor: "pointer", border: "none" }}>{isSavingBundle ? "Menyimpan..." : "Simpan Paket"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .act-row { transition: background 0.15s; }
        .act-row:hover { background: #FAFAFA; }
        .act-icon-btn { width: 34px; height: 34px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.18s; background: transparent; }
        .act-edit-btn { border: 1px solid var(--border); color: var(--text-muted); }
        .act-edit-btn:hover { background: var(--ivory-dark); color: var(--charcoal); border-color: #CBD5E1; }
        .act-delete-btn { border: 1px solid var(--border); color: var(--text-muted); }
        .act-delete-btn:hover { background: #FEF2F2; color: #EF4444; border-color: #FECACA; }
        .act-add-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(27,107,74,0.35) !important; }
        .bundle-add-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.35) !important; }
        .act-page-btn:hover:not(:disabled) { background: #F1F5F9 !important; }
      `}</style>
    </>
  );
}
