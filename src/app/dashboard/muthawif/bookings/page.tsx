import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CopyButton } from "../../CopyButton";
import { DashboardHeader } from "../DashboardHeader";
import { AmirHeaderPanel } from "../../AmirHeaderPanel";
import ChatWidget from "@/components/ChatWidget";
import MuthawifMobileNav from "../MuthawifMobileNav";
import TableToolbar from "@/components/TableToolbar";
import { CalendarDays, ClipboardList, Wallet, BarChart3 } from "lucide-react";

/* ─── Types ─── */
interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    q?: string;
    sort?: string;
  }>;
}

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  CANCELLED: "Dibatalkan",
  COMPLETED: "Selesai",
};

const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  PENDING:   { bg: "rgba(196,151,59,0.1)",  color: "#92700A", dot: "#C4973B" },
  CONFIRMED: { bg: "rgba(27,107,74,0.1)",   color: "#1B6B4A", dot: "#27956A" },
  CANCELLED: { bg: "rgba(220,38,38,0.08)",  color: "#B91C1C", dot: "#EF4444" },
  COMPLETED: { bg: "rgba(37,99,235,0.08)",  color: "#1D4ED8", dot: "#3B82F6" },
};

const PAYMENT_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  PAID:   { label: "Lunas",   bg: "rgba(27,107,74,0.1)",  color: "#1B6B4A" },
  UNPAID: { label: "Belum",   bg: "rgba(196,151,59,0.1)", color: "#92700A" },
};

/* ─── Server Action: Accept booking ─── */
async function acceptBooking(bookingId: string) {
  "use server";
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
  });
}

/* ─── Server Action: Reject booking ─── */
async function rejectBooking(bookingId: string) {
  "use server";
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });
}

/* ─── Stat Card ─── */
function StatCard({ label, value, sub, color = "var(--emerald)" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      padding: "1.125rem 1.375rem",
      border: "1px solid var(--border)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{ fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>{sub}</div>}
    </div>
  );
}

/* ─── Status Filter Button (Client boundary is not needed for links) ─── */
function FilterBadge({ label, value, current }: { label: string; value: string; current: string }) {
  const isActive = current === value;
  return (
    <Link
      href={`/dashboard/muthawif/bookings?status=${value}&page=1`}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.3rem",
        padding: "0.375rem 0.875rem",
        borderRadius: 99,
        fontSize: "0.8125rem",
        fontWeight: 700,
        textDecoration: "none",
        border: isActive ? "1.5px solid var(--emerald)" : "1.5px solid var(--border)",
        background: isActive ? "var(--emerald)" : "white",
        color: isActive ? "white" : "var(--text-muted)",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Link>
  );
}

/* ─── Pagination ─── */
function Pagination({ page, total, status }: { page: number; total: number; status: string }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const shown = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", padding: "1rem 1.25rem", background: "white", borderRadius: "0 0 16px 16px", borderTop: "1px solid var(--border)" }}>
      <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600 }}>
        Hal {page} dari {totalPages} · {total} pesanan
      </span>
      <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
        {page > 1 && (
          <Link href={`/dashboard/muthawif/bookings?status=${status}&page=${page - 1}`} style={pgBtnStyle(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </Link>
        )}
        {shown.map((p, i) => {
          const prev = shown[i - 1];
          return (
            <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
              {prev && p - prev > 1 && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>…</span>}
              <Link href={`/dashboard/muthawif/bookings?status=${status}&page=${p}`} style={pgBtnStyle(p === page)}>
                {p}
              </Link>
            </span>
          );
        })}
        {page < totalPages && (
          <Link href={`/dashboard/muthawif/bookings?status=${status}&page=${page + 1}`} style={pgBtnStyle(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        )}
      </div>
    </div>
  );
}

function pgBtnStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 32, height: 32, borderRadius: 8,
    background: active ? "var(--emerald)" : "var(--ivory)",
    color: active ? "white" : "var(--charcoal)",
    border: active ? "none" : "1px solid var(--border)",
    fontSize: "0.8125rem",
    fontWeight: 700,
    textDecoration: "none",
    transition: "all 0.15s",
  };
}

/* ─── Main Page ─── */
export default async function MuthawifBookingsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "MUTHAWIF") {
    redirect("/auth/login?redirect=/dashboard/muthawif/bookings");
  }

  const profile = await prisma.muthawifProfile.findUnique({
    where: { userId: session.id },
    include: { user: true },
  });

  const params = await searchParams;
  const page    = Math.max(1, parseInt(params.page  || "1", 10));
  const status  = params.status || "ALL";
  const searchQ = params.q || "";
  const sort    = params.sort || "terbaru";
  const skip    = (page - 1) * PAGE_SIZE;

  const where: any = {
    muthawifId: session.id,
    ...(status !== "ALL" ? { status: status as any } : {}),
  };

  if (searchQ.trim()) {
    where.OR = [
      { id: { contains: searchQ, mode: "insensitive" } },
      { jamaah: { name: { contains: searchQ, mode: "insensitive" } } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "terlama") orderBy = { createdAt: "asc" };
  if (sort === "termahal") orderBy = { totalFee: "desc" };
  if (sort === "termurah") orderBy = { totalFee: "asc" };

  const [bookings, total, allStats] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { jamaah: { select: { id: true, name: true, email: true, photoUrl: true } } },
      orderBy,
      skip,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
    prisma.booking.groupBy({
      by: ["status"],
      where: { muthawifId: session.id },
      _count: { id: true },
      _sum: { totalFee: true },
    }),
  ]);

  /* ── Compute summary stats ── */
  const totalEarned = allStats
    .filter(s => s.status === "COMPLETED" || s.status === "CONFIRMED")
    .reduce((acc, s) => acc + (s._sum.totalFee || 0), 0);

  const countByStatus = Object.fromEntries(allStats.map(s => [s.status, s._count.id]));
  const totalAll = Object.values(countByStatus).reduce((a, b) => a + b, 0);

  const boundAccept = acceptBooking.bind(null, "");
  const boundReject = rejectBooking.bind(null, "");

  return (
    <div className="dashboard-fullscreen muthawif-dashboard">

      {/* ══ SIDEBAR ══ */}
      <aside className="dashboard-sidebar-fixed hide-mobile" style={{ background: "linear-gradient(170deg, #0d2818 0%, #1B6B4A 70%, #27956A 100%)", borderRight: "none" }}>
        {/* Brand */}
        <div style={{ padding: "1.25rem 1.375rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #1B6B4A, #27956A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 900, fontSize: "1rem", letterSpacing: "-0.02em", lineHeight: 1 }}>
              Wif<span style={{ color: "#E4B55A" }}>–Me</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.07em", marginTop: 2 }}>PENDAMPING IBADAH UMROH</div>
          </div>
        </div>

        {/* Nav links */}
        <div className="sidebar-scrollable" style={{ padding: "0.875rem 0.75rem", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: "0.5875rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: "0.375rem", padding: "0 0.25rem" }}>
            MENU UTAMA
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {[
              { href: "/dashboard/muthawif?tab=earnings", label: "Dashboard",         desc: "Pendapatan & analytics", icon: BarChart3,     sub: false },
              { href: "/dashboard/muthawif?tab=schedule", label: "Jadwal",            desc: "Kelola ketersediaan",    icon: CalendarDays,  sub: false },
              { href: "/dashboard/muthawif/bookings",     label: "Pesanan",            desc: "Riwayat pesanan masuk",  icon: ClipboardList, sub: false, active: true },
              { href: "/dashboard/muthawif?tab=wallet",   label: "Dompet Muthawif",    desc: "Balans & penarikan",     icon: Wallet,        sub: false },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  display: "flex", alignItems: "center", gap: t.sub ? "0.5rem" : "0.75rem",
                  padding: t.sub ? "0.5rem 0.625rem 0.5rem 2.25rem" : "0.6875rem 0.75rem",
                  borderRadius: t.sub ? 10 : 12, textDecoration: "none", marginBottom: "0.25rem",
                  marginLeft: t.sub ? "0.5rem" : "0",
                  background: t.active ? "rgba(255,255,255,0.14)" : "transparent",
                  border: t.active ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
                  position: "relative",
                }}
              >
                {t.sub && (
                  <div style={{
                    position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)",
                    width: 8, height: 1, background: "rgba(255,255,255,0.2)",
                  }} />
                )}
                <div style={{ width: t.sub ? 26 : 34, height: t.sub ? 26 : 34, borderRadius: t.sub ? 7 : 9, background: t.active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: t.active ? "white" : "rgba(255,255,255,0.7)" }}>
                  <t.icon size={t.sub ? 14 : 18} strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: t.active ? "white" : t.sub ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.8)", fontWeight: t.active ? 700 : t.sub ? 500 : 600, fontSize: t.sub ? "0.8125rem" : "0.875rem", lineHeight: 1.2 }}>{t.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.5625rem", marginTop: "0.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.desc}</div>
                </div>
                {t.active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#E4B55A", flexShrink: 0 }} />}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div className="dashboard-main-area">
        <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--charcoal)", margin: 0 }}>Manajemen Pesanan</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>Kelola semua pesanan masuk dari Jamaah</p>
          </div>
          <AmirHeaderPanel
            name={session.name || "Muthawif"}
            email={session.email || ""}
            role={session.role}
            avatarUrl={profile?.user?.photoUrl}
            muthawifProfile={profile}
          />
        </header>

        <main className="dashboard-content-scroll" style={{ padding: "clamp(1rem, 3vw, 1.75rem)", overflowY: "auto", flex: 1, minHeight: 0 }}>

          {/* ── Summary Stats Row ── */}
          <div className="bm-summary-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.875rem", marginBottom: "1.5rem" }}>
            <StatCard label="Total Pesanan"     value={totalAll}                                      sub="Semua status" />
            <StatCard label="Menunggu"          value={countByStatus["PENDING"]   || 0}               sub="Perlu tindakan"  color="var(--gold)" />
            <StatCard label="Dikonfirmasi"      value={countByStatus["CONFIRMED"] || 0}               sub="Aktif"           color="var(--emerald)" />
            <StatCard label="Selesai"           value={countByStatus["COMPLETED"] || 0}               sub="Terselesaikan"   color="#2563EB" />
            <StatCard label="Total Pendapatan"  value={`Rp ${totalEarned.toLocaleString("id-ID")}`}  sub="Dari pesanan lunas" color="var(--emerald)" />
          </div>

          {/* ── Table Toolbar (Search & Filter) ── */}
          <div style={{ marginBottom: "1.125rem" }}>
            <TableToolbar
              searchPlaceholder="Cari ID atau Jamaah..."
              filters={[
                { label: `Semua (${totalAll})`, value: "ALL" },
                { label: `Menunggu (${countByStatus["PENDING"] || 0})`, value: "PENDING" },
                { label: `Dikonfirmasi (${countByStatus["CONFIRMED"] || 0})`, value: "CONFIRMED" },
                { label: `Selesai (${countByStatus["COMPLETED"] || 0})`, value: "COMPLETED" },
                { label: `Dibatalkan (${countByStatus["CANCELLED"] || 0})`, value: "CANCELLED" }
              ]}
              sorts={[
                { label: "Terbaru", value: "terbaru" },
                { label: "Terlama", value: "terlama" },
                { label: "Harga Tertinggi", value: "termahal" },
                { label: "Harga Terendah", value: "termurah" }
              ]}
            />
          </div>

          {/* ── Table ── */}
          {bookings.length === 0 ? (
            <div style={{ padding: "5rem 2rem", textAlign: "center", background: "white", borderRadius: 20, border: "1px solid var(--border)" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--ivory-dark)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
              <h3 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.375rem", color: "var(--charcoal)" }}>
                {status === "ALL" ? "Belum ada pesanan" : `Tidak ada pesanan berstatus "${STATUS_LABELS[status] || status}"`}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                {status === "ALL" ? "Pesanan dari Jamaah akan muncul di sini." : "Coba ubah filter untuk melihat pesanan lain."}
              </p>
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", overflow: "hidden" }}>

              {/* Table header */}
              <div className="bm-table-header" style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1.4fr 1.2fr 1fr 1fr auto",
                gap: "0.75rem",
                padding: "0.75rem 1.25rem",
                background: "var(--ivory)",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
              }}>
                {["Jamaah", "Tanggal & Durasi", "Nominal", "Status Pesanan", "Pembayaran", "Aksi"].map(h => (
                  <div key={h} style={{ fontSize: "0.625rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</div>
                ))}
              </div>

              {/* Table rows */}
              {bookings.map((booking, idx) => {
                const sc = STATUS_COLORS[booking.status] || STATUS_COLORS["PENDING"];
                const pc = PAYMENT_LABELS[booking.paymentStatus || "UNPAID"] || PAYMENT_LABELS["UNPAID"];
                const durationDays = Math.max(1, Math.round(
                  (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 86400000
                ));
                const initials = booking.jamaah.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                const shortId = booking.id.slice(0, 8).toUpperCase();
                const isPending = booking.status === "PENDING";

                return (
                  <div key={booking.id} className="bm-card-wrap" style={{ borderBottom: idx < bookings.length - 1 ? "1px solid var(--border)" : "none" }}>

                    {/* ── DESKTOP VIEW ── */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.6fr 1.4fr 1.2fr 1fr 1fr auto",
                        gap: "0.75rem",
                        padding: "1rem 1.25rem",
                        alignItems: "center",
                        transition: "background 0.15s",
                        background: isPending ? "rgba(196,151,59,0.02)" : "transparent",
                      }}
                      className="bm-row-desktop"
                    >
                    {/* Col 1: Jamaah info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                      {booking.jamaah.photoUrl ? (
                        <img src={booking.jamaah.photoUrl} alt={booking.jamaah.name} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid var(--border)" }} />
                      ) : (
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, var(--emerald), #27956A)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>
                          {initials}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--charcoal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {booking.jamaah.name}
                        </div>
                        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {booking.jamaah.email}
                        </div>
                        <div style={{ fontSize: "0.5625rem", color: "var(--text-muted)", fontFamily: "monospace", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          #{shortId}
                          <CopyButton text={booking.id} />
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Tanggal */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--charcoal)" }}>
                        {new Date(booking.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                        {durationDays} hari · s/d {new Date(booking.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                        Order: {new Date(booking.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>

                    {/* Col 3: Nominal */}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: booking.paymentStatus === "PAID" ? "var(--emerald)" : "var(--charcoal)" }}>
                        Rp {booking.totalFee.toLocaleString("id-ID")}
                      </div>
                      {booking.notes && (
                        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.2rem", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                          &ldquo;{booking.notes}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Col 4: Status */}
                    <div>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "0.3rem",
                        padding: "0.25rem 0.625rem",
                        borderRadius: 99,
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        background: sc.bg,
                        color: sc.color,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </div>

                    {/* Col 5: Bayar */}
                    <div>
                      <span style={{
                        display: "inline-flex", alignItems: "center",
                        padding: "0.25rem 0.625rem",
                        borderRadius: 99,
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        background: pc.bg,
                        color: pc.color,
                      }}>
                        {pc.label}
                      </span>
                    </div>

                    {/* Col 6: Action (desktop only) */}
                    <div className="bm-action-desktop" style={{ display: "flex", flexDirection: "column", gap: "0.375rem", minWidth: "max-content" }}>
                      {isPending ? (
                        <>
                          <form action={acceptBooking.bind(null, booking.id)}>
                            <button type="submit" style={{
                              display: "flex", alignItems: "center", gap: "0.3rem",
                              padding: "0.375rem 0.75rem",
                              background: "var(--emerald)",
                              color: "white",
                              border: "none",
                              borderRadius: 8,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              width: "100%",
                              justifyContent: "center",
                              whiteSpace: "nowrap",
                            }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                              Terima
                            </button>
                          </form>
                          <form action={rejectBooking.bind(null, booking.id)}>
                            <button type="submit" style={{
                              display: "flex", alignItems: "center", gap: "0.3rem",
                              padding: "0.375rem 0.75rem",
                              background: "white",
                              color: "var(--error)",
                              border: "1px solid rgba(220,38,38,0.25)",
                              borderRadius: 8,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              width: "100%",
                              justifyContent: "center",
                              whiteSpace: "nowrap",
                            }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Tolak
                            </button>
                          </form>
                        </>
                      ) : (booking.status === "CONFIRMED" || booking.status === "COMPLETED") ? (
                        <ChatWidget
                          bookingId={booking.id}
                          currentUser={{ id: session.id, name: session.name!, photoUrl: profile?.user?.photoUrl, role: "MUTHAWIF" }}
                          otherUser={{ id: booking.jamaahId, name: booking.jamaah.name, photoUrl: booking.jamaah.photoUrl, role: "JAMAAH" }}
                          buttonLabel="💬 Chat Jamaah"
                          variant="compact"
                        />
                      ) : (
                        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontStyle: "italic" }}>—</span>
                      )}
                    </div>
                    </div>

                    {/* ── TOKOPEDIA-STYLE MOBILE CARD ── */}
                    <div className="bm-row-mobile" style={{ display: "none", flexDirection: "column", padding: "0" }}>
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--charcoal)" }}>Jamaah • {new Date(booking.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        <span style={{ padding: "0.15rem 0.4rem", borderRadius: 4, fontSize: "0.625rem", fontWeight: 800, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                          {STATUS_LABELS[booking.status] || booking.status}
                        </span>
                      </div>

                      {/* Body */}
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.875rem" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,var(--emerald),#27956A)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem", flexShrink: 0, overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
                          {booking.jamaah.photoUrl
                            ? <span aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", backgroundImage: `url(${booking.jamaah.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                            : initials}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 0 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--charcoal)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.1rem" }}>
                              {booking.jamaah.name}
                            </div>
                            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                              {durationDays} hari • Order #{shortId}
                            </div>
                          </div>
                          {(booking.status === "CONFIRMED" || booking.status === "COMPLETED") && (
                            <div style={{ flexShrink: 0 }}>
                              <ChatWidget
                                bookingId={booking.id}
                                currentUser={{ id: session!.id, name: session!.name!, photoUrl: profile?.user?.photoUrl, role: "MUTHAWIF" }}
                                otherUser={{ id: booking.jamaahId, name: booking.jamaah.name, photoUrl: booking.jamaah.photoUrl, role: "JAMAAH" }}
                                buttonLabel="Chat"
                                variant="compact"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer: Price & Actions */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0", padding: "0", borderTop: "1px solid rgba(0,0,0,0.05)", background: "var(--ivory)", borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                        {/* Price Row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                            <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>Total Pendapatan</div>
                            <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--charcoal)" }}>Rp {booking.totalFee.toLocaleString("id-ID")}</div>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <span style={{ fontSize: "0.625rem", fontWeight: 800, color: pc.color, background: pc.bg, padding: "0.2rem 0.5rem", borderRadius: 4 }}>{pc.label}</span>
                          </div>
                        </div>

                        {/* Actions Row */}
                        {isPending && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", padding: "0 0.875rem 0.875rem" }}>
                            <form action={acceptBooking.bind(null, booking.id)}>
                              <button type="submit" style={{
                                width: "100%", padding: "0.5rem", background: "var(--emerald)",
                                color: "white", border: "none", borderRadius: 8, fontSize: "0.75rem",
                                fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center",
                                justifyContent: "center", gap: "0.25rem",
                              }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                Terima
                              </button>
                            </form>
                            <form action={rejectBooking.bind(null, booking.id)}>
                              <button type="submit" style={{
                                width: "100%", padding: "0.5rem", background: "white",
                                color: "var(--error)", border: "1px solid rgba(220,38,38,0.3)",
                                borderRadius: 8, fontSize: "0.75rem", fontWeight: 800, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem",
                              }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                Tolak
                              </button>
                            </form>
                          </div>
                        )}
                        {(booking.status === "CONFIRMED" || booking.status === "COMPLETED") && (
                          <div style={{ padding: "0 0.875rem 0.875rem" }}>
                            <ChatWidget
                              bookingId={booking.id}
                              currentUser={{ id: session!.id, name: session!.name!, photoUrl: profile?.user?.photoUrl, role: "MUTHAWIF" }}
                              otherUser={{ id: booking.jamaahId, name: booking.jamaah.name, photoUrl: booking.jamaah.photoUrl, role: "JAMAAH" }}
                              buttonLabel={`Chat dengan ${booking.jamaah.name}`}
                              variant="primary"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              <Pagination page={page} total={total} status={status} />
            </div>
          )}

        </main>
      </div>

      <MuthawifMobileNav currentTab="bookings" />

      <style>{`
        .bm-row-desktop:hover {
          background: var(--ivory) !important;
        }
        @media (max-width: 900px) {
          .muthawif-dashboard .dashboard-sidebar-fixed { display: none !important; }
          .muthawif-dashboard .bm-summary-stats { display: none !important; }
          .muthawif-dashboard .bm-card-wrap {
            border-bottom: none !important;
            border-radius: 12px;
            background: #fff;
            border: 1px solid rgba(0,0,0,0.08);
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
            margin-bottom: 0.75rem;
            overflow: hidden;
            padding: 0 !important;
          }
          .muthawif-dashboard .bm-table-header { display: none !important; }
          .muthawif-dashboard .bm-row-desktop { display: none !important; }
          .muthawif-dashboard .bm-row-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
