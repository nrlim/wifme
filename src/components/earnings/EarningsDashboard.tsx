"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import type { MuthawifAnalytics, AmirAnalytics, AnalyticsData } from "./types";

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000
    ? `Rp ${(n / 1_000_000).toFixed(1)}jt`
    : n >= 1_000
    ? `Rp ${(n / 1_000).toFixed(0)}rb`
    : `Rp ${n.toLocaleString("id-ID")}`;

const fmtFull = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

const PERIOD_OPTIONS = [
  { value: "this_month", label: "Bulan Ini" },
  { value: "last_3_months", label: "3 Bulan" },
  { value: "this_year", label: "Tahun Ini" },
  { value: "all_time", label: "Semua" },
];

const TX_TYPE_LABELS: Record<string, string> = {
  PAYMENT_ESCROW: "Pembayaran Escrow",
  ESCROW_SETTLEMENT: "Pencairan Amanah",
  WITHDRAWAL: "Penarikan Dana",
};

const TX_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  SUCCESS: { bg: "rgba(27,107,74,0.1)", color: "#1B6B4A", label: "Berhasil" },
  PENDING: { bg: "rgba(196,151,59,0.12)", color: "#A16207", label: "Proses" },
  FAILED: { bg: "#FEF2F2", color: "#C0392B", label: "Gagal" },
};

const BOOKING_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  COMPLETED: { bg: "rgba(27,107,74,0.1)", color: "#1B6B4A", label: "Selesai" },
  CONFIRMED: { bg: "rgba(99,102,241,0.1)", color: "#4F46E5", label: "Dikonfirmasi" },
  PENDING: { bg: "rgba(196,151,59,0.12)", color: "#A16207", label: "Menunggu" },
  CANCELLED: { bg: "#FEF2F2", color: "#C0392B", label: "Dibatalkan" },
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #E0D8CC",
        borderRadius: 12,
        padding: "0.75rem 1rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8A8A8A", marginBottom: "0.5rem" }}>
        {label}
      </div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ fontSize: "0.8125rem", color: "#4A4A4A" }}>{p.name}: </span>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#2C2C2C" }}>
            {typeof p.value === "number" && p.name !== "Booking" && p.name !== "Jumlah"
              ? fmt(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon,
  accentColor,
  bgAccent,
  valueColor,
  mini,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accentColor: string;
  bgAccent: string;
  valueColor?: string;
  mini?: boolean;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        border: "1px solid #E0D8CC",
        boxShadow: "0 1px 3px rgba(44,44,44,0.08)",
        padding: mini ? "1rem" : "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(44,44,44,0.08)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Accent bar */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: accentColor, borderRadius: "4px 0 0 4px" }} />
      {/* Icon */}
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bgAccent, color: accentColor, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "0.25rem" }}>
        {icon}
      </div>
      {/* Value */}
      <div style={{ marginLeft: "0.25rem" }}>
        <div style={{ fontSize: mini ? "1.25rem" : "clamp(1.25rem, 3vw, 1.75rem)", fontWeight: 900, color: valueColor ?? "#2C2C2C", lineHeight: 1, marginBottom: "0.375rem", letterSpacing: "-0.02em" }}>
          {typeof value === "number" && value > 999 ? value.toLocaleString("id-ID") : value}
        </div>
        <div style={{ fontSize: "0.625rem", fontWeight: 800, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: "0.6875rem", color: "#8A8A8A", marginTop: "0.2rem" }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

// ── Period Selector ───────────────────────────────────────────────────────────
function PeriodSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "0.375rem", background: "#F0EBE1", borderRadius: 12, padding: "0.25rem" }}>
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "0.375rem 0.75rem",
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 700,
            fontFamily: "inherit",
            background: value === opt.value ? "white" : "transparent",
            color: value === opt.value ? "#1B6B4A" : "#8A8A8A",
            boxShadow: value === opt.value ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyEarnings() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        border: "1px dashed #E0D8CC",
        padding: "4rem 2rem",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #EBF5EF, #F0EBE1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.5rem",
        }}
      >
        🌟
      </div>
      <div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2C2C2C", marginBottom: "0.5rem" }}>
          Belum Ada Pendapatan
        </h3>
        <p style={{ color: "#8A8A8A", fontSize: "0.9375rem", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
          Setiap perjalanan dimulai dari langkah pertama. Bagikan profil Anda dan mulai terima
          pesanan dari Jamaah.
        </p>
      </div>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: "0.5rem",
        }}
      >
        {["Lengkapi Profil ✅", "Aktifkan Jadwal 📅", "Terima Pesanan 💎"].map((s) => (
          <div
            key={s}
            style={{
              background: "#EBF5EF",
              color: "#1B6B4A",
              padding: "0.5rem 1rem",
              borderRadius: 99,
              fontSize: "0.8125rem",
              fontWeight: 700,
            }}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Transaction Table ─────────────────────────────────────────────────────────
function TransactionTable({
  transactions,
}: {
  transactions: MuthawifAnalytics["transactions"];
}) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t) => {
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchSearch =
      !search ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      TX_TYPE_LABELS[t.type]?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0D8CC", overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          padding: "1.125rem 1.5rem",
          borderBottom: "1px solid #E0D8CC",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2C2C2C" }}>Riwayat Transaksi</h3>
          <p style={{ fontSize: "0.75rem", color: "#8A8A8A", marginTop: "0.125rem" }}>{filtered.length} transaksi</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: 8,
              border: "1px solid #E0D8CC",
              fontSize: "0.8125rem",
              fontFamily: "inherit",
              outline: "none",
              width: 160,
            }}
          />
          {/* Status filter */}
          {["ALL", "SUCCESS", "PENDING", "FAILED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "0.375rem 0.75rem",
                borderRadius: 8,
                border: "1px solid",
                borderColor: statusFilter === s ? "#1B6B4A" : "#E0D8CC",
                background: statusFilter === s ? "#EBF5EF" : "white",
                color: statusFilter === s ? "#1B6B4A" : "#8A8A8A",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {s === "ALL" ? "Semua" : TX_STATUS_STYLE[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {filtered.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#8A8A8A", fontSize: "0.875rem" }}>
          Tidak ada transaksi ditemukan.
        </div>
      ) : (
        <>
          {/* Desktop header */}
          <div
            className="earn-tx-hdr"
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
              padding: "0.625rem 1.5rem",
              background: "#FAF7F2",
              borderBottom: "1px solid #E0D8CC",
            }}
          >
            {["Deskripsi", "Tipe", "Nominal", "Status"].map((h) => (
              <div key={h} style={{ fontSize: "0.5875rem", fontWeight: 800, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {h}
              </div>
            ))}
          </div>
          <div>
            {filtered.map((t, i) => {
              const st = TX_STATUS_STYLE[t.status] ?? TX_STATUS_STYLE["FAILED"];
              const isPositive = t.type !== "WITHDRAWAL";
              return (
                <div
                  key={t.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid #E0D8CC" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#FAF7F2"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  {/* Desktop row */}
                  <div
                    className="earn-tx-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
                      padding: "0.875rem 1.5rem",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#2C2C2C" }}>
                        {t.description ?? TX_TYPE_LABELS[t.type] ?? t.type}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "#8A8A8A", marginTop: "0.1rem" }}>
                        {new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", background: "#F0EBE1", color: "#6B4C2A", padding: "0.2rem 0.5rem", borderRadius: 6, fontWeight: 600 }}>
                        {TX_TYPE_LABELS[t.type] ?? t.type}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: isPositive ? "#1B6B4A" : "#C0392B" }}>
                      {isPositive ? "+" : "-"}{fmtFull(t.amount)}
                    </div>
                    <div>
                      <span style={{ background: st.bg, color: st.color, padding: "0.25rem 0.625rem", borderRadius: 99, fontSize: "0.6875rem", fontWeight: 700 }}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                  {/* Mobile card */}
                  <div
                    className="earn-tx-mob"
                    style={{ padding: "0.875rem 1.25rem" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{t.description ?? TX_TYPE_LABELS[t.type]}</div>
                      <span style={{ background: st.bg, color: st.color, padding: "0.2rem 0.5rem", borderRadius: 99, fontSize: "0.6875rem", fontWeight: 700 }}>{st.label}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontSize: "0.75rem", color: "#8A8A8A" }}>{new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} · {TX_TYPE_LABELS[t.type]}</div>
                      <div style={{ fontWeight: 800, color: isPositive ? "#1B6B4A" : "#C0392B" }}>{isPositive ? "+" : "-"}{fmt(t.amount)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── MUTHAWIF EARNINGS DASHBOARD ───────────────────────────────────────────────
function MuthawifEarningsDashboard({ data }: { data: MuthawifAnalytics }) {
  const { summary, chartData, weeklyTrend, transactions, payouts } = data;
  const hasData = summary.totalCompleted > 0 || summary.grossEarnings > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── Summary Cards ── */}
      <div
        className="earn-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
          gap: "1rem",
        }}
      >
        <StatCard
          label="Saldo Tersedia"
          value={fmtFull(summary.availableBalance)}
          sub="Siap ditarik"
          accentColor="#1B6B4A"
          bgAccent="#EBF5EF"
          valueColor="#1B6B4A"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
        />
        <StatCard
          label="Total Pendapatan"
          value={fmtFull(summary.grossEarnings)}
          sub={`${summary.totalCompleted} booking selesai`}
          accentColor="#C4973B"
          bgAccent="rgba(196,151,59,0.1)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatCard
          label="Pendapatan Bersih"
          value={fmtFull(summary.netIncome)}
          sub={`Setelah fee ${summary.feeRate}%`}
          accentColor="#4F46E5"
          bgAccent="rgba(99,102,241,0.1)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
        />
        <StatCard
          label="Dana Escrow"
          value={fmtFull(summary.pendingBalance)}
          sub="Menunggu penyelesaian"
          accentColor="#0EA5E9"
          bgAccent="rgba(14,165,233,0.1)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard
          label="Rating Rata-rata"
          value={summary.rating > 0 ? `${summary.rating.toFixed(1)} ⭐` : "—"}
          sub={`${summary.totalReviews} ulasan`}
          accentColor="#F59E0B"
          bgAccent="rgba(245,158,11,0.1)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
        />
      </div>

      {/* ── Hero Revenue Banner ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d2818 0%, #1B6B4A 55%, #27956A 100%)",
          borderRadius: 24,
          padding: "1.75rem 2rem",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: -20, top: -20, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", right: 80, bottom: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        {/* Mini tren chart */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.65, letterSpacing: "0.1em", marginBottom: "0.25rem", textTransform: "uppercase" }}>
            Tren Mingguan (8 Minggu)
          </div>
          <div style={{ height: 64 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E4B55A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E4B55A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="amount" stroke="#E4B55A" fill="url(#wg)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", position: "relative" }}>
          {[
            { label: "Bersih Periode", value: fmtFull(summary.netIncome) },
            { label: "Fee Platform", value: fmtFull(summary.platformFeeTotal) },
          ].map((m) => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "0.875rem 1.125rem", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", minWidth: 130 }}>
              <div style={{ fontSize: "0.5875rem", fontWeight: 800, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>{m.label}</div>
              <div style={{ fontSize: "1rem", fontWeight: 800 }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts ── */}
      {hasData && chartData.length > 0 ? (
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0D8CC", padding: "1.5rem", overflow: "hidden" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2C2C2C" }}>Grafik Pendapatan Bulanan</h3>
            <p style={{ fontSize: "0.75rem", color: "#8A8A8A", marginTop: "0.125rem" }}>Pendapatan kotor vs bersih per bulan</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE1" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A8A8A" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10, fill: "#8A8A8A" }} axisLine={false} tickLine={false} width={64} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.75rem" }} />
              <Bar dataKey="gross" name="Pendapatan Kotor" fill="#C4973B" radius={[6, 6, 0, 0]} />
              <Bar dataKey="net" name="Pendapatan Bersih" fill="#1B6B4A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyEarnings />
      )}

      {/* ── Transaction Table ── */}
      <TransactionTable transactions={transactions} />

      {/* ── Payout History ── */}
      {payouts.length > 0 && (
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0D8CC", overflow: "hidden" }}>
          <div style={{ padding: "1.125rem 1.5rem", borderBottom: "1px solid #E0D8CC" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2C2C2C" }}>Riwayat Penarikan Dana</h3>
            <p style={{ fontSize: "0.75rem", color: "#8A8A8A", marginTop: "0.125rem" }}>{payouts.length} permintaan penarikan</p>
          </div>
          {payouts.map((p, i) => {
            const st = TX_STATUS_STYLE[p.status] ?? TX_STATUS_STYLE["FAILED"];
            return (
              <div
                key={p.id}
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: i < payouts.length - 1 ? "1px solid #E0D8CC" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#FAF7F2"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#2C2C2C" }}>
                    {p.bankName} · {p.accountHolderName}
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "#8A8A8A", marginTop: "0.125rem" }}>
                    {new Date(p.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "#C0392B" }}>
                    -{fmtFull(p.amount)}
                  </div>
                  <span style={{ background: st.bg, color: st.color, padding: "0.25rem 0.75rem", borderRadius: 99, fontSize: "0.6875rem", fontWeight: 700 }}>
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── AMIR GLOBAL DASHBOARD ─────────────────────────────────────────────────────
function AmirEarningsDashboard({ data }: { data: AmirAnalytics }) {
  const { summary, gmvChartData, topEarners, pendingPayouts, recentTransactions } = data;
  const [txStatusFilter, setTxStatusFilter] = useState("ALL");

  const filteredTx =
    txStatusFilter === "ALL"
      ? recentTransactions
      : recentTransactions.filter((t) => t.status === txStatusFilter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── KPI Cards ── */}
      <div
        className="earn-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
          gap: "1rem",
        }}
      >
        <StatCard
          label="GMV Total Platform"
          value={fmt(summary.gmv)}
          sub="Semua waktu"
          accentColor="#1B6B4A"
          bgAccent="#EBF5EF"
          valueColor="#1B6B4A"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}
        />
        <StatCard
          label="GMV Periode Ini"
          value={fmt(summary.periodGmv)}
          sub={`${summary.periodBookings} transaksi`}
          accentColor="#C4973B"
          bgAccent="rgba(196,151,59,0.1)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
        />
        <StatCard
          label="Komisi Platform"
          value={fmt(summary.totalCommission)}
          sub={`${summary.feeRate}% fee`}
          accentColor="#4F46E5"
          bgAccent="rgba(99,102,241,0.1)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatCard
          label="Total Muthawif"
          value={summary.totalMuthawifs}
          sub={`${summary.verifiedMuthawifs} terverifikasi`}
          accentColor="#0EA5E9"
          bgAccent="rgba(14,165,233,0.1)"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard
          label="Payout Menunggu"
          value={summary.pendingPayoutsCount}
          sub={`Total: ${fmt(summary.pendingPayoutsAmount)}`}
          accentColor="#EF4444"
          bgAccent="#FEF2F2"
          valueColor={summary.pendingPayoutsCount > 0 ? "#C0392B" : undefined}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
      </div>

      {/* ── GMV Hero Banner ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d1a2d 0%, #1e3a5f 55%, #2563EB 100%)",
          borderRadius: 24,
          padding: "1.75rem 2rem",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: -20, top: -20, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, opacity: 0.6, letterSpacing: "0.12em", marginBottom: "0.25rem", textTransform: "uppercase" }}>
            Gross Merchandise Value
          </div>
          <div style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {fmtFull(summary.gmv)}
          </div>
          <div style={{ fontSize: "0.8125rem", opacity: 0.65, marginTop: "0.5rem" }}>
            Komisi: {fmtFull(summary.totalCommission)} dari {summary.statusDistribution.COMPLETED} booking selesai
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", position: "relative" }}>
          {[
            { label: "Pending", value: String(summary.statusDistribution.PENDING) },
            { label: "Dikonfirmasi", value: String(summary.statusDistribution.CONFIRMED) },
            { label: "Dibatalkan", value: String(summary.statusDistribution.CANCELLED) },
          ].map((m) => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "0.875rem 1.125rem", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", minWidth: 100 }}>
              <div style={{ fontSize: "0.5875rem", fontWeight: 800, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>{m.label}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900 }}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── GMV Chart ── */}
      {gmvChartData.length > 0 ? (
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0D8CC", padding: "1.5rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2C2C2C" }}>Tren GMV & Komisi</h3>
            <p style={{ fontSize: "0.75rem", color: "#8A8A8A", marginTop: "0.125rem" }}>Nilai transaksi platform per bulan</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={gmvChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE1" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A8A8A" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10, fill: "#8A8A8A" }} axisLine={false} tickLine={false} width={64} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.75rem" }} />
              <Bar dataKey="gmv" name="GMV" fill="#2563EB" radius={[6, 6, 0, 0]} />
              <Bar dataKey="commission" name="Komisi" fill="#1B6B4A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 20, border: "1px dashed #E0D8CC", padding: "3rem", textAlign: "center", color: "#8A8A8A" }}>
          Belum ada data transaksi untuk ditampilkan.
        </div>
      )}

      {/* ── Two Column: Top Earners + Pending Payouts ── */}
      <div
        className="earn-two-col"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}
      >
        {/* Top Earners */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0D8CC", overflow: "hidden" }}>
          <div style={{ padding: "1.125rem 1.5rem", borderBottom: "1px solid #E0D8CC" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2C2C2C" }}>🏆 Top Earner Muthawif</h3>
            <p style={{ fontSize: "0.75rem", color: "#8A8A8A", marginTop: "0.125rem" }}>Berdasarkan total pendapatan bersih</p>
          </div>
          {topEarners.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#8A8A8A", fontSize: "0.875rem" }}>
              Belum ada data
            </div>
          ) : (
            topEarners.map((e, i) => (
              <div
                key={e.id}
                style={{
                  padding: "0.875rem 1.5rem",
                  borderBottom: i < topEarners.length - 1 ? "1px solid #E0D8CC" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#FAF7F2"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: i === 0 ? "linear-gradient(135deg, #C4973B, #E4B55A)" : i === 1 ? "linear-gradient(135deg, #9CA3AF, #D1D5DB)" : i === 2 ? "linear-gradient(135deg, #92400E, #D97706)" : "#F0EBE1",
                    color: i < 3 ? "white" : "#8A8A8A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "0.8125rem",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#2C2C2C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.name || "Muthawif"}
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "#8A8A8A" }}>{e.count} booking selesai</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "#1B6B4A", textAlign: "right" }}>
                  {fmt(e.total)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pending Payouts */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0D8CC", overflow: "hidden" }}>
          <div style={{ padding: "1.125rem 1.5rem", borderBottom: "1px solid #E0D8CC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2C2C2C" }}>⏳ Antrean Payout</h3>
              <p style={{ fontSize: "0.75rem", color: "#8A8A8A", marginTop: "0.125rem" }}>Penarikan menunggu proses</p>
            </div>
            {pendingPayouts.length > 0 && (
              <span style={{ background: "#FEF2F2", color: "#C0392B", padding: "0.25rem 0.625rem", borderRadius: 99, fontSize: "0.6875rem", fontWeight: 800 }}>
                {pendingPayouts.length} pending
              </span>
            )}
          </div>
          {pendingPayouts.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#8A8A8A", fontSize: "0.875rem" }}>
              🎉 Tidak ada payout yang menunggu
            </div>
          ) : (
            pendingPayouts.slice(0, 5).map((p, i) => (
              <div
                key={p.id}
                style={{
                  padding: "0.875rem 1.5rem",
                  borderBottom: i < Math.min(pendingPayouts.length, 5) - 1 ? "1px solid #E0D8CC" : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#FAF7F2"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.125rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#2C2C2C" }}>{p.userName}</div>
                  <div style={{ fontWeight: 800, color: "#C0392B" }}>{fmtFull(p.amount)}</div>
                </div>
                <div style={{ fontSize: "0.6875rem", color: "#8A8A8A" }}>{p.bankName} · {p.accountHolderName}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Recent Transactions Table ── */}
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #E0D8CC", overflow: "hidden" }}>
        <div style={{ padding: "1.125rem 1.5rem", borderBottom: "1px solid #E0D8CC", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2C2C2C" }}>Transaksi Terkini</h3>
            <p style={{ fontSize: "0.75rem", color: "#8A8A8A", marginTop: "0.125rem" }}>{filteredTx.length} transaksi</p>
          </div>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {["ALL", "COMPLETED", "CONFIRMED", "PENDING", "CANCELLED"].map((s) => (
              <button
                key={s}
                onClick={() => setTxStatusFilter(s)}
                style={{
                  padding: "0.3rem 0.625rem",
                  borderRadius: 7,
                  border: "1px solid",
                  borderColor: txStatusFilter === s ? "#1B6B4A" : "#E0D8CC",
                  background: txStatusFilter === s ? "#EBF5EF" : "white",
                  color: txStatusFilter === s ? "#1B6B4A" : "#8A8A8A",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {s === "ALL" ? "Semua" : BOOKING_STATUS_STYLE[s]?.label ?? s}
              </button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div
          className="earn-tx-hdr"
          style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", padding: "0.625rem 1.5rem", background: "#FAF7F2", borderBottom: "1px solid #E0D8CC" }}
        >
          {["Muthawif → Jamaah", "Tanggal", "Nominal", "Status", ""].map((h) => (
            <div key={h} style={{ fontSize: "0.5875rem", fontWeight: 800, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
          ))}
        </div>

        {filteredTx.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#8A8A8A", fontSize: "0.875rem" }}>
            Tidak ada data untuk filter ini.
          </div>
        ) : (
          filteredTx.map((t, i) => {
            const st = BOOKING_STATUS_STYLE[t.status] ?? BOOKING_STATUS_STYLE["PENDING"];
            return (
              <div
                key={t.id}
                style={{ borderBottom: i < filteredTx.length - 1 ? "1px solid #E0D8CC" : "none", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#FAF7F2"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <div
                  className="earn-tx-row"
                  style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", padding: "0.875rem 1.5rem", alignItems: "center" }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#2C2C2C" }}>{t.muthawifName}</div>
                    <div style={{ fontSize: "0.6875rem", color: "#8A8A8A" }}>→ {t.jamaahName}</div>
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#4A4A4A" }}>
                    {new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </div>
                  <div style={{ fontWeight: 800, color: t.status === "COMPLETED" ? "#1B6B4A" : "#2C2C2C" }}>
                    {fmt(t.amount)}
                  </div>
                  <div>
                    <span style={{ background: st.bg, color: st.color, padding: "0.25rem 0.625rem", borderRadius: 99, fontSize: "0.6875rem", fontWeight: 700 }}>
                      {st.label}
                    </span>
                  </div>
                  <div />
                </div>
                {/* Mobile row */}
                <div
                  className="earn-tx-mob"
                  style={{ padding: "0.875rem 1.25rem" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <div style={{ fontWeight: 700 }}>{t.muthawifName} → {t.jamaahName}</div>
                    <span style={{ background: st.bg, color: st.color, padding: "0.2rem 0.5rem", borderRadius: 99, fontSize: "0.625rem", fontWeight: 700 }}>{st.label}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "0.75rem", color: "#8A8A8A" }}>{new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</div>
                    <div style={{ fontWeight: 800 }}>{fmt(t.amount)}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT: EarningsDashboard ────────────────────────────────────────
export default function EarningsDashboard({ initialRole }: { initialRole: string }) {
  const [period, setPeriod] = useState("this_month");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?period=${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError("Gagal memuat data. Coba lagi nanti.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    fetchData(p);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "clamp(1.125rem, 3vw, 1.375rem)", fontWeight: 900, color: "#2C2C2C", lineHeight: 1.2, margin: 0 }}>
            {initialRole === "AMIR" ? "📊 Global Analytics Platform" : "💰 Earnings Dashboard"}
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "#8A8A8A", marginTop: "0.25rem" }}>
            {initialRole === "AMIR"
              ? "Overview GMV, komisi, dan manajemen payout seluruh platform"
              : "Pantau pendapatan, saldo, dan histori pencairan dana Anda"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <PeriodSelector value={period} onChange={handlePeriodChange} />
          {loading && (
            <div
              style={{
                width: 18,
                height: 18,
                border: "2px solid #E0D8CC",
                borderTopColor: "#1B6B4A",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* ── Error State ── */}
      {error && (
        <div style={{ background: "#FEF2F2", color: "#C0392B", border: "1px solid #FECACA", borderRadius: 12, padding: "0.875rem 1.125rem", fontSize: "0.875rem" }}>
          ⚠️ {error}
          <button
            onClick={() => fetchData(period)}
            style={{ marginLeft: "0.75rem", fontWeight: 700, background: "none", border: "none", color: "#C0392B", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading && !data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                background: "white",
                borderRadius: 20,
                border: "1px solid #E0D8CC",
                padding: "1.25rem",
                height: 110,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
                  animation: "shimmer 1.5s infinite",
                  backgroundSize: "200% 100%",
                }}
              />
              <div style={{ background: "#F0EBE1", borderRadius: 8, height: 12, width: "60%", marginBottom: "0.5rem" }} />
              <div style={{ background: "#F0EBE1", borderRadius: 8, height: 28, width: "80%", marginBottom: "0.5rem" }} />
              <div style={{ background: "#F0EBE1", borderRadius: 8, height: 10, width: "40%" }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Data ── */}
      {!loading && data && (
        <>
          {data.role === "MUTHAWIF" && <MuthawifEarningsDashboard data={data} />}
          {data.role === "AMIR" && <AmirEarningsDashboard data={data} />}
        </>
      )}

      {/* Responsive CSS */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .earn-tx-row { display: grid !important; }
        .earn-tx-mob { display: none !important; }
        .earn-tx-hdr { display: grid !important; }
        @media (max-width: 640px) {
          .earn-tx-row { display: none !important; }
          .earn-tx-mob { display: block !important; }
          .earn-tx-hdr { display: none !important; }
          .earn-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
