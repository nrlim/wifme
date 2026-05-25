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
      <div className="flex flex-col gap-6 w-full">

        {/* ─── TABS NAV ─── */}
        <div className="flex gap-2 border-b border-[var(--border)] pb-3">
          <button
            onClick={() => setActiveTab("satuan")}
            className={`px-5 py-2.5 rounded-full font-bold text-sm border-none cursor-pointer transition-all duration-200 ${activeTab === "satuan" ? "bg-[var(--charcoal)] text-white" : "bg-transparent text-[var(--text-muted)]"}`}
          >
            Kegiatan Satuan
          </button>
          <button
            onClick={() => setActiveTab("paket")}
            className={`px-5 py-2.5 rounded-full font-bold text-sm border-none cursor-pointer transition-all duration-200 ${activeTab === "paket" ? "bg-[var(--charcoal)] text-white" : "bg-transparent text-[var(--text-muted)]"}`}
          >
            Paket Bundling
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB KEGIATAN SATUAN */}
        {/* ========================================================= */}
        {activeTab === "satuan" && (
          <>
            <div className="bg-gradient-to-br from-[#0d2818] via-[#1B6B4A] to-[#27956A] rounded-[20px] py-7 px-8 flex items-center justify-between flex-wrap gap-4 shadow-[0_8px_32px_rgba(27,107,74,0.2)]">
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-white/10 flex items-center justify-center border border-white/15">
                  <Layers size={26} color="white" />
                </div>
                <div>
                  <div className="text-white/60 text-xs font-bold tracking-[0.05em] uppercase">Total Kegiatan Terdaftar</div>
                  <div className="text-white text-4xl font-black leading-[1.1]">{totalActItems}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] border border-[var(--border)] shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="py-[1.375rem] px-7 border-b border-[var(--border)] flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-[38px] h-[38px] rounded-[11px] bg-gradient-to-br from-[var(--emerald-pale)] to-[rgba(27,107,74,0.15)] flex items-center justify-center text-[var(--emerald)]">
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <div className="font-extrabold text-base text-[var(--charcoal)]">Katalog Kegiatan Master</div>
                    <div className="text-xs text-[var(--text-muted)] mt-[2px]">Anda bisa <strong className="text-[var(--charcoal)]">drag & drop</strong> baris tabel untuk mengatur urutan.</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {hasReorderedAct && (
                    <button type="button" onClick={handleSaveReorderAct} disabled={isReorderingAct} className="act-save-btn inline-flex items-center gap-2 px-5 py-2.5 bg-white text-green-600 border border-green-600 rounded-xl font-bold text-sm cursor-pointer shadow-[0_4px_14px_rgba(22,163,74,0.15)] disabled:opacity-50">
                      <Save size={16} /> {isReorderingAct ? "Menyimpan..." : "Simpan Urutan"}
                    </button>
                  )}
                  <button type="button" onClick={() => { resetActForm(); setShowActModal(true); }} className="act-add-btn inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#1B6B4A] to-[#27956A] text-white border-none rounded-xl font-bold text-sm cursor-pointer shadow-[0_4px_14px_rgba(27,107,74,0.3)] transition-all hover:opacity-90 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(27,107,74,0.35)]">
                    <Plus size={16} /> Tambah Kegiatan
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-[#FAFAFA]">
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.08em] w-14 text-center">Urut</th>
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.08em] text-left">Info Kegiatan</th>
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.08em] text-left">Biaya & Wilayah</th>
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.08em] text-center">Status</th>
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.08em] text-right w-[140px]">Aksi</th>
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
                        <td colSpan={5} className="py-16 px-4 text-center">
                          <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" />
                          <div className="font-bold text-[var(--charcoal)] text-[15px]">Belum Ada Kegiatan Terdaftar</div>
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
                          className="act-row border-t border-[var(--border)] cursor-grab bg-white hover:bg-[#FAFAFA] transition-colors"
                          whileDrag={{ scale: 1.01, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", background: "#f8fafc", position: "relative", zIndex: 10 }}
                        >
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <GripVertical size={16} color="#CBD5E1" className="cursor-grab" />
                              <div className="w-7 h-7 rounded-lg bg-[var(--ivory)] border border-[var(--border)] flex items-center justify-center text-xs font-extrabold text-[var(--text-muted)]">
                                {globalIdx}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-[15px] text-[var(--charcoal)]">{act.name}</div>
                            <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-2">
                              <span className="flex items-center gap-1"><Clock size={12} /> {act.duration || "—"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-[15px] text-[var(--emerald)]">Rp {act.price.toLocaleString("id-ID")}</div>
                            <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                              <MapPin size={12} /> {act.location === "BOTH" ? "Makkah & Madinah" : act.location || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${act.isActive ? "bg-[var(--emerald-pale)] text-[var(--emerald)] border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full inline-block ${act.isActive ? "bg-[var(--emerald)]" : "bg-red-500"}`} />
                              {act.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
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

              <div className="px-6 py-3.5 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
                <span className="text-[13px] text-[var(--text-muted)]">
                  {totalActItems === 0 ? "Tidak ada data" : <>Halaman <strong className="text-[var(--charcoal)]">{safeActPage}</strong> dari <strong className="text-[var(--charcoal)]">{totalActPages}</strong></>}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentActPage(p => Math.max(1, p - 1))} disabled={safeActPage === 1} className={`px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors ${safeActPage === 1 ? "bg-[var(--ivory)] cursor-not-allowed" : "bg-white cursor-pointer hover:bg-slate-50"}`}>←</button>
                  <button onClick={() => setCurrentActPage(p => Math.min(totalActPages, p + 1))} disabled={safeActPage === totalActPages} className={`px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors ${safeActPage === totalActPages ? "bg-[var(--ivory)] cursor-not-allowed" : "bg-white cursor-pointer hover:bg-slate-50"}`}>→</button>
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
            <div className="bg-gradient-to-br from-blue-900 via-blue-600 to-blue-500 rounded-[20px] py-7 px-8 flex items-center justify-between flex-wrap gap-4 shadow-[0_8px_32px_rgba(37,99,235,0.2)]">
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-white/10 flex items-center justify-center border border-white/15">
                  <Package size={26} color="white" />
                </div>
                <div>
                  <div className="text-white/60 text-xs font-bold tracking-[0.05em] uppercase">Total Paket Terdaftar</div>
                  <div className="text-white text-4xl font-black leading-[1.1]">{totalBundleItems}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] border border-[var(--border)] shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="py-[1.375rem] px-7 border-b border-[var(--border)] flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-[38px] h-[38px] rounded-[11px] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600">
                    <Package size={18} />
                  </div>
                  <div>
                    <div className="font-extrabold text-base text-[var(--charcoal)]">Katalog Paket (Bundling)</div>
                    <div className="text-xs text-[var(--text-muted)] mt-[2px]">Anda bisa <strong className="text-[var(--charcoal)]">drag & drop</strong> baris tabel untuk mengatur urutan.</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {hasReordered && (
                    <button type="button" onClick={handleSaveReorder} disabled={isReordering} className="bundle-save-btn inline-flex items-center gap-2 px-5 py-2.5 bg-white text-green-600 border border-green-600 rounded-xl font-bold text-sm cursor-pointer shadow-[0_4px_14px_rgba(22,163,74,0.15)] disabled:opacity-50">
                      <Save size={16} /> {isReordering ? "Menyimpan..." : "Simpan Urutan"}
                    </button>
                  )}
                  <button type="button" onClick={() => { resetBundleForm(); setShowBundleModal(true); }} className="bundle-add-btn inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-blue-800 to-blue-600 text-white border-none rounded-xl font-bold text-sm cursor-pointer shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all hover:opacity-90 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)]">
                    <Plus size={16} /> Tambah Paket
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-[#FAFAFA]">
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.08em] w-14 text-center">Urut</th>
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.08em] text-left">Nama Paket & Isi</th>
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.08em] text-left">Harga Paket</th>
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.08em] text-center">Status</th>
                      <th className="px-6 py-3 text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.08em] text-right w-[140px]">Aksi</th>
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
                        <td colSpan={5} className="py-16 px-4 text-center">
                          <Package size={40} className="mx-auto text-slate-300 mb-3" />
                          <div className="font-bold text-[var(--charcoal)] text-[15px]">Belum Ada Paket Terdaftar</div>
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
                          className="act-row border-t border-[var(--border)] cursor-grab bg-white hover:bg-[#FAFAFA] transition-colors"
                          whileDrag={{ scale: 1.01, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", background: "#f8fafc", position: "relative", zIndex: 10 }}
                        >
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <GripVertical size={16} color="#CBD5E1" className="cursor-grab" />
                              <div className="w-7 h-7 rounded-lg bg-[var(--ivory)] border border-[var(--border)] flex items-center justify-center text-xs font-extrabold text-[var(--text-muted)]">
                                {globalIdx}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-[15px] text-[var(--charcoal)]">{bdl.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                              Terdiri dari: <strong className="text-[var(--charcoal)]">{bdl.items.length} kegiatan</strong>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-[15px] text-blue-600">Rp {bdl.price.toLocaleString("id-ID")}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${bdl.isActive ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full inline-block ${bdl.isActive ? "bg-blue-500" : "bg-red-500"}`} />
                              {bdl.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
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

              <div className="px-6 py-3.5 border-t border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
                <span className="text-[13px] text-[var(--text-muted)]">
                  {totalBundleItems === 0 ? "Tidak ada data" : <>Halaman <strong className="text-[var(--charcoal)]">{safeBundlePage}</strong> dari <strong className="text-[var(--charcoal)]">{totalBundlePages}</strong></>}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentBundlePage(p => Math.max(1, p - 1))} disabled={safeBundlePage === 1} className={`px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors ${safeBundlePage === 1 ? "bg-[var(--ivory)] cursor-not-allowed" : "bg-white cursor-pointer hover:bg-slate-50"}`}>←</button>
                  <button onClick={() => setCurrentBundlePage(p => Math.min(totalBundlePages, p + 1))} disabled={safeBundlePage === totalBundlePages} className={`px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors ${safeBundlePage === totalBundlePages ? "bg-[var(--ivory)] cursor-not-allowed" : "bg-white cursor-pointer hover:bg-slate-50"}`}>→</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── MODAL KEGIATAN SATUAN ─── */}
      {showActModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowActModal(false); resetActForm(); } }} className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] w-full max-w-[540px] shadow-[0_24px_80px_rgba(0,0,0,0.2)] overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-br from-green-50 to-green-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(27,107,74,0.1)] border border-[rgba(27,107,74,0.15)] flex items-center justify-center text-[var(--emerald)]">
                  {actEditingId ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <div className="font-extrabold text-base text-[var(--charcoal)]">{actEditingId ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Konfigurasi detail kegiatan satuan</div>
                </div>
              </div>
              <button type="button" onClick={() => { setShowActModal(false); resetActForm(); }} className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-black/5 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveAct} className="p-6 flex flex-col gap-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2"><label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Nama Kegiatan *</label><input type="text" required value={actName} onChange={e => setActName(e.target.value)} disabled={isSavingAct} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--emerald)] bg-white transition-all font-inherit" /></div>
                <div className="col-span-1 md:col-span-2"><label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Deskripsi Opsional</label><textarea value={actDesc} onChange={e => setActDesc(e.target.value)} disabled={isSavingAct} rows={2} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--emerald)] bg-white transition-all font-inherit resize-y" /></div>
                <div><label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Estimasi Durasi (misal: 2 Jam)</label><input type="text" value={actDuration} onChange={e => setActDuration(e.target.value)} disabled={isSavingAct} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--emerald)] bg-white transition-all font-inherit" /></div>
                <div><label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Wilayah Layanan</label><select value={actLocation} onChange={e => setActLocation(e.target.value)} disabled={isSavingAct} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--emerald)] bg-white transition-all font-inherit"><option value="">Pilih Lokasi...</option><option value="MAKKAH">Makkah</option><option value="MADINAH">Madinah</option><option value="BOTH">Keduanya (Makkah & Madinah)</option></select></div>
                <div className="col-span-1 md:col-span-2"><label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Harga Dasar Kegiatan *</label><input type="number" required value={actPrice} onChange={e => setActPrice(e.target.value)} disabled={isSavingAct} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--emerald)] bg-white transition-all font-inherit" /></div>
              </div>
              <div className="flex justify-end mt-4 border-t border-[var(--border)] pt-6">
                <button type="submit" disabled={isSavingAct || !actName} className="px-6 py-3 rounded-xl bg-[var(--charcoal)] text-white font-bold cursor-pointer border-none hover:bg-black transition-colors disabled:opacity-50">{isSavingAct ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL PAKET BUNDLING ─── */}
      {showBundleModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowBundleModal(false); resetBundleForm(); } }} className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] w-full max-w-[640px] shadow-[0_24px_80px_rgba(0,0,0,0.2)] overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-br from-blue-50 to-blue-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100/50 border border-blue-200/50 flex items-center justify-center text-blue-600">
                  {bundleEditingId ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <div className="font-extrabold text-base text-[var(--charcoal)]">{bundleEditingId ? "Edit Paket Bundling" : "Buat Paket Bundling"}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Satu paket berisi kombinasi dari kegiatan master</div>
                </div>
              </div>
              <button type="button" onClick={() => { setShowBundleModal(false); resetBundleForm(); }} className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-black/5 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveBundle} className="p-6 flex flex-col gap-5 overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2"><label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Nama Paket *</label><input type="text" required value={bundleName} onChange={e => setBundleName(e.target.value)} disabled={isSavingBundle} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--emerald)] bg-white transition-all font-inherit" /></div>
                <div className="col-span-1 md:col-span-2"><label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Deskripsi / Ringkasan</label><textarea value={bundleDesc} onChange={e => setBundleDesc(e.target.value)} disabled={isSavingBundle} rows={2} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--emerald)] bg-white transition-all font-inherit resize-y" /></div>
                <div className="col-span-1 md:col-span-2"><label className="block text-xs font-bold text-[var(--text-muted)] mb-2">Harga Paket (Diskon) *</label><input type="number" required value={bundlePrice} onChange={e => setBundlePrice(e.target.value)} disabled={isSavingBundle} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--emerald)] bg-white transition-all font-inherit" /></div>
              </div>

              {/* Pilih Kegiatan didalam Paket */}
              <div className="mt-2">
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-3 uppercase tracking-[0.05em]">Pilih Kegiatan ke dalam Paket</label>
                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto border border-[var(--border)] p-2 rounded-xl bg-[var(--ivory)]">
                  {activities.map(act => (
                    <label key={act.id} className={`flex items-center gap-3 bg-white p-3 rounded-lg cursor-pointer border transition-colors ${bundleActivityIds.includes(act.id) ? "border-blue-500" : "border-[var(--border)]"}`}>
                      <input type="checkbox" checked={bundleActivityIds.includes(act.id)} onChange={() => toggleBundleActivity(act.id)} disabled={isSavingBundle} className="accent-blue-600 w-4 h-4" />
                      <div className="flex-1">
                        <div className="font-bold text-sm text-[var(--charcoal)]">{act.name}</div>
                        <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 flex-wrap">
                          <span>Rp {act.price.toLocaleString("id-ID")}</span>
                          <span>·</span>
                          <span>{act.duration || "Tanpa durasi"}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={10} /> {act.location === "BOTH" ? "Makkah & Madinah" : act.location || "—"}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                  {activities.length === 0 && (
                    <div className="p-4 text-center text-[13px] text-[var(--text-muted)]">Belum ada kegiatan master yang tersedia.</div>
                  )}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-2">
                  Terpilih: {bundleActivityIds.length} Kegiatan
                </div>
              </div>

              <div className="flex justify-end mt-4 border-t border-[var(--border)] pt-6">
                <button type="submit" disabled={isSavingBundle || !bundleName || bundleActivityIds.length === 0} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold cursor-pointer border-none hover:bg-blue-700 transition-colors disabled:opacity-50">{isSavingBundle ? "Menyimpan..." : "Simpan Paket"}</button>
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
