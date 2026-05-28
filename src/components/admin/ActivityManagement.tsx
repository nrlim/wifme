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
      <div className="am-root">

        {/* ─── SEGMENTED TAB BAR ─── */}
        <div className="am-tab-bar">
          <button
            onClick={() => setActiveTab("satuan")}
            className={`am-tab-btn ${activeTab === "satuan" ? "am-tab-active" : ""}`}
          >
            <ClipboardList size={16} />
            Kegiatan Satuan
          </button>
          <button
            onClick={() => setActiveTab("paket")}
            className={`am-tab-btn ${activeTab === "paket" ? "am-tab-active" : ""}`}
          >
            <Package size={16} />
            Paket Bundling
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB KEGIATAN SATUAN */}
        {/* ========================================================= */}
        {activeTab === "satuan" && (
          <>
            {/* Summary Hero */}
            <div className="am-hero am-hero-green">
              <div className="am-hero-glow am-hero-glow-1" />
              <div className="am-hero-glow am-hero-glow-2" />
              <div className="am-hero-content">
                <div className="am-hero-icon">
                  <Layers size={26} />
                </div>
                <div className="am-hero-text">
                  <div className="am-hero-label">Total Kegiatan Terdaftar</div>
                  <div className="am-hero-count">{totalActItems}</div>
                </div>
              </div>
            </div>

            {/* Main Card */}
            <div className="am-card">
              <div className="am-card-hdr">
                <div className="am-card-hdr-left">
                  <div className="am-card-icon am-card-icon-green">
                    <ClipboardList size={20} />
                  </div>
                  <div className="am-card-hdr-text">
                    <div className="am-card-title">Katalog Kegiatan Master</div>
                    <div className="am-card-subtitle">Drag &amp; drop baris untuk mengatur urutan</div>
                  </div>
                </div>
                <div className="am-card-hdr-right">
                  {hasReorderedAct && (
                    <button type="button" onClick={handleSaveReorderAct} disabled={isReorderingAct} className="am-btn am-btn-outline-green">
                      <Save size={16} /> {isReorderingAct ? "Menyimpan..." : "Simpan Urutan"}
                    </button>
                  )}
                  <button type="button" onClick={() => { resetActForm(); setShowActModal(true); }} className="am-btn am-btn-green">
                    <Plus size={16} /> Tambah Kegiatan
                  </button>
                </div>
              </div>

              <div className="am-list-wrap">
                <Reorder.Group
                  as="div"
                  values={paginatedActivities}
                  onReorder={(newOrder) => {
                    const newActivities = [...activities];
                    const startIndex = (safeActPage - 1) * ACT_PAGE_SIZE;
                    newActivities.splice(startIndex, ACT_PAGE_SIZE, ...newOrder);
                    setActivities(newActivities);
                    setHasReorderedAct(true);
                  }}
                  className="am-list-group"
                >
                  {paginatedActivities.length === 0 && (
                    <div className="am-empty">
                      <div className="am-empty-icon"><ClipboardList size={44} /></div>
                      <div className="am-empty-title">Belum Ada Kegiatan Terdaftar</div>
                      <div className="am-empty-desc">Klik &quot;Tambah Kegiatan&quot; untuk memulai</div>
                    </div>
                  )}
                  {paginatedActivities.map((act, idx) => {
                    const globalIdx = (safeActPage - 1) * ACT_PAGE_SIZE + idx + 1;
                    return (
                      <Reorder.Item
                        as="div"
                        key={act.id}
                        value={act}
                        className="am-row"
                        whileDrag={{ scale: 1.02, boxShadow: "0 12px 32px rgba(0,0,0,0.12)", background: "#FAFFFE", zIndex: 10 }}
                      >
                        <div className="am-row-drag">
                          <GripVertical size={16} />
                          <span className="am-row-idx">{globalIdx}</span>
                        </div>
                        <div className="am-row-body">
                          <div className="am-row-name">{act.name}</div>
                          <div className="am-row-meta">
                            <span className="am-row-chip"><Clock size={12} /> {act.duration || "\u2014"}</span>
                            <span className="am-row-chip"><MapPin size={12} /> {act.location === "BOTH" ? "Makkah & Madinah" : act.location || "\u2014"}</span>
                          </div>
                        </div>
                        <div className="am-row-price am-col-desktop">
                          <span className="am-price-green">Rp {act.price.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="am-row-status am-col-desktop">
                          <span className={`am-pill ${act.isActive ? "am-pill-green" : "am-pill-red"}`}>
                            <span className={`am-pill-dot ${act.isActive ? "am-dot-green" : "am-dot-red"}`} />
                            {act.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                        <div className="am-row-actions">
                          <button type="button" className="am-icon-btn am-icon-edit" onClick={() => handleEditAct(act)} disabled={isSavingAct}><Edit2 size={14} /></button>
                          <button type="button" className="am-icon-btn am-icon-del" onClick={() => handleDeleteAct(act)} disabled={isSavingAct}><Trash2 size={14} /></button>
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>

              {/* Pagination */}
              <div className="am-pager">
                <span className="am-pager-info">
                  {totalActItems === 0 ? "Tidak ada data" : <>Halaman <strong>{safeActPage}</strong> dari <strong>{totalActPages}</strong></>}
                </span>
                <div className="am-pager-btns">
                  <button onClick={() => setCurrentActPage(p => Math.max(1, p - 1))} disabled={safeActPage === 1} className="am-pager-btn">&larr;</button>
                  <button onClick={() => setCurrentActPage(p => Math.min(totalActPages, p + 1))} disabled={safeActPage === totalActPages} className="am-pager-btn">&rarr;</button>
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
            <div className="am-hero am-hero-blue">
              <div className="am-hero-glow am-hero-glow-1" />
              <div className="am-hero-glow am-hero-glow-2" />
              <div className="am-hero-content">
                <div className="am-hero-icon">
                  <Package size={26} />
                </div>
                <div className="am-hero-text">
                  <div className="am-hero-label">Total Paket Terdaftar</div>
                  <div className="am-hero-count">{totalBundleItems}</div>
                </div>
              </div>
            </div>

            <div className="am-card">
              <div className="am-card-hdr">
                <div className="am-card-hdr-left">
                  <div className="am-card-icon am-card-icon-blue">
                    <Package size={20} />
                  </div>
                  <div className="am-card-hdr-text">
                    <div className="am-card-title">Katalog Paket Bundling</div>
                    <div className="am-card-subtitle">Drag &amp; drop baris untuk mengatur urutan</div>
                  </div>
                </div>
                <div className="am-card-hdr-right">
                  {hasReordered && (
                    <button type="button" onClick={handleSaveReorder} disabled={isReordering} className="am-btn am-btn-outline-blue">
                      <Save size={16} /> {isReordering ? "Menyimpan..." : "Simpan Urutan"}
                    </button>
                  )}
                  <button type="button" onClick={() => { resetBundleForm(); setShowBundleModal(true); }} className="am-btn am-btn-blue">
                    <Plus size={16} /> Tambah Paket
                  </button>
                </div>
              </div>

              <div className="am-list-wrap">
                <Reorder.Group
                  as="div"
                  values={paginatedBundles}
                  onReorder={(newOrder) => {
                    const newBundles = [...bundles];
                    const startIndex = (safeBundlePage - 1) * BUNDLE_PAGE_SIZE;
                    newBundles.splice(startIndex, BUNDLE_PAGE_SIZE, ...newOrder);
                    setBundles(newBundles);
                    setHasReordered(true);
                  }}
                  className="am-list-group"
                >
                  {paginatedBundles.length === 0 && (
                    <div className="am-empty">
                      <div className="am-empty-icon am-empty-icon-blue"><Package size={44} /></div>
                      <div className="am-empty-title">Belum Ada Paket Terdaftar</div>
                      <div className="am-empty-desc">Klik &quot;Tambah Paket&quot; untuk memulai</div>
                    </div>
                  )}
                  {paginatedBundles.map((bdl, idx) => {
                    const globalIdx = (safeBundlePage - 1) * BUNDLE_PAGE_SIZE + idx + 1;
                    return (
                      <Reorder.Item
                        as="div"
                        key={bdl.id}
                        value={bdl}
                        className="am-row"
                        whileDrag={{ scale: 1.02, boxShadow: "0 12px 32px rgba(0,0,0,0.12)", background: "#F8FAFF", zIndex: 10 }}
                      >
                        <div className="am-row-drag">
                          <GripVertical size={16} />
                          <span className="am-row-idx am-row-idx-blue">{globalIdx}</span>
                        </div>
                        <div className="am-row-body">
                          <div className="am-row-name">{bdl.name}</div>
                          <div className="am-row-meta">
                            <span className="am-row-chip">{bdl.items.length} kegiatan</span>
                            {bdl.description && <span className="am-row-chip am-chip-desc">{bdl.description}</span>}
                          </div>
                        </div>
                        <div className="am-row-price am-col-desktop">
                          <span className="am-price-blue">Rp {bdl.price.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="am-row-status am-col-desktop">
                          <span className={`am-pill ${bdl.isActive ? "am-pill-blue" : "am-pill-red"}`}>
                            <span className={`am-pill-dot ${bdl.isActive ? "am-dot-blue" : "am-dot-red"}`} />
                            {bdl.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                        <div className="am-row-actions">
                          <button type="button" className="am-icon-btn am-icon-edit" onClick={() => handleEditBundle(bdl)} disabled={isSavingBundle}><Edit2 size={14} /></button>
                          <button type="button" className="am-icon-btn am-icon-del" onClick={() => handleDeleteBundle(bdl)} disabled={isSavingBundle}><Trash2 size={14} /></button>
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>

              <div className="am-pager">
                <span className="am-pager-info">
                  {totalBundleItems === 0 ? "Tidak ada data" : <>Halaman <strong>{safeBundlePage}</strong> dari <strong>{totalBundlePages}</strong></>}
                </span>
                <div className="am-pager-btns">
                  <button onClick={() => setCurrentBundlePage(p => Math.max(1, p - 1))} disabled={safeBundlePage === 1} className="am-pager-btn">&larr;</button>
                  <button onClick={() => setCurrentBundlePage(p => Math.min(totalBundlePages, p + 1))} disabled={safeBundlePage === totalBundlePages} className="am-pager-btn">&rarr;</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── MODAL KEGIATAN SATUAN ─── */}
      {showActModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowActModal(false); resetActForm(); } }} className="am-overlay">
          <div className="am-modal">
            {/* Modal Header */}
            <div className="am-modal-hdr am-modal-hdr-green">
              <div className="am-modal-hdr-left">
                <div className="am-modal-icon am-modal-icon-green">
                  {actEditingId ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <div className="am-modal-title">{actEditingId ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}</div>
                  <div className="am-modal-subtitle">Konfigurasi detail kegiatan satuan</div>
                </div>
              </div>
              <button type="button" onClick={() => { setShowActModal(false); resetActForm(); }} className="am-modal-close"><X size={20} /></button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAct} className="am-modal-body">
              <div className="am-form-section">
                <div className="am-form-section-title">Informasi Dasar</div>
                <div className="am-field">
                  <label className="am-label">Nama Kegiatan <span className="am-req">*</span></label>
                  <input type="text" required value={actName} onChange={e => setActName(e.target.value)} disabled={isSavingAct} placeholder="contoh: Tawaf Ifadah" className="am-input" />
                </div>
                <div className="am-field">
                  <label className="am-label">Deskripsi <span className="am-optional">(opsional)</span></label>
                  <textarea value={actDesc} onChange={e => setActDesc(e.target.value)} disabled={isSavingAct} rows={2} placeholder="Penjelasan singkat tentang kegiatan ini..." className="am-input am-textarea" />
                </div>
              </div>

              <div className="am-form-divider" />

              <div className="am-form-section">
                <div className="am-form-section-title">Detail Operasional</div>
                <div className="am-field-row">
                  <div className="am-field">
                    <label className="am-label">Estimasi Durasi</label>
                    <input type="text" value={actDuration} onChange={e => setActDuration(e.target.value)} disabled={isSavingAct} placeholder="misal: 2 Jam" className="am-input" />
                  </div>
                  <div className="am-field">
                    <label className="am-label">Wilayah Layanan</label>
                    <select value={actLocation} onChange={e => setActLocation(e.target.value)} disabled={isSavingAct} className="am-input am-select">
                      <option value="">Pilih Lokasi...</option>
                      <option value="MAKKAH">Makkah</option>
                      <option value="MADINAH">Madinah</option>
                      <option value="BOTH">Keduanya (Makkah &amp; Madinah)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="am-form-divider" />

              <div className="am-form-section">
                <div className="am-form-section-title">Harga</div>
                <div className="am-field">
                  <label className="am-label">Harga Dasar Kegiatan <span className="am-req">*</span></label>
                  <div className="am-input-prefix-wrap">
                    <span className="am-input-prefix">Rp</span>
                    <input type="number" required value={actPrice} onChange={e => setActPrice(e.target.value)} disabled={isSavingAct} placeholder="0" className="am-input am-input-with-prefix" />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="am-modal-footer">
                <button type="button" onClick={() => { setShowActModal(false); resetActForm(); }} className="am-btn am-btn-ghost">Batal</button>
                <button type="submit" disabled={isSavingAct || !actName} className="am-btn am-btn-green">
                  {isSavingAct ? "Menyimpan..." : (actEditingId ? "Simpan Perubahan" : "Tambah Kegiatan")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL PAKET BUNDLING ─── */}
      {showBundleModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowBundleModal(false); resetBundleForm(); } }} className="am-overlay">
          <div className="am-modal am-modal-wide">
            <div className="am-modal-hdr am-modal-hdr-blue">
              <div className="am-modal-hdr-left">
                <div className="am-modal-icon am-modal-icon-blue">
                  {bundleEditingId ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <div className="am-modal-title">{bundleEditingId ? "Edit Paket Bundling" : "Buat Paket Bundling"}</div>
                  <div className="am-modal-subtitle">Satu paket berisi kombinasi dari kegiatan master</div>
                </div>
              </div>
              <button type="button" onClick={() => { setShowBundleModal(false); resetBundleForm(); }} className="am-modal-close"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveBundle} className="am-modal-body">
              <div className="am-form-section">
                <div className="am-form-section-title">Informasi Paket</div>
                <div className="am-field">
                  <label className="am-label">Nama Paket <span className="am-req">*</span></label>
                  <input type="text" required value={bundleName} onChange={e => setBundleName(e.target.value)} disabled={isSavingBundle} placeholder="contoh: Paket Umroh Reguler" className="am-input" />
                </div>
                <div className="am-field">
                  <label className="am-label">Deskripsi / Ringkasan <span className="am-optional">(opsional)</span></label>
                  <textarea value={bundleDesc} onChange={e => setBundleDesc(e.target.value)} disabled={isSavingBundle} rows={2} placeholder="Penjelasan singkat tentang paket ini..." className="am-input am-textarea" />
                </div>
                <div className="am-field">
                  <label className="am-label">Harga Paket (Diskon) <span className="am-req">*</span></label>
                  <div className="am-input-prefix-wrap">
                    <span className="am-input-prefix">Rp</span>
                    <input type="number" required value={bundlePrice} onChange={e => setBundlePrice(e.target.value)} disabled={isSavingBundle} placeholder="0" className="am-input am-input-with-prefix" />
                  </div>
                </div>
              </div>

              <div className="am-form-divider" />

              {/* Activity selection */}
              <div className="am-form-section">
                <div className="am-form-section-title">Pilih Kegiatan ke dalam Paket</div>
                <div className="am-form-section-desc">Centang kegiatan yang ingin dimasukkan ke paket ini</div>
                <div className="am-checklist-wrap">
                  {activities.map(act => (
                    <label key={act.id} className={`am-checklist-item ${bundleActivityIds.includes(act.id) ? "am-checklist-selected" : ""}`}>
                      <input type="checkbox" checked={bundleActivityIds.includes(act.id)} onChange={() => toggleBundleActivity(act.id)} disabled={isSavingBundle} className="am-checkbox" />
                      <div className="am-checklist-info">
                        <div className="am-checklist-name">{act.name}</div>
                        <div className="am-checklist-meta">
                          <span>Rp {act.price.toLocaleString("id-ID")}</span>
                          <span className="am-checklist-sep">&middot;</span>
                          <span>{act.duration || "Tanpa durasi"}</span>
                          <span className="am-checklist-sep">&middot;</span>
                          <span className="am-checklist-loc"><MapPin size={10} /> {act.location === "BOTH" ? "Makkah & Madinah" : act.location || "\u2014"}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                  {activities.length === 0 && (
                    <div className="am-checklist-empty">Belum ada kegiatan master yang tersedia.</div>
                  )}
                </div>
                <div className="am-checklist-count">
                  Terpilih: <strong>{bundleActivityIds.length}</strong> Kegiatan
                </div>
              </div>

              <div className="am-modal-footer">
                <button type="button" onClick={() => { setShowBundleModal(false); resetBundleForm(); }} className="am-btn am-btn-ghost">Batal</button>
                <button type="submit" disabled={isSavingBundle || !bundleName || bundleActivityIds.length === 0} className="am-btn am-btn-blue">
                  {isSavingBundle ? "Menyimpan..." : (bundleEditingId ? "Simpan Perubahan" : "Buat Paket")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        /* ====================== ROOT ====================== */
        .am-root {
          display: flex; flex-direction: column; gap: 1.25rem;
          width: 100%; font-family: inherit;
        }

        /* ====================== TAB BAR ====================== */
        .am-tab-bar {
          display: flex; gap: 4px;
          background: var(--ivory); border: 1px solid var(--border);
          border-radius: 14px; padding: 4px;
        }
        .am-tab-btn {
          flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 16px; border-radius: 11px;
          font-weight: 700; font-size: 13px;
          border: none; cursor: pointer;
          color: var(--text-muted); background: transparent;
          transition: all 0.2s;
        }
        .am-tab-btn:hover:not(.am-tab-active) { background: rgba(0,0,0,0.03); }
        .am-tab-active {
          background: white !important;
          color: var(--charcoal) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04);
        }

        /* ====================== HERO SUMMARY ====================== */
        .am-hero {
          position: relative; overflow: hidden;
          border-radius: 20px; padding: 1.5rem 1.625rem;
          box-shadow: 0 8px 28px -4px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .am-hero-green { background: linear-gradient(135deg, #0f2e1c 0%, #1B6B4A 45%, #2ea979 100%); }
        .am-hero-blue  { background: linear-gradient(135deg, #1e3a5f 0%, #2563EB 45%, #60a5fa 100%); }

        .am-hero-glow {
          position: absolute; border-radius: 50%; pointer-events: none;
        }
        .am-hero-glow-1 {
          top: -60px; right: -40px; width: 200px; height: 200px;
          background: rgba(255,255,255,0.08); filter: blur(60px);
        }
        .am-hero-glow-2 {
          bottom: -50px; left: 20px; width: 140px; height: 140px;
          background: rgba(0,0,0,0.12); filter: blur(50px);
        }
        .am-hero-content {
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 1rem;
        }
        .am-hero-icon {
          width: 52px; height: 52px; border-radius: 15px;
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
          backdrop-filter: blur(8px);
        }
        .am-hero-text { color: white; }
        .am-hero-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; opacity: 0.75; margin-bottom: 4px;
        }
        .am-hero-count { font-size: 2.25rem; font-weight: 900; line-height: 1; }

        /* ====================== MAIN CARD ====================== */
        .am-card {
          background: white; border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          overflow: hidden;
        }
        .am-card-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; gap: 1rem;
          border-bottom: 1px solid var(--border);
        }
        .am-card-hdr-left { display: flex; align-items: center; gap: 0.875rem; }
        .am-card-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .am-card-icon-green {
          background: linear-gradient(135deg, var(--emerald-pale), rgba(27,107,74,0.12));
          color: var(--emerald); border: 1px solid rgba(27,107,74,0.08);
        }
        .am-card-icon-blue {
          background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
          color: #2563EB; border: 1px solid rgba(37,99,235,0.08);
        }
        .am-card-hdr-text {}
        .am-card-title { font-weight: 800; font-size: 16px; color: var(--charcoal); line-height: 1.25; }
        .am-card-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .am-card-hdr-right { display: flex; gap: 0.5rem; flex-shrink: 0; }

        /* ====================== BUTTONS ====================== */
        .am-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          min-height: 44px; padding: 0 1.125rem;
          border-radius: 12px; font-weight: 700; font-size: 13px;
          cursor: pointer; border: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
        }
        .am-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .am-btn-green {
          background: linear-gradient(135deg, #1B6B4A, #27956A);
          color: white;
          box-shadow: 0 3px 10px rgba(27,107,74,0.2);
        }
        .am-btn-green:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(27,107,74,0.3); }
        .am-btn-green:active:not(:disabled) { transform: translateY(0); }

        .am-btn-blue {
          background: linear-gradient(135deg, #2563EB, #3B82F6);
          color: white;
          box-shadow: 0 3px 10px rgba(37,99,235,0.2);
        }
        .am-btn-blue:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37,99,235,0.3); }
        .am-btn-blue:active:not(:disabled) { transform: translateY(0); }

        .am-btn-outline-green {
          background: white; color: #16A34A; border: 1.5px solid #16A34A;
        }
        .am-btn-outline-green:hover:not(:disabled) { background: #F0FDF4; }

        .am-btn-outline-blue {
          background: white; color: #2563EB; border: 1.5px solid #2563EB;
        }
        .am-btn-outline-blue:hover:not(:disabled) { background: #EFF6FF; }

        .am-btn-ghost {
          background: transparent; color: var(--text-muted); border: 1.5px solid var(--border);
        }
        .am-btn-ghost:hover:not(:disabled) { background: var(--ivory); color: var(--charcoal); }

        /* ====================== LIST ====================== */
        .am-list-wrap { display: flex; flex-direction: column; }
        .am-list-group { display: flex; flex-direction: column; }

        .am-row {
          display: flex; align-items: center; gap: 0.875rem;
          padding: 0.875rem 1.5rem;
          border-bottom: 1px solid var(--border);
          background: white; cursor: grab;
          transition: background 0.15s;
        }
        .am-row:last-child { border-bottom: none; }
        .am-row:hover { background: #FAFAF9; }

        .am-row-drag {
          display: flex; align-items: center; gap: 6px;
          flex-shrink: 0; color: #CBD5E1;
        }
        .am-row-idx {
          width: 22px; height: 22px; border-radius: 7px;
          background: var(--ivory); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 800; color: var(--text-muted);
        }
        .am-row-idx-blue { background: #EFF6FF; border-color: #BFDBFE; color: #2563EB; }

        .am-row-body { flex: 1; min-width: 0; }
        .am-row-name {
          font-weight: 700; font-size: 14px; color: var(--charcoal);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .am-row-meta {
          display: flex; align-items: center; gap: 8px;
          margin-top: 3px; flex-wrap: wrap;
        }
        .am-row-chip {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; color: var(--text-muted);
        }
        .am-chip-desc {
          max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .am-row-price { flex-shrink: 0; text-align: right; }
        .am-price-green { font-weight: 800; font-size: 14px; color: var(--emerald); }
        .am-price-blue  { font-weight: 800; font-size: 14px; color: #2563EB; }

        .am-row-status { flex-shrink: 0; }

        .am-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 99px;
          font-size: 11px; font-weight: 700; border: 1px solid;
        }
        .am-pill-green { background: var(--emerald-pale); color: var(--emerald); border-color: #A7F3D0; }
        .am-pill-red   { background: #FEF2F2; color: #DC2626; border-color: #FECACA; }
        .am-pill-blue  { background: #EFF6FF; color: #2563EB; border-color: #BFDBFE; }
        .am-pill-dot { width: 7px; height: 7px; border-radius: 50%; }
        .am-dot-green { background: var(--emerald); }
        .am-dot-red   { background: #EF4444; }
        .am-dot-blue  { background: #2563EB; }

        .am-row-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .am-icon-btn {
          width: 36px; height: 36px; border-radius: 10px;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.18s; background: transparent;
        }
        .am-icon-edit { border: 1px solid var(--border); color: var(--text-muted); }
        .am-icon-edit:hover { background: var(--ivory); color: var(--charcoal); border-color: #CBD5E1; }
        .am-icon-del { border: 1px solid var(--border); color: var(--text-muted); }
        .am-icon-del:hover { background: #FEF2F2; color: #EF4444; border-color: #FECACA; }

        /* ====================== EMPTY STATE ====================== */
        .am-empty { padding: 3.5rem 1.5rem; text-align: center; }
        .am-empty-icon { color: #CBD5E1; margin-bottom: 0.75rem; }
        .am-empty-icon-blue { color: #93C5FD; }
        .am-empty-title { font-weight: 700; font-size: 15px; color: var(--charcoal); }
        .am-empty-desc { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

        /* ====================== PAGINATION ====================== */
        .am-pager {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.875rem 1.5rem;
          border-top: 1px solid var(--border);
          flex-wrap: wrap; gap: 0.5rem;
        }
        .am-pager-info { font-size: 13px; color: var(--text-muted); }
        .am-pager-info strong { color: var(--charcoal); }
        .am-pager-btns { display: flex; gap: 4px; }
        .am-pager-btn {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid var(--border); background: white;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 14px; color: var(--charcoal);
          transition: all 0.15s;
        }
        .am-pager-btn:hover:not(:disabled) { background: var(--ivory); }
        .am-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ====================== MODAL OVERLAY ====================== */
        .am-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .am-modal {
          background: white; border-radius: 20px;
          width: 100%; max-width: 540px;
          max-height: 90vh; overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04);
        }
        .am-modal-wide { max-width: 640px; }

        .am-modal-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .am-modal-hdr-green { background: linear-gradient(135deg, #F0FDF4, #DCFCE7); }
        .am-modal-hdr-blue  { background: linear-gradient(135deg, #EFF6FF, #DBEAFE); }
        .am-modal-hdr-left { display: flex; align-items: center; gap: 0.875rem; }
        .am-modal-icon {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .am-modal-icon-green {
          background: rgba(27,107,74,0.1); border: 1px solid rgba(27,107,74,0.12);
          color: var(--emerald);
        }
        .am-modal-icon-blue {
          background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.12);
          color: #2563EB;
        }
        .am-modal-title { font-weight: 800; font-size: 16px; color: var(--charcoal); line-height: 1.3; }
        .am-modal-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 1px; }
        .am-modal-close {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid var(--border); background: white;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-muted); transition: all 0.15s;
          flex-shrink: 0;
        }
        .am-modal-close:hover { background: var(--ivory); color: var(--charcoal); }

        .am-modal-body {
          padding: 1.5rem; overflow-y: auto;
          display: flex; flex-direction: column; gap: 0;
        }

        /* ====================== FORM ====================== */
        .am-form-section {
          display: flex; flex-direction: column; gap: 1rem;
          padding: 0.25rem 0;
        }
        .am-form-section-title {
          font-weight: 800; font-size: 13px; color: var(--charcoal);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .am-form-section-desc {
          font-size: 12px; color: var(--text-muted); margin-top: -0.5rem;
        }
        .am-form-divider {
          height: 1px; background: var(--border); margin: 1.25rem 0;
        }
        .am-field { display: flex; flex-direction: column; gap: 6px; }
        .am-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
        .am-label {
          font-size: 12px; font-weight: 700; color: var(--text-muted);
        }
        .am-req { color: #EF4444; }
        .am-optional { font-weight: 500; opacity: 0.7; }
        .am-input {
          width: 100%; padding: 0.75rem 1rem;
          border-radius: 12px; border: 1.5px solid var(--border);
          background: white; font-size: 14px; font-family: inherit;
          color: var(--charcoal); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .am-input::placeholder { color: #C4C9D0; }
        .am-input:focus {
          border-color: var(--emerald);
          box-shadow: 0 0 0 3px rgba(27,107,74,0.08);
        }
        .am-textarea { resize: vertical; min-height: 60px; }
        .am-select { appearance: none; cursor: pointer; }

        .am-input-prefix-wrap {
          position: relative; display: flex; align-items: center;
        }
        .am-input-prefix {
          position: absolute; left: 1rem;
          font-size: 14px; font-weight: 700; color: var(--text-muted);
          pointer-events: none;
        }
        .am-input-with-prefix { padding-left: 2.75rem; }

        /* ====================== CHECKLIST ====================== */
        .am-checklist-wrap {
          display: flex; flex-direction: column; gap: 6px;
          max-height: 220px; overflow-y: auto;
          border: 1.5px solid var(--border); padding: 8px;
          border-radius: 14px; background: var(--ivory);
        }
        .am-checklist-item {
          display: flex; align-items: center; gap: 0.75rem;
          background: white; padding: 0.75rem 0.875rem;
          border-radius: 10px; cursor: pointer;
          border: 1.5px solid transparent; transition: all 0.15s;
        }
        .am-checklist-item:hover { border-color: #E2E8F0; }
        .am-checklist-selected { border-color: #3B82F6 !important; background: #F8FAFF; }
        .am-checkbox { accent-color: #2563EB; width: 18px; height: 18px; flex-shrink: 0; cursor: pointer; }
        .am-checklist-info { flex: 1; min-width: 0; }
        .am-checklist-name { font-weight: 700; font-size: 13px; color: var(--charcoal); }
        .am-checklist-meta {
          font-size: 11px; color: var(--text-muted);
          display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-top: 2px;
        }
        .am-checklist-sep { opacity: 0.5; }
        .am-checklist-loc { display: inline-flex; align-items: center; gap: 3px; }
        .am-checklist-empty { padding: 1.5rem; text-align: center; font-size: 13px; color: var(--text-muted); }
        .am-checklist-count {
          font-size: 12px; color: var(--text-muted); margin-top: 0.5rem;
        }

        /* ====================== MODAL FOOTER ====================== */
        .am-modal-footer {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 0.625rem; padding-top: 1.5rem; margin-top: 1rem;
          border-top: 1px solid var(--border);
        }

        /* ====================== MOBILE ====================== */
        @media (max-width: 768px) {
          .am-root { gap: 1rem; }
          .am-hero { padding: 1.25rem; }
          .am-hero-count { font-size: 1.75rem; }
          .am-hero-icon { width: 44px; height: 44px; border-radius: 13px; }
          .am-hero-icon svg { width: 22px; height: 22px; }

          .am-card-hdr {
            flex-direction: column; align-items: flex-start;
            padding: 1.125rem 1.25rem; gap: 0.875rem;
          }
          .am-card-hdr-right {
            width: 100%; display: grid; grid-template-columns: 1fr; gap: 0.5rem;
          }
          .am-btn { width: 100%; }

          .am-row { padding: 0.875rem 1.25rem; gap: 0.625rem; }
          .am-row-idx { display: none; }
          .am-col-desktop { display: none !important; }
          .am-row-name { font-size: 13px; }
          .am-chip-desc { display: none; }

          .am-pager { padding: 0.75rem 1.25rem; }

          .am-overlay { padding: 0; align-items: flex-end; }
          .am-modal {
            border-bottom-left-radius: 0; border-bottom-right-radius: 0;
            max-width: 100%; max-height: 92vh;
            animation: am-slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .am-modal-hdr { padding: 1.125rem 1.25rem; }
          .am-modal-body { padding: 1.25rem; }
          .am-field-row { grid-template-columns: 1fr; }

          .am-tab-btn { font-size: 12px; padding: 10px 12px; }
        }
        @keyframes am-slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </>
  );
}
