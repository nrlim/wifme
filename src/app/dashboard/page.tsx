import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MuthawifDataTable } from "./MuthawifDataTable";
import { AmirHeaderPanel } from "./AmirHeaderPanel";
import DashboardSearchForm from "./DashboardSearchForm";
import DashboardSearchList from "./DashboardSearchList";
import PaymentSimulationButton from "./PaymentSimulationButton";

// Types corresponding to Next.js 15/16 App Router
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu Konfirmasi",
  CONFIRMED: "Dikonfirmasi",
  CANCELLED: "Dibatalkan",
  COMPLETED: "Selesai",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "rgba(196,151,59,0.12)", color: "var(--gold)" },
  CONFIRMED: { bg: "var(--emerald-pale)", color: "var(--emerald)" },
  CANCELLED: { bg: "#FEF2F2", color: "var(--error)" },
  COMPLETED: { bg: "#EFF6FF", color: "#2563EB" },
};

const TAB_TITLES: Record<string, string> = {
  beranda: "Riwayat Pesanan",
  cari: "Cari Muthawif",
  muthawif: "Manajemen Muthawif",
};

async function getBookingsForUser(userId: string, role: string) {
  let whereClause = {};
  if (role === "JAMAAH") whereClause = { jamaahId: userId };
  else if (role === "MUTHAWIF") whereClause = { muthawifId: userId };
  else if (role === "AMIR") whereClause = {}; // Admin sees all

  return prisma.booking.findMany({
    where: whereClause,
    include: {
      jamaah: { select: { name: true, email: true } },
      muthawif: { select: { name: true, photoUrl: true, profile: { select: { location: true, rating: true, basePrice: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

const PAGE_SIZE = 10;

async function getMuthawifsPaginated(opts: {
  search?: string;
  status?: string;
  page?: number;
}) {
  const { search = "", status = "", page = 1 } = opts;
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = {};

  if (status && status !== "ALL") {
    where.verificationStatus = status;
  }

  if (search.trim()) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [total, items] = await Promise.all([
    prisma.muthawifProfile.count({ where }),
    prisma.muthawifProfile.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

// Totals for stat cards (always unfiltered)
async function getMuthawifCounts() {
  const [total, review, verified, pending] = await Promise.all([
    prisma.muthawifProfile.count(),
    prisma.muthawifProfile.count({ where: { verificationStatus: "REVIEW" } }),
    prisma.muthawifProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.muthawifProfile.count({ where: { verificationStatus: "PENDING" } }),
  ]);
  return { total, review, verified, pending };
}

export default async function DashboardPage(props: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?redirect=/dashboard");

  const searchParams = await props.searchParams;
  const currentTab = typeof searchParams?.tab === "string" ? searchParams.tab : "beranda";
  const mSearch   = typeof searchParams?.q      === "string" ? searchParams.q      : "";
  const mStatus   = typeof searchParams?.status === "string" ? searchParams.status : "ALL";
  const mPage     = typeof searchParams?.page   === "string" ? Math.max(1, parseInt(searchParams.page, 10) || 1) : 1;

  const searchStartDate = typeof searchParams?.startDate === "string" ? searchParams.startDate : "";
  const searchDuration  = typeof searchParams?.duration === "string" ? searchParams.duration : "";
  const searchLocation  = typeof searchParams?.location === "string" ? searchParams.location : "";

  let bookings: Awaited<ReturnType<typeof getBookingsForUser>> = [];
  let muthawifData: Awaited<ReturnType<typeof getMuthawifsPaginated>> = { items: [], total: 0, page: 1, totalPages: 0 };
  let muthawifCounts = { total: 0, review: 0, verified: 0, pending: 0 };
  let currentMuthawifProfile = null;
  let userRecord = null;
  let dbError = false;
  let foundMuthawifs: any[] = [];

  try {
    bookings = await getBookingsForUser(session.id, session.role);
    if (session.role === "AMIR") {
      [muthawifData, muthawifCounts] = await Promise.all([
        getMuthawifsPaginated({ search: mSearch, status: mStatus, page: mPage }),
        getMuthawifCounts(),
      ]);
    }
    if (session.role === "MUTHAWIF") {
      currentMuthawifProfile = await prisma.muthawifProfile.findUnique({
        where: { userId: session.id },
      });
    }
    userRecord = await prisma.user.findUnique({
      where: { id: session.id },
      // @ts-ignore: Prisma client typings are stale until dev restart
      select: { photoUrl: true }
    });

    // Native inline search for JAMAAH inside dashboard
    if (currentTab === "cari" && session.role === "JAMAAH" && searchStartDate && searchDuration) {
      const start = new Date(searchStartDate);
      const end = new Date(start);
      end.setDate(end.getDate() + parseInt(searchDuration));

      // Build location filter: skip entirely for ALL, otherwise allow exact match OR "BOTH"
      const locFilter = (searchLocation && searchLocation !== "ALL")
        ? { OR: [
            { location: searchLocation as "MAKKAH" | "MADINAH" | "BOTH" },
            { location: "BOTH" as const },
          ] }
        : undefined;

      foundMuthawifs = await prisma.muthawifProfile.findMany({
        where: {
          isAvailable: true,
          verificationStatus: "VERIFIED",
          ...(locFilter ? locFilter : {}),
          // Exclude muthawifs who have an overlapping CONFIRMED/PENDING booking in this period
          user: {
            bookingsAsMuthawif: {
              none: {
                status: { in: ["PENDING", "CONFIRMED"] },
                AND: [
                  { startDate: { lt: end } },
                  { endDate: { gt: start } },
                ],
              },
            },
          },
          // Exclude muthawifs with explicit OFF/BOOKED availability records in this period
          availability: {
            none: {
              AND: [
                { status: { in: ["OFF", "BOOKED"] } },
                { date: { gte: start, lt: end } },
              ],
            },
          },
        },
        include: { user: { select: { id: true, name: true, photoUrl: true, email: true } } },
        orderBy: { rating: "desc" },
        take: 50,
      });
    }

  } catch (error) {
    dbError = true;
  }

  const renderBookings = () => {
    if (dbError) {
      return <div className="alert alert-error">Database belum terhubung. Silakan konfigurasi DATABASE_URL di .env</div>;
    }

    if (bookings.length === 0) {
      return (
        <div style={{ background: "white", borderRadius: "16px", padding: "3rem 1.5rem", textAlign: "center", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ivory-dark)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
          </div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>Belum Ada Pesanan</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9375rem" }}>Belum ada data pesanan saat ini.</p>
          {session.role === "JAMAAH" && (
            <Link href="/#search" className="btn btn-primary" style={{ display: "inline-flex" }}>
              🔍 Cari Muthawif
            </Link>
          )}
          {session.role === "MUTHAWIF" && (
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Pesanan dari Jamaah akan muncul di sini setelah akun Anda diverifikasi.</p>
          )}
        </div>
      );
    }


    if (session.role === "AMIR") {
      return (
        /* ── AMIR: Admin Dashboard View ──────────────────────────── */
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Summary Stats */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", 
            gap: "1rem", 
            marginBottom: "0.5rem" 
          }}>
            {[
              { label: "Total Transaksi", value: bookings.length, icon: "📋", color: "var(--charcoal)" },
              { label: "Terkonfirmasi", value: bookings.filter(b => b.status === "CONFIRMED").length, icon: "✅", color: "var(--emerald)" },
              { label: "Menunggu", value: bookings.filter(b => b.status === "PENDING").length, icon: "⏳", color: "var(--gold)" },
              { label: "Sudah Lunas", value: bookings.filter(b => b.paymentStatus === "PAID").length, icon: "💰", color: "#2563EB" },
              { label: "Total Revenue", value: "Rp " + bookings.filter(b => b.paymentStatus === "PAID").reduce((s, b) => s + b.totalFee, 0).toLocaleString("id-ID"), icon: "📈", color: "var(--emerald)", full: true },
            ].map(stat => (
              <div 
                key={stat.label} 
                style={{ 
                  background: "white", 
                  borderRadius: "16px", 
                  padding: "1.25rem", 
                  border: "1px solid var(--border)", 
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "100px",
                  gridColumn: stat.full ? "1 / -1" : "auto"
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>{stat.label}</div>
                  <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800, fontSize: "1.25rem", color: stat.color, overflow: "hidden", textOverflow: "ellipsis" }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Transactions List */}
          <div style={{ background: "white", borderRadius: "18px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "1.25rem 1.5rem", background: "var(--ivory-dark)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 800 }}>Daftar Transaksi Terbaru</h3>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>{bookings.length} Data</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column" }}>
              {bookings.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada data transaksi.</div>
              ) : (
                bookings.map((booking, idx) => {
                  const color = STATUS_COLORS[booking.status] || { bg: "var(--ivory-dark)", color: "var(--text-muted)" };
                  const location = booking.muthawif.profile?.location || "—";
                  return (
                    <div 
                      key={booking.id} 
                      style={{ 
                        padding: "1.25rem 1.5rem", 
                        borderBottom: idx === bookings.length - 1 ? "none" : "1px solid var(--border)",
                        background: idx % 2 === 0 ? "white" : "var(--ivory-pale)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", background: "var(--ivory-dark)", padding: "0.2rem 0.5rem", borderRadius: "6px" }}>
                          #{(booking.id.includes("-") ? booking.id.split("-")[0] : booking.id.slice(0, 8)).toUpperCase()}
                        </span>
                        <span style={{ padding: "0.375rem 0.75rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 700, background: color.bg, color: color.color }}>
                          {STATUS_LABELS[booking.status] || booking.status}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                        <div>
                          <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Jamaah & Muthawif</div>
                          <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{booking.jamaah.name}</div>
                          <div style={{ fontSize: "0.8125rem", color: "var(--emerald)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.125rem" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                            {booking.muthawif.name}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Total Bayar</div>
                          <div style={{ fontWeight: 800, fontSize: "1.0625rem", color: booking.paymentStatus === "PAID" ? "var(--emerald)" : "var(--charcoal)" }}>
                            Rp {booking.totalFee.toLocaleString("id-ID")}
                          </div>
                          <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: booking.paymentStatus === "PAID" ? "var(--emerald)" : "var(--gold)", marginTop: "0.125rem" }}>
                            {booking.paymentStatus === "PAID" ? "LUNAS" : "BELUM BAYAR"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "1.5rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--border)", fontSize: "0.8125rem" }}>
                        <div>
                          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Lokasi:</span> <span style={{ fontWeight: 700 }}>{location === "BOTH" ? "Makkah & Madinah" : location}</span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Tanggal:</span> <span style={{ fontWeight: 700 }}>{new Date(booking.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--ivory-dark)", textAlign: "center" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--emerald)" }}>
                Total Revenue Lunas: Rp {bookings.filter(b => b.paymentStatus === "PAID").reduce((s, b) => s + b.totalFee, 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {bookings.map((booking) => {
          const status = STATUS_LABELS[booking.status] || booking.status;
          const color = STATUS_COLORS[booking.status] || { bg: "#F0EBE1", color: "#8A8A8A" };
          const location = booking.muthawif.profile?.location || "";
          const initials = booking.muthawif.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
          // Handle both UUID (hyphenated) and CUID (no hyphens)
          const shortId = booking.id.includes("-")
            ? booking.id.split("-")[0].toUpperCase()
            : booking.id.slice(0, 8).toUpperCase();
          
          const startDate = new Date(booking.startDate);
          const endDate = new Date(booking.endDate);
          const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

          let displayName = booking.muthawif.name;
          let nameLabel = "Muthawif";
          if (session.role === "MUTHAWIF") {
            displayName = booking.jamaah.name;
            nameLabel = "Jamaah";
          }

          const isPaid = booking.paymentStatus === "PAID";
          const isUnpaidActive = booking.paymentStatus === "UNPAID" && booking.status !== "CANCELLED";

          return (
            <div key={booking.id} style={{ 
              background: "white", 
              borderRadius: "18px", 
              border: "1px solid var(--border)", 
              boxShadow: "var(--shadow-sm)", 
              overflow: "hidden" 
            }}>
              {/* Header bar */}
              <div style={{ 
                padding: "0.875rem 1.25rem", 
                background: "var(--ivory-dark)", 
                borderBottom: "1px solid var(--border)", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Order</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", fontWeight: 800, color: "var(--charcoal)", background: "white", padding: "0.15rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                    #{shortId}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                  <span style={{ padding: "0.25rem 0.75rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 700, background: color.bg, color: color.color }}>
                    {status}
                  </span>
                  {isPaid && (
                    <span style={{ padding: "0.25rem 0.75rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 700, background: "var(--emerald-pale)", color: "var(--emerald)" }}>
                      Lunas ✓
                    </span>
                  )}
                  {isUnpaidActive && (
                    <span style={{ padding: "0.25rem 0.75rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 700, background: "#FEF9C3", color: "#A16207" }}>
                      Belum Bayar
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "1.25rem" }}>
                {/* Profile row */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ 
                    width: 52, height: 52, borderRadius: "50%", 
                    background: "linear-gradient(135deg, var(--emerald), var(--emerald-light))", 
                    color: "white", display: "flex", alignItems: "center", justifyContent: "center", 
                    fontWeight: 800, fontSize: "1.125rem", flexShrink: 0, overflow: "hidden",
                    border: "2px solid var(--emerald-pale)"
                  }}>
                    {booking.muthawif.photoUrl 
                      ? <img src={booking.muthawif.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> 
                      : initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>
                      {nameLabel}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--charcoal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {displayName}
                    </div>
                    {location && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.2rem" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                        {location === "BOTH" ? "Makkah & Madinah" : location}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info grid: 3 columns on mobile */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr 1fr", 
                  gap: "0.75rem",
                  padding: "1rem",
                  background: "var(--ivory)",
                  borderRadius: "12px",
                  marginBottom: "1rem"
                }}>
                  <div>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Berangkat</div>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--charcoal)" }}>
                      {startDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {startDate.getFullYear()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Durasi</div>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--charcoal)" }}>{durationDays} Hari</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Total</div>
                    <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: isPaid ? "var(--emerald)" : "var(--charcoal)" }}>
                      Rp {booking.totalFee.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>

                {/* Payment CTA */}
                {session.role === "JAMAAH" && isUnpaidActive && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <PaymentSimulationButton bookingId={booking.id} amount={booking.totalFee} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const sidebarNavItems = [
    {
      href: "/dashboard?tab=beranda",
      label: "Riwayat Pesanan",
      desc: "Semua pesanan umrah",
      emoji: "📋",
      tab: "beranda",
      show: true,
    },
    {
      href: "/dashboard?tab=cari",
      label: "Cari Muthawif",
      desc: "Temukan muthawif tersedia",
      emoji: "🔍",
      tab: "cari",
      show: session.role === "JAMAAH",
    },
    {
      href: "/dashboard?tab=muthawif",
      label: "Manajemen Muthawif",
      desc: "Kelola & verifikasi akun",
      emoji: "👥",
      tab: "muthawif",
      show: session.role === "AMIR",
    },
  ].filter((item) => item.show);


  return (
    <div className="dashboard-fullscreen">
      {/* ══ SIDEBAR ══ */}
      <aside className="dashboard-sidebar-fixed" style={{ background: "linear-gradient(170deg, #0d2818 0%, #1B6B4A 70%, #27956A 100%)", borderRight: "none" }}>

        {/* Brand header */}
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
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.07em", marginTop: 2 }}>
              MARKETPLACE MUTHAWIF
            </div>
          </div>
        </div>



        {/* Nav links */}
        <div className="sidebar-scrollable" style={{ padding: "0.875rem 0.75rem", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: "0.5875rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: "0.375rem", padding: "0 0.25rem" }}>
            NAVIGASI
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {sidebarNavItems.map((item) => {
              const isActive = currentTab === item.tab;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="dsb-nav-lnk"
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.6875rem 0.75rem",
                    borderRadius: "12px",
                    textDecoration: "none",
                    background: isActive ? "rgba(255,255,255,0.14)" : "transparent",
                    border: isActive ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
                    {item.emoji}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: isActive ? "white" : "rgba(255,255,255,0.8)", fontWeight: isActive ? 700 : 600, fontSize: "0.875rem", lineHeight: 1.2 }}>
                      {item.label}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.625rem", marginTop: "0.125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.desc}
                    </div>
                  </div>
                  {isActive && (
                    <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#E4B55A", flexShrink: 0 }} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main-area">
        <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--charcoal)" }}>
              {TAB_TITLES[currentTab] || "Dashboard"}
            </h2>
          </div>
          <AmirHeaderPanel name={session.name} email={session.email} role={session.role} avatarUrl={userRecord?.photoUrl} />
        </header>

        <main style={{ padding: "clamp(1rem, 4vw, 2rem)", overflowY: "auto", flex: 1, minHeight: 0 }}>
          <div style={{ padding: 0, width: "100%" }}>
            {/* Alerts */}
            {session.role === "MUTHAWIF" && currentMuthawifProfile?.verificationStatus === "PENDING" && (
              <div className="alert" style={{ backgroundColor: "#FEF2F2", color: "var(--error)", marginBottom: "2rem", border: "1px solid #FCA5A5" }}>
                <strong>Akun Anda Sedang Direview!</strong> Profil biodata dan dokumen Anda butuh persetujuan dari AMIR sebelum Anda dapat menerima pesanan umrah.
              </div>
            )}

            {/* TAB CONTENT */}
            {currentTab === "beranda" && renderBookings()}
            {currentTab === "cari" && session.role === "JAMAAH" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
                <div style={{ background: "white", padding: "1.25rem 1.5rem", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <DashboardSearchForm 
                    initialStartDate={searchStartDate} 
                    initialDuration={searchDuration} 
                    initialLocation={searchLocation} 
                  />
                </div>

                {!searchStartDate || !searchDuration ? (
                  <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.4)", borderRadius: "16px", border: "1px dashed var(--border)" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--emerald-pale)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)", marginBottom: "1rem" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "0.5rem" }}>Cari Sesuai Rencana Ibadah</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: "400px", margin: "0 auto", lineHeight: "1.6" }}>
                      Tentukan tanggal, durasi, dan lokasi operasional di filter atas untuk menemukan Muthawif terbaik yang siap mendampingi Anda di Tanah Suci.
                    </p>
                  </div>
                ) : (
                  <DashboardSearchList 
                    muthawifs={foundMuthawifs} 
                    startDate={searchStartDate} 
                    duration={searchDuration} 
                  />
                )}
              </div>
            )}
            {currentTab === "muthawif" && session.role === "AMIR" && (() => {
              const { total: countTotal, review: countReview, verified: countActive, pending: countIncomplete } = muthawifCounts;
              const countRejected = countTotal - countReview - countActive - countIncomplete;

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* Compact metric strip */}
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
                    gap: "1rem", 
                    marginBottom: "1.5rem" 
                  }}>
                    {[
                      { label: "Total", value: countTotal, color: "var(--charcoal)", accent: "var(--ivory-dark)" },
                      { label: "Review", value: countReview, color: "var(--gold)", accent: "#FEF9C3", dot: countReview > 0 },
                      { label: "Aktif", value: countActive, color: "var(--emerald)", accent: "var(--emerald-pale)" },
                      { label: "Draft", value: countIncomplete, color: "var(--text-muted)", accent: "#F3F4F6" },
                    ].map(m => (
                      <div 
                        key={m.label} 
                        style={{ 
                          background: "white", 
                          borderRadius: "14px", 
                          border: "1px solid var(--border)", 
                          padding: "1.25rem", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "1rem", 
                          position: "relative", 
                          overflow: "hidden",
                          boxShadow: "var(--shadow-sm)"
                        }}
                      >
                        <div style={{ width: "6px", height: "40px", borderRadius: "99px", background: m.accent, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>{m.label}</div>
                          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: m.color, lineHeight: 1.1 }}>{m.value}</div>
                        </div>
                        {m.dot && <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", width: "8px", height: "8px", borderRadius: "50%", background: "var(--error)" }} />}
                      </div>
                    ))}
                  </div>

                  <MuthawifDataTable
                    muthawifs={muthawifData.items}
                    total={muthawifData.total}
                    page={muthawifData.page}
                    totalPages={muthawifData.totalPages}
                    currentSearch={mSearch}
                    currentStatus={mStatus}
                    counts={{ total: countTotal, REVIEW: countReview, VERIFIED: countActive, PENDING: countIncomplete, REJECTED: Math.max(0, countRejected) }}
                  />
                </div>
              );
            })()}
          </div>
        </main>
      </div>
    </div>
  );
}
