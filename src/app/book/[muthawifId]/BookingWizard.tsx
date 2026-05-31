"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Activity, Prisma } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers3,
  ListChecks,
  MapPin,
  Package,
  X,
} from "lucide-react";
import VoucherPicker, { type PromoSelection } from "@/components/VoucherPicker";
import { calcServiceFee, calcTotalWithFee, type FeeConfig } from "@/lib/fee";

type BundleType = Prisma.ActivityBundleGetPayload<{
  include: { items: { include: { activity: true } } };
}>;

interface Props {
  muthawifId: string;
  muthawifName: string;
  activities: Activity[];
  bundles: BundleType[];
  feeConfig: FeeConfig;
  availabilities?: { date: Date; status: string }[];
  bookedItems?: { date: Date }[];
  initialLocation?: string;
  onClose?: () => void;
}

interface BookingResponse {
  booking?: { id?: string };
  error?: string;
}

const C = {
  emerald: "#1B6B4A",
  emeraldLight: "#27956A",
  emeraldPale: "#EBF5EF",
  blue: "#2563eb",
  bluePale: "#eff6ff",
  gold: "#C4973B",
  charcoal: "#2C2C2C",
  muted: "#6F6A63",
  border: "#E0D8CC",
  ivory: "#FAF7F2",
  white: "#FFFFFF",
  error: "#C0392B",
  errorBg: "#FEF2F2",
};

const formatCurrency = (value: number) => `Rp ${Math.round(value).toLocaleString("id-ID")}`;

const formatBookingDate = (value: string) =>
  new Date(value).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const MONTH_NAMES_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAY_SHORT_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const formatDurationDays = (days: number) => `${days} hari`;

const getBundleDurationDays = (bundle: BundleType) =>
  bundle.items.reduce((sum, item) => sum + item.activity.durationDays, 0);

const addDaysToDateInput = (value: string, days: number) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function BookingWizard({
  muthawifId,
  muthawifName,
  activities,
  bundles,
  feeConfig,
  availabilities,
  bookedItems,
  initialLocation,
  onClose,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [actTab, setActTab] = useState<"satuan" | "paket">("satuan");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>(
    initialLocation === "Makkah" || initialLocation === "Madinah" ? initialLocation : "ALL"
  );

  const [itemDates, setItemDates] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [voucher, setVoucher] = useState<PromoSelection | null>(null);
  const [error, setError] = useState("");

  const selectedActivities = useMemo(() => {
    return Array.from(selectedIds)
      .map(id => activities.find(a => a.id === id))
      .filter((a): a is Activity => a !== undefined);
  }, [activities, selectedIds]);

  const filteredActivities = useMemo(() => {
    if (locationFilter === "ALL") return activities;
    return activities.filter(a => a.location === locationFilter);
  }, [activities, locationFilter]);

  const filteredBundles = useMemo(() => {
    if (locationFilter === "ALL") return bundles;
    return bundles.filter(b => b.items.some(i => i.activity.location === locationFilter));
  }, [bundles, locationFilter]);

  const selectedBundle = useMemo(() => {
    if (!selectedBundleId) return null;
    return bundles.find((bundle) => bundle.id === selectedBundleId) ?? null;
  }, [bundles, selectedBundleId]);

  const basePrice = useMemo(() => {
    if (selectedBundle) return selectedBundle.price;
    return selectedActivities.reduce((sum, activity) => sum + activity.price, 0);
  }, [selectedActivities, selectedBundle]);

  const scheduledActivities = useMemo(() => {
    if (selectedActivities.length === 0) return [];

    // Auto-fill dates starting from tomorrow if not explicitly set
    const tomorrowStr = addDaysToDateInput(new Date().toISOString().split("T")[0], 1);
    let currentSequentialDate = tomorrowStr;

    return selectedActivities.map((activity) => {
      const customDateStr = itemDates[activity.id];
      let assignedDate = customDateStr || currentSequentialDate;

      currentSequentialDate = addDaysToDateInput(assignedDate, activity.durationDays);

      return {
        ...activity,
        assignedDate,
      };
    });
  }, [selectedActivities, itemDates]);

  const durationDays = selectedActivities.reduce((sum, activity) => sum + activity.durationDays, 0);
  const serviceFee = calcServiceFee(basePrice, 1, feeConfig);
  const subtotal = calcTotalWithFee(basePrice, 1, feeConfig);

  const computedStartDate = scheduledActivities.length > 0
    ? scheduledActivities.reduce((min, act) => act.assignedDate < min ? act.assignedDate : min, scheduledActivities[0].assignedDate)
    : "";

  const computedEndDate = scheduledActivities.length > 0
    ? scheduledActivities.reduce((max, act) => {
      const actEnd = addDaysToDateInput(act.assignedDate, act.durationDays);
      return actEnd > max ? actEnd : max;
    }, scheduledActivities[0].assignedDate)
    : "";

  // Conflict validation: check if any scheduled activity date clashes with bookedItems or availabilities
  const dateConflictError = useMemo(() => {
    if (scheduledActivities.length === 0) return null;

    for (const activity of scheduledActivities) {
      for (let i = 0; i < activity.durationDays; i++) {
        const actDate = addDaysToDateInput(activity.assignedDate, i);

        if (bookedItems) {
          for (const item of bookedItems) {
            const bDateString = new Date(item.date).toISOString().split("T")[0];
            if (bDateString === actDate) {
              return `Kegiatan "${activity.name}" di tanggal ${formatBookingDate(actDate)} bentrok dengan pesanan jamaah lain.`;
            }
          }
        }

        if (availabilities) {
          for (const avail of availabilities) {
            const aDateString = new Date(avail.date).toISOString().split("T")[0];
            if (aDateString === actDate) {
              if (avail.status === "OFF" || avail.status === "BOOKED") {
                return `Muthawif tidak tersedia pada tanggal ${formatBookingDate(actDate)} untuk kegiatan "${activity.name}".`;
              }
            }
          }
        }
      }
    }

    return null;
  }, [scheduledActivities, bookedItems, availabilities]);

  const discountAmt = (() => {
    if (!voucher) return 0;
    const promo = voucher.promo;
    if (subtotal < promo.minBookingAmount) return 0;
    if (promo.type === "FIXED_AMOUNT") return Math.min(promo.value, subtotal);
    return Math.round(subtotal * (promo.value / 100));
  })();

  const totalAfterDiscount = Math.max(0, subtotal - discountAmt);
  const todayStr = new Date().toISOString().split("T")[0];

  const toggleActivity = (id: string) => {
    if (selectedBundleId) {
      setSelectedBundleId(null);
      setSelectedIds(new Set([id]));
      setError("");
      return;
    }

    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      setVoucher(null);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
    setError("");
  };

  const selectBundle = (bundle: BundleType) => {
    setSelectedBundleId(bundle.id);
    setSelectedIds(new Set(bundle.items.map((item) => item.activityId)));
    setError("");
  };


  const handleNext = () => {
    if (step === 1) {
      if (selectedIds.size === 0) {
        setError("Pilih setidaknya satu kegiatan atau paket untuk dilanjutkan.");
        return;
      }
      setError("");
      setStep(2);
      return;
    }

    if (step === 2) {
      // Pastikan semua kegiatan memiliki tanggal (walaupun sudah ada default)
      if (scheduledActivities.some(a => !a.assignedDate)) {
        setError("Pilih tanggal untuk semua kegiatan sebelum melanjutkan.");
        return;
      }
      if (computedStartDate < todayStr) {
        setError("Tanggal kegiatan tidak boleh di masa lalu.");
        return;
      }
      if (dateConflictError) {
        setError(dateConflictError);
        return;
      }

      setError("");
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
      setError("");
      return;
    }
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleBook = () => {
    if (step !== 3) return;
    setError("");

    const items = scheduledActivities.map((activity) => ({
      activityId: activity.id,
      date: activity.assignedDate,
    }));

    startTransition(async () => {
      try {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            muthawifId,
            items,
            notes,
            bundleId: selectedBundleId,
            promoCode: voucher?.code,
          }),
        });
        const data = (await res.json()) as BookingResponse;
        if (!res.ok) {
          setError(data.error || "Gagal membuat pesanan.");
          return;
        }
        if (data.booking?.id) {
          router.push(`/booking/${data.booking.id}`);
          return;
        }
        router.push("/dashboard");
      } catch {
        setError("Terjadi kesalahan jaringan. Coba lagi.");
      }
    });
  };

  return (
    <div className="booking-page-shell">
      <div className="booking-header">
        <div>
          <p className="booking-eyebrow">Pesan Pemandu</p>
          <h1 className="booking-title">Rancang perjalanan bersama {muthawifName}</h1>
          <p className="booking-subtitle">Pilih kegiatan atau paket bundling, lalu atur jadwalnya dengan alur yang ringkas.</p>
        </div>
        <button id="booking-close-page-button" type="button" onClick={handleBack} className="icon-button close-page-button" aria-label="Tutup dan kembali">
          <X size={22} color={C.charcoal} />
        </button>
      </div>

      <div className="stepper" aria-label="Progress pemesanan">
        {[1, 2, 3].map((item) => (
          <div key={item} className={`stepper-item ${step >= item ? "active" : ""} ${item === 3 ? "last" : ""}`}>
            <span className="stepper-dot">
              {step > item ? (
                <CheckCircle2 size={14} />
              ) : (
                item
              )}
            </span>
            {item < 3 && <div className="stepper-line" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.section key="step1" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
            <div className="selection-hero">
              <div className="selection-hero-copy">
                <span className="section-kicker">Langkah 1</span>
                <h2>Pilih Kegiatan atau Paket Bundling</h2>
                <p>
                  Pilih kegiatan satuan atau paket bundling dari daftar di bawah. Timeline membantu Anda membandingkan rute dan harga dengan mudah.
                </p>
              </div>
            </div>

            <div style={{ padding: "0 0 1rem 0" }}>
              <label htmlFor="location-filter" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                Filter Lokasi
              </label>
              <select
                id="location-filter"
                className="form-input form-select"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="ALL">Semua Lokasi</option>
                {Array.from(new Set(activities.map(a => a.location).filter(Boolean))).map((loc) => (
                  <option key={loc} value={loc as string}>{loc === "BOTH" ? "Makkah & Madinah" : loc}</option>
                ))}
              </select>
            </div>

            {bundles.length > 0 && (
              <div className="picker-tabs" role="tablist" aria-label="Jenis pilihan kegiatan" style={{ padding: "0 0 1rem 0" }}>
                <button id="booking-tab-satuan" type="button" role="tab" aria-selected={actTab === "satuan"} className={actTab === "satuan" ? "active" : ""} onClick={() => setActTab("satuan")}>
                  <ListChecks size={16} />
                  Kegiatan Satuan
                </button>
                <button id="booking-tab-paket" type="button" role="tab" aria-selected={actTab === "paket"} className={actTab === "paket" ? "active blue" : ""} onClick={() => setActTab("paket")}>
                  <Layers3 size={16} />
                  Paket Bundling
                </button>
              </div>
            )}

            <div className="picker-content" style={{ padding: "0 0 1.5rem 0" }}>
              {actTab === "satuan" && (
                <div className="timeline-picker-list">
                  {filteredActivities.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>Tidak ada kegiatan untuk lokasi ini.</div>
                  ) : filteredActivities.map((activity, index) => {
                    const isSelected = selectedIds.has(activity.id) && !selectedBundleId;
                    return (
                      <button
                        id={`booking-activity-option-${activity.id}`}
                        key={activity.id}
                        type="button"
                        onClick={() => toggleActivity(activity.id)}
                        className={`timeline-option ${isSelected ? "selected" : ""}`}
                        aria-pressed={isSelected}
                      >
                        <span className="timeline-rail"><span>{index + 1}</span></span>
                        <span className="timeline-option-body">
                          <span className="option-title-row">
                            <strong>{activity.name}</strong>
                            <b>{formatCurrency(activity.price)}</b>
                          </span>
                          <span className="option-description">{activity.description}</span>
                          <span className="option-meta-row">
                            {activity.location && (
                              <span><MapPin size={13} />{activity.location === "BOTH" ? "Makkah & Madinah" : activity.location}</span>
                            )}
                            <span><Clock size={13} />{formatDurationDays(activity.durationDays)}</span>
                          </span>
                        </span>
                        {isSelected && <CheckCircle2 className="selected-check" size={20} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {actTab === "paket" && (
                <div className="timeline-picker-list">
                  {filteredBundles.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>Tidak ada paket bundling untuk lokasi ini.</div>
                  ) : filteredBundles.map((bundle, index) => {
                    const isSelected = selectedBundleId === bundle.id;
                    return (
                      <button
                        id={`booking-bundle-option-${bundle.id}`}
                        key={bundle.id}
                        type="button"
                        onClick={() => selectBundle(bundle)}
                        className={`timeline-option bundle ${isSelected ? "selected blue" : ""}`}
                        aria-pressed={isSelected}
                      >
                        <span className="timeline-rail blue"><span>{index + 1}</span></span>
                        <span className="timeline-option-body">
                          <span className="option-title-row">
                            <strong>{bundle.name}</strong>
                            <b>{formatCurrency(bundle.price)}</b>
                          </span>
                          <span className="option-description">{bundle.description}</span>
                          <span className="option-meta-row">
                            <span><Clock size={13} />{formatDurationDays(getBundleDurationDays(bundle))}</span>
                          </span>
                          <span className="bundle-mini-list">
                            {bundle.items.map((item, itemIndex) => (
                              <span key={item.id}><i>{itemIndex + 1}</i>{item.activity.name} · {formatDurationDays(item.activity.durationDays)}</span>
                            ))}
                          </span>
                        </span>
                        {isSelected && <CheckCircle2 className="selected-check blue" size={20} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="selected-summary-card">
              <div className="summary-card-head">
                <div>
                  <span className="section-kicker">Pilihan saat ini</span>
                  <h3>{selectedBundle ? selectedBundle.name : selectedActivities.length > 0 ? `${selectedActivities.length} kegiatan satuan` : "Belum ada pilihan"}</h3>
                </div>
                <span className={selectedBundle ? "summary-badge blue" : "summary-badge"}>
                  {selectedBundle ? "Paket Bundling" : selectedActivities.length > 0 ? "Kegiatan Satuan" : "Belum dipilih"}
                </span>
              </div>

              {selectedActivities.length > 0 ? (
                <>
                  <div className="mini-timeline">
                    {selectedActivities.map((activity, index) => (
                      <div key={activity.id} className="mini-timeline-row">
                        <span className="mini-timeline-dot">{index + 1}</span>
                        <div>
                          <strong>{activity.name}</strong>
                          <span>{activity.location === "BOTH" ? "Makkah & Madinah" : activity.location || "Lokasi menyesuaikan"} · {formatDurationDays(activity.durationDays)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="summary-total-row">
                    <span>Estimasi pilihan</span>
                    <strong>{formatCurrency(basePrice)}</strong>
                  </div>
                </>
              ) : (
                <div className="empty-selection">
                  <Package size={20} />
                  <p>Tekan tombol Buka Pilihan untuk memilih kegiatan atau paket bundling.</p>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section key="step2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
            <div className="section-heading">
              <span className="section-kicker">Langkah 2</span>
              <h2>Tentukan Tanggal Kegiatan</h2>
              <p>Atur tanggal untuk masing-masing kegiatan. Tanggal yang bentrok dengan pesanan lain akan otomatis ditandai error saat Anda mencoba melanjutkan.</p>
            </div>

            <div className="panel-card schedule-panel">
              <div className="duration-breakdown">
                <div className="panel-label">Jadwal Kegiatan (Total {formatDurationDays(durationDays)})</div>
                {scheduledActivities.map((activity, index) => (
                  <div key={activity.id} className="duration-row">
                    <span className="timeline-number">{index + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.name}</strong>
                      <p>{activity.location === "BOTH" ? "Makkah & Madinah" : activity.location || "Lokasi menyesuaikan"}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end', flexShrink: 0 }}>
                      <b>{formatDurationDays(activity.durationDays)}</b>
                      <input
                        type="date"
                        min={todayStr}
                        value={activity.assignedDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemDates(prev => ({ ...prev, [activity.id]: val }));
                        }}
                        style={{
                          fontSize: '0.85rem',
                          padding: '0.4rem 0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          background: 'var(--ivory)',
                          fontWeight: 700,
                          color: 'var(--emerald)',
                          cursor: 'pointer',
                          minWidth: '140px',
                          outline: 'none',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      />
                    </div>
                  </div>
                ))}
                {dateConflictError && (
                  <div style={{ color: "var(--error)", fontSize: "0.8125rem", marginTop: "1rem", fontWeight: 600, padding: "0.75rem", background: "var(--errorBg)", borderRadius: "8px" }}>
                    ⚠️ {dateConflictError}
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {step === 3 && (
          <motion.section key="step3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
            <div className="section-heading">
              <span className="section-kicker">Langkah 3</span>
              <h2>Konfirmasi Pesanan</h2>
              <p>Periksa kembali jadwal kegiatan dan rincian biaya sebelum melanjutkan pembayaran.</p>
            </div>

            <div className="confirmation-grid">
              <div className="panel-card">
                <div className="panel-label">Jadwal Perjalanan</div>
                <div className="trip-window-card">
                  <div>
                    <span>Mulai</span>
                    <strong>{formatBookingDate(computedStartDate)}</strong>
                  </div>
                  <div>
                    <span>Selesai</span>
                    <strong>{formatBookingDate(computedEndDate)}</strong>
                  </div>
                  <div>
                    <span>Total Kegiatan</span>
                    <strong>{formatDurationDays(durationDays)}</strong>
                  </div>
                </div>
                <div className="confirmation-timeline">
                  {scheduledActivities.map((activity, index) => (
                    <div key={activity.id} className="confirmation-row">
                      <span className="timeline-number">{index + 1}</span>
                      <div>
                        <h3>{activity.name}</h3>
                        <p>{formatBookingDate(activity.assignedDate)} · {formatDurationDays(activity.durationDays)}</p>
                      </div>
                      {!selectedBundleId && <strong>{formatCurrency(activity.price)}</strong>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-card cost-card">
                <div className="panel-label">Rincian Biaya</div>
                <div className="cost-list">
                  {selectedBundleId ? (
                    <div className="cost-row strong">
                      <span>Paket Terpilih</span>
                      <strong>{formatCurrency(basePrice)}</strong>
                    </div>
                  ) : (
                    <div className="cost-row">
                      <span>Subtotal ({selectedActivities.length} kegiatan)</span>
                      <strong>{formatCurrency(basePrice)}</strong>
                    </div>
                  )}
                  <div className="cost-row">
                    <span>Biaya Layanan</span>
                    <strong>{serviceFee > 0 ? formatCurrency(serviceFee) : "Gratis"}</strong>
                  </div>
                  <VoucherPicker estimatedTotal={subtotal} selected={voucher} onSelect={setVoucher} />
                  {voucher && discountAmt > 0 && (
                    <div className="cost-row discount">
                      <span>Diskon Voucher</span>
                      <strong>-{formatCurrency(discountAmt)}</strong>
                    </div>
                  )}
                  <div className="cost-total">
                    <span>Total Pembayaran</span>
                    <strong>{formatCurrency(totalAfterDiscount)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="notes-field">
              <label htmlFor="booking-notes-input">Catatan Tambahan (Opsional)</label>
              <textarea
                id="booking-notes-input"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Misal: Saya butuh kursi roda atau pendampingan khusus."
                rows={3}
              />
            </div>
          </motion.section>
        )}
      </AnimatePresence>



      <div className="booking-bottom-bar">
        <div className="bottom-bar-inner">
          <AnimatePresence>
            {error && (
              <motion.div className="error-banner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} role="alert">
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="bottom-bar-actions">
            {step > 1 && (
              <button
                id="booking-back-step-button"
                type="button"
                onClick={() => { setStep((step - 1) as 1 | 2 | 3); setError(""); }}
                className="secondary-action-button"
                disabled={isPending}
              >
                Kembali
              </button>
            )}
            <button id="booking-primary-action-button" type="button" onClick={step === 3 ? handleBook : handleNext} disabled={isPending} className="primary-action-button">
              {isPending ? "Memproses..." : step === 3 ? "Lanjut Bayar" : "Lanjutkan"}
              {step < 3 && <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .booking-page-shell {
          width: 100%;
          margin: 0 auto;
          padding: 1rem 1rem 0 1rem;
          display: flex;
          flex-direction: column;
          min-height: 100%;
        }
        .booking-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 44px;
          gap: 0.875rem;
          align-items: start;
          padding-top: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .close-page-button {
          justify-self: end;
        }
        .icon-button {
          width: 44px;
          height: 44px;
          border: 1px solid ${C.border};
          border-radius: 999px;
          background: ${C.white};
          color: ${C.charcoal};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(44, 44, 44, 0.06);
          touch-action: manipulation;
        }
        .booking-eyebrow,
        .section-kicker {
          margin: 0 0 0.25rem;
          color: ${C.gold};
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .booking-title {
          margin: 0;
          color: ${C.charcoal};
          font-size: clamp(1.35rem, 4vw, 2.35rem);
          line-height: 1.15;
          letter-spacing: -0.035em;
          font-weight: 900;
        }
        .booking-subtitle,
        .section-heading p,
        .selection-hero-copy p {
          margin: 0.5rem 0 0;
          color: ${C.muted};
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .stepper {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 1.25rem;
          padding: 0 0.25rem;
        }
        .stepper-item {
          display: flex;
          align-items: center;
          flex: 1;
          gap: 0;
          color: ${C.muted};
        }
        .stepper-item.last {
          flex: 0;
        }
        .stepper-dot {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: ${C.white};
          border: 1.5px solid ${C.border};
          font-size: 0.78rem;
          font-weight: 800;
          flex-shrink: 0;
          transition: all 0.25s;
        }
        .stepper-line {
          height: 2px;
          flex: 1;
          border-radius: 999px;
          background: ${C.border};
          transition: background 0.25s;
          margin: 0 4px;
        }
        .stepper-item.active .stepper-dot {
          background: ${C.emerald};
          border-color: ${C.emerald};
          color: ${C.white};
        }
        .stepper-item.active .stepper-line {
          background: ${C.emerald};
        }
        .selection-hero,
        .selected-summary-card,
        .panel-card,
        .notes-field {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid ${C.border};
          border-radius: 16px;
          box-shadow: 0 18px 45px rgba(27, 107, 74, 0.08);
        }
        .selection-hero {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          padding: 1rem 1.1rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, ${C.white}, ${C.emeraldPale});
        }
        .selection-hero-copy {
        }
        .selected-summary-card {
          margin-bottom: 2.5rem;
        }
        .selection-hero h2,
        .section-heading h2,
        .picker-head h2 {
          margin: 0;
          color: ${C.charcoal};
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }
        .primary-soft-button,
        .primary-action-button,
        .picker-footer button {
          min-height: 48px;
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight});
          color: ${C.white};
          font-weight: 900;
          font-size: 0.98rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          box-shadow: 0 14px 28px rgba(27, 107, 74, 0.22);
          touch-action: manipulation;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .selected-summary-card,
        .panel-card,
        .notes-field {
          padding: 1rem;
        }
        .panel-card {
          display: flex;
          flex-direction: column;
        }
        .summary-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .summary-card-head h3 {
          margin: 0;
          color: ${C.charcoal};
          font-size: 1.1rem;
          font-weight: 900;
        }
        .summary-badge {
          display: inline-flex;
          min-height: 32px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0.35rem 0.75rem;
          background: ${C.emeraldPale};
          color: ${C.emerald};
          font-size: 0.76rem;
          font-weight: 900;
          white-space: nowrap;
        }
        .summary-badge.blue {
          background: ${C.bluePale};
          color: ${C.blue};
        }
        .summary-total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 1rem;
          padding: 0.9rem 1rem;
          border-radius: 16px;
          background: ${C.ivory};
          border: 1px solid ${C.border};
        }
        .summary-total-row span {
          color: ${C.muted};
          font-size: 0.84rem;
          font-weight: 800;
        }
        .summary-total-row strong {
          color: ${C.emerald};
          font-size: 1rem;
          font-weight: 900;
          white-space: nowrap;
        }
        .schedule-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .schedule-card {
          display: grid;
          grid-template-columns: 28px 1fr;
          gap: 0.75rem;
          padding: 1rem 0;
          border-bottom: 1px solid ${C.border};
        }
        .schedule-card:first-child {
          padding-top: 0;
        }
        .schedule-card:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .mini-timeline-row {
          display: grid;
          grid-template-columns: 32px 1fr;
          gap: 0.75rem;
          align-items: start;
        }
        .mini-timeline-dot,
        .timeline-number,
        .schedule-index {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: ${C.emeraldPale};
          color: ${C.emerald};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 900;
        }
        .mini-timeline-row strong,
        .mini-timeline-row span:not(.mini-timeline-dot),
        .empty-selection p {
          display: block;
        }
        .mini-timeline-row strong {
          color: ${C.charcoal};
          font-size: 0.95rem;
        }
        .mini-timeline-row span:not(.mini-timeline-dot),
        .empty-selection p {
          color: ${C.muted};
          font-size: 0.85rem;
          line-height: 1.5;
          margin: 0.15rem 0 0;
        }
        .empty-selection {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.9rem;
          border-radius: 16px;
          background: ${C.ivory};
          color: ${C.emerald};
        }
        .section-heading {
          margin-bottom: 1rem;
        }
        .schedule-panel {
          padding: 1rem 1.1rem;
          margin-bottom: 1rem;
        }
        .single-date-card {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1rem;
          border: 1px solid ${C.border};
          border-radius: 18px;
          background: ${C.ivory};
          margin-bottom: 1rem;
        }
        .single-date-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight});
          flex-shrink: 0;
        }
        .single-date-content {
          flex: 1;
          min-width: 0;
        }
        .single-date-content label {
          display: block;
          font-size: 0.78rem;
          font-weight: 900;
          color: ${C.charcoal};
          margin-bottom: 0.45rem;
        }
        .single-date-input {
          width: 100%;
          min-height: 46px;
          border: 1px solid ${C.border};
          border-radius: 12px;
          padding: 0 0.9rem;
          font: inherit;
          font-weight: 700;
          color: ${C.charcoal};
          background: white;
        }
        .single-date-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 1rem;
          margin-top: 0.75rem;
          color: ${C.muted};
          font-size: 0.84rem;
        }
        .single-date-summary strong {
          color: ${C.emerald};
        }
        .duration-breakdown {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .duration-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.75rem;
          align-items: center;
          padding: 0.85rem;
          border: 1px solid ${C.border};
          border-radius: 12px;
          background: white;
        }
        .duration-row strong,
        .duration-row b {
          color: ${C.charcoal};
          font-size: 0.92rem;
        }
        .duration-row p {
          margin: 0.15rem 0 0;
          color: ${C.muted};
          font-size: 0.78rem;
        }
        .trip-window-card {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.7rem;
          margin-bottom: 1rem;
        }
        .trip-window-card div {
          border: 1px solid ${C.border};
          border-radius: 12px;
          padding: 0.85rem;
          background: ${C.ivory};
        }
        .trip-window-card span {
          display: block;
          color: ${C.muted};
          font-size: 0.72rem;
          font-weight: 800;
          margin-bottom: 0.35rem;
        }
        .trip-window-card strong {
          color: ${C.charcoal};
          font-size: 0.88rem;
        }
        .schedule-card {
          display: grid;
          grid-template-columns: 36px 1fr;
          gap: 0.85rem;
          padding: 1rem;
        }
        .schedule-content h3,
        .confirmation-row h3 {
          margin: 0 0 0.55rem;
          color: ${C.charcoal};
          font-size: 1rem;
          font-weight: 900;
        }
        .time-slot-picker {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px dashed ${C.border};
        }
        .time-chips {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
          gap: 0.5rem;
        }
        .time-chip {
          padding: 0.5rem 0.25rem;
          border-radius: 8px;
          border: 1px solid ${C.border};
          background: ${C.ivory};
          color: ${C.charcoal};
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .time-chip:hover:not(:disabled) {
          border-color: ${C.emerald};
        }
        .time-chip.active {
          background: ${C.emerald};
          color: white;
          border-color: ${C.emerald};
        }
        .time-chip:disabled,
        .time-chip.booked {
          opacity: 0.55;
          cursor: not-allowed;
          background: #F3F4F6;
          border-color: #E5E7EB;
          color: #9CA3AF;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .time-chip-badge {
          font-size: 0.65rem;
          background: #E5E7EB;
          color: #6B7280;
          border-radius: 4px;
          padding: 0.1rem 0.3rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .cal-time-row {
          display: flex;
          align-items: stretch;
          gap: 1rem;
          margin-top: 0.75rem;
          flex-wrap: wrap;
        }
        .avail-mini-cal {
          border: 1px solid ${C.border};
          border-radius: 10px;
          overflow: hidden;
          background: white;
          flex-shrink: 0;
          width: 280px;
        }
        .time-slot-panel {
          flex: 1 1 auto;
          min-width: 160px;
          padding: 0.75rem;
          background: ${C.ivory};
          border: 1px solid ${C.border};
          border-radius: 10px;
        }
        .schedule-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.55rem;
        }
        .schedule-header-row h3 {
          margin: 0;
        }
        .reset-date-btn {
          font-size: 0.75rem;
          color: ${C.error};
          background: ${C.errorBg};
          border: 1px solid rgba(192, 57, 43, 0.2);
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        .reset-date-btn:hover {
          background: #FCA5A5;
          color: white;
        }
        .time-slot-label {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 900;
          color: ${C.muted};
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 0 0 0.65rem;
        }
        .avail-mini-cell.used-by-other {
          background: rgba(196,151,59,0.06);
          color: ${C.gold};
          border-color: rgba(196,151,59,0.2);
          cursor: not-allowed;
          opacity: 0.65;
        }
        .legend-dot.used { background: rgba(196,151,59,0.15); border: 1px solid rgba(196,151,59,0.4); }

        .avail-mini-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.45rem 0.6rem;
          background: linear-gradient(135deg, ${C.emerald}, #27AE60);
        }
        .avail-mini-nav-btn {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.2);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .avail-mini-nav-btn:hover { background: rgba(255,255,255,0.35); }
        .avail-mini-month {
          font-weight: 800;
          font-size: 0.78rem;
          color: white;
          letter-spacing: 0.01em;
        }
        .avail-mini-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          padding: 0.35rem 0.45rem;
        }
        .avail-mini-day-label {
          text-align: center;
          font-size: 0.52rem;
          font-weight: 700;
          color: ${C.muted};
          padding: 0.15rem 0;
          letter-spacing: 0.01em;
        }
        .avail-mini-cell {
          position: relative;
          height: 30px;
          border-radius: 5px;
          border: 1px solid transparent;
          background: transparent;
          color: #C9CDD4;
          font-size: 0.65rem;
          font-weight: 500;
          cursor: default;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          font-family: inherit;
          transition: all 0.15s;
        }
        .avail-mini-cell.available {
          background: ${C.emeraldPale};
          color: ${C.emerald};
          border-color: #A7D8BF;
          cursor: pointer;
          font-weight: 700;
        }
        .avail-mini-cell.available:hover {
          background: ${C.emerald};
          color: white;
          border-color: ${C.emerald};
          box-shadow: 0 2px 6px rgba(27,107,74,0.3);
        }
        .avail-mini-cell.selected {
          background: ${C.emerald};
          color: white;
          border-color: ${C.emerald};
          font-weight: 800;
          box-shadow: 0 2px 6px rgba(27,107,74,0.4);
          cursor: pointer;
        }
        .avail-mini-cell.off {
          background: #FEF2F2;
          color: #FCA5A5;
          border-color: transparent;
        }
        .avail-mini-cell.full {
          background: rgba(196,151,59,0.08);
          color: #C4973B99;
          border-color: transparent;
        }
        .avail-mini-cell.unavail {
          opacity: 0.3;
        }
        .avail-mini-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          display: block;
          flex-shrink: 0;
        }
        .avail-mini-dot.avail-dot { background: ${C.emerald}; }
        .avail-mini-dot.off-dot { background: #F87171; }
        .avail-mini-legend {
          display: flex;
          gap: 0.625rem;
          padding: 0.3rem 0.6rem 0.4rem;
          border-top: 1px solid ${C.border};
          flex-wrap: wrap;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.58rem;
          font-weight: 600;
          color: ${C.muted};
        }
        .legend-dot {
          width: 7px;
          height: 7px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .legend-dot.avail { background: ${C.emeraldPale}; border: 1px solid #A7D8BF; }
        .legend-dot.off { background: #FEF2F2; border: 1px solid #FCA5A5; }
        .legend-dot.unavail { background: #F3F4F6; border: 1px solid #E5E7EB; }
        .confirmation-grid {
          display: grid;
          gap: 1rem;
        }
        .panel-label {
          margin-bottom: 1rem;
          color: ${C.muted};
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .confirmation-row {
          display: grid;
          grid-template-columns: 32px 1fr auto;
          gap: 0.75rem;
          align-items: start;
          padding-top: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px dashed ${C.border};
        }
        .confirmation-row:first-child {
          padding-top: 0;
        }
        .confirmation-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .confirmation-row p {
          margin: 0;
          color: ${C.emerald};
          font-size: 0.85rem;
          font-weight: 800;
          line-height: 1.5;
        }
        .confirmation-row strong,
        .cost-row strong {
          color: ${C.charcoal};
          font-size: 0.9rem;
          white-space: nowrap;
        }
        .cost-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          flex: 1;
        }
        .cost-list > *:not(.cost-total) {
          margin-bottom: 0;
        }
        .cost-list > .cost-total {
          margin-top: auto;
        }
        .cost-row,
        .cost-total {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          color: ${C.muted};
          font-size: 0.92rem;
        }
        .cost-row.strong span,
        .cost-row.strong strong,
        .cost-row.discount span,
        .cost-row.discount strong {
          color: ${C.emerald};
          font-weight: 900;
        }
        .cost-total {
          align-items: center;
          margin-top: 0.25rem;
          padding-top: 1rem;
          border-top: 1px solid ${C.border};
          color: ${C.charcoal};
          font-weight: 900;
        }
        .cost-total strong {
          color: ${C.emerald};
          font-size: 1.2rem;
        }
        .notes-field {
          margin-top: 1rem;
          margin-bottom: 2.5rem;
        }
        .notes-field label {
          display: block;
          margin-bottom: 0.5rem;
          color: ${C.charcoal};
          font-size: 0.85rem;
          font-weight: 900;
        }
        .notes-field textarea {
          width: 100%;
          min-height: 110px;
          border: 1px solid ${C.border};
          border-radius: 16px;
          padding: 0.9rem 1rem;
          background: ${C.ivory};
          color: ${C.charcoal};
          font: inherit;
          resize: vertical;
          outline: none;
        }
        .picker-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: max(0.75rem, env(safe-area-inset-top)) 0 0;
          background: rgba(17, 24, 39, 0.58);
          backdrop-filter: blur(10px);
          isolation: isolate;
        }
        .picker-sheet {
          width: 100%;
          max-height: calc(100dvh - max(0.75rem, env(safe-area-inset-top)));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 16px 16px 0 0;
          background: ${C.ivory};
          box-shadow: 0 -24px 80px rgba(0, 0, 0, 0.22);
        }
        .picker-handle {
          width: 48px;
          height: 5px;
          border-radius: 999px;
          background: ${C.border};
          margin: 0.75rem auto 0.35rem;
        }
        .picker-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem 1rem 1rem;
        }
        .picker-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.45rem;
          padding: 0 1rem 0.75rem;
        }
        .picker-tabs button {
          min-height: 46px;
          border: 1px solid ${C.border};
          border-radius: 12px;
          background: ${C.white};
          color: ${C.muted};
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          cursor: pointer;
        }
        .picker-tabs button.active {
          border-color: ${C.emerald};
          background: ${C.emeraldPale};
          color: ${C.emerald};
        }
        .picker-tabs button.active.blue {
          border-color: ${C.blue};
          background: ${C.bluePale};
          color: ${C.blue};
        }
        .picker-content {
          overflow: auto;
          padding: 0 1rem 1rem;
        }
        .timeline-picker-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .timeline-option {
          position: relative;
          width: 100%;
          min-height: 88px;
          display: grid;
          grid-template-columns: 34px 1fr;
          gap: 0.75rem;
          text-align: left;
          border: 2px solid transparent;
          border-radius: 12px;
          background: ${C.white};
          padding: 0.9rem;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(44, 44, 44, 0.06);
          touch-action: manipulation;
        }
        .timeline-option.selected {
          border-color: ${C.emerald};
          background: ${C.emeraldPale};
        }
        .timeline-option.selected.blue {
          border-color: ${C.blue};
          background: ${C.bluePale};
        }
        .timeline-rail {
          position: relative;
          display: flex;
          justify-content: center;
          color: ${C.emerald};
        }

        .timeline-rail span {
          position: relative;
          z-index: 1;
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: ${C.emeraldPale};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 900;
        }
        .timeline-rail.blue {
          color: ${C.blue};
        }
        .timeline-rail.blue span {
          background: ${C.bluePale};
        }
        .timeline-option-body,
        .option-title-row,
        .option-meta-row,
        .bundle-mini-list {
          display: flex;
        }
        .timeline-option-body {
          min-width: 0;
          flex-direction: column;
          gap: 0.45rem;
        }
        .option-title-row {
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
        }
        .option-title-row strong {
          color: ${C.charcoal};
          font-size: 0.98rem;
          font-weight: 900;
          line-height: 1.35;
        }
        .option-title-row b {
          color: ${C.emerald};
          font-size: 0.9rem;
          white-space: nowrap;
        }
        .timeline-option.bundle .option-title-row b {
          color: ${C.blue};
        }
        .option-description {
          color: ${C.muted};
          font-size: 0.84rem;
          line-height: 1.5;
        }
        .option-meta-row {
          flex-wrap: wrap;
          gap: 0.5rem 0.75rem;
          color: ${C.charcoal};
          font-size: 0.78rem;
          font-weight: 800;
        }
        .option-meta-row span {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .bundle-mini-list {
          flex-direction: column;
          gap: 0.4rem;
          margin-top: 0.1rem;
        }
        .bundle-mini-list span {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: ${C.charcoal};
          font-size: 0.82rem;
          font-weight: 800;
        }
        .bundle-mini-list i {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: ${C.white};
          color: ${C.blue};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-style: normal;
          font-weight: 900;
        }
        .selected-check {
          position: absolute;
          right: 0.75rem;
          bottom: 0.75rem;
          color: ${C.emerald};
        }
        .selected-check.blue {
          color: ${C.blue};
        }
        .picker-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.85rem 1rem max(0.85rem, env(safe-area-inset-bottom));
          border-top: 1px solid ${C.border};
          background: rgba(255, 255, 255, 0.94);
        }
        .picker-footer div {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }
        .picker-footer span {
          color: ${C.muted};
          font-size: 0.78rem;
          font-weight: 800;
        }
        .picker-footer strong {
          color: ${C.emerald};
          font-size: 1rem;
          font-weight: 900;
        }
        .picker-footer button {
          min-width: 150px;
          padding: 0 1rem;
        }
        .picker-footer button:disabled,
        .primary-action-button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
          box-shadow: none;
        }
        .booking-bottom-bar {
          position: sticky;
          bottom: 0;
          margin: auto -1rem 0 -1rem;
          z-index: 30;
          padding: 1rem 1rem max(1rem, env(safe-area-inset-bottom));
          border-top: 1px solid ${C.border};
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          box-shadow: 0 -18px 45px rgba(44, 44, 44, 0.08);
        }
        .bottom-bar-inner {
          max-width: 980px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .bottom-bar-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .primary-action-button {
          flex: 1 1 0%;
        }
        .secondary-action-button {
          flex: 1 1 0%;
          min-height: 48px;
          padding: 0 1rem;
          border: 1.5px solid ${C.border};
          border-radius: 16px;
          background: white;
          color: ${C.charcoal};
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          transition: border-color 0.15s;
        }
        .secondary-action-button:hover {
          border-color: ${C.charcoal};
        }
        .error-banner {
          padding: 0.75rem 0.9rem;
          border-radius: 12px;
          background: ${C.errorBg};
          color: ${C.error};
          font-size: 0.88rem;
          font-weight: 800;
          line-height: 1.45;
        }
        button:focus-visible,
        input:focus-visible,
        textarea:focus-visible {
          outline: 3px solid rgba(196, 151, 59, 0.35);
          outline-offset: 2px;
        }
        @media (min-width: 700px) {
          .booking-page-shell {
            padding: 2rem 1.25rem 0 1.25rem;
          }
          .booking-bottom-bar {
            margin: auto -1.25rem 0 -1.25rem;
            padding: 1rem 1.25rem;
          }
          .booking-header {
            grid-template-columns: minmax(0, 1fr) 48px;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .selection-hero {
            grid-template-columns: 1fr;
            align-items: center;
            padding: 1.5rem;
          }
          .selected-summary-card,
          .panel-card,
          .notes-field {
            padding: 1.25rem;
          }
          .confirmation-grid {
            grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
            align-items: stretch;
          }
          .picker-overlay {
            align-items: center;
            padding: 1.25rem;
          }
          .picker-sheet {
            max-width: 820px;
            max-height: min(760px, calc(100dvh - 2.5rem));
            border-radius: 16px;
          }
          .picker-head,
          .picker-tabs,
          .picker-content,
          .picker-footer {
            padding-left: 1.25rem;
            padding-right: 1.25rem;
          }
        }
        @media (max-width: 430px) {
          .booking-page-shell {
            padding-left: 0.85rem;
            padding-right: 0.85rem;
          }
          .booking-bottom-bar {
            margin-left: -0.85rem;
            margin-right: -0.85rem;
            padding-left: 0.85rem;
            padding-right: 0.85rem;
          }
          .summary-card-head,
          .picker-footer {
            align-items: stretch;
            flex-direction: column;
          }
          .picker-footer button {
            width: 100%;
          }
          .confirmation-row {
            grid-template-columns: 32px 1fr;
          }
          .confirmation-row strong {
            grid-column: 2;
          }
          .picker-tabs button {
            font-size: 0.82rem;
          }
          .option-title-row {
            flex-direction: column;
            gap: 0.25rem;
          }
        }
        @media (max-width: 550px) {
          .cal-time-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .avail-mini-cal {
            width: 100%;
          }
          .time-slot-panel {
            width: 100%;
            flex: none;
          }
        }
      `}</style>
    </div>
  );
}
