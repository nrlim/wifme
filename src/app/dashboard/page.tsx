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
    return (
      <>
      {dbError ? (
        <div className="alert alert-error">Database belum terhubung. Silakan konfigurasi DATABASE_URL di .env</div>
      ) : bookings.length === 0 ? (
        <div style={{ background: "white", borderRadius: "12px", padding: "3rem", textAlign: "center", border: "1px solid var(--border)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ivory-dark)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
          </div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>Belum Ada Pesanan</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Belum ada data pesanan saat ini.</p>
          {session.role === "JAMAAH" && (
            <Link href="/#search" className="btn btn-primary">Cari Muthawif</Link>
          )}
        </div>
      ) : session.role === "AMIR" ? (
        /* ── AMIR: Wide admin dashboard view ──────────────────────────── */
        <>
          {/* Summary Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Total Transaksi", value: bookings.length, icon: "📋", color: "var(--charcoal)" },
              { label: "Terkonfirmasi", value: bookings.filter(b => b.status === "CONFIRMED").length, icon: "✅", color: "var(--emerald)" },
              { label: "Menunggu", value: bookings.filter(b => b.status === "PENDING").length, icon: "⏳", color: "var(--gold)" },
              { label: "Sudah Lunas", value: bookings.filter(b => b.paymentStatus === "PAID").length, icon: "💰", color: "#2563EB" },
              { label: "Total Revenue", value: "Rp " + bookings.filter(b => b.paymentStatus === "PAID").reduce((s, b) => s + b.totalFee, 0).toLocaleString("id-ID"), icon: "📈", color: "var(--emerald)" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "white", borderRadius: "14px", padding: "1.125rem 1.25rem", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: "1.25rem", marginBottom: "0.375rem" }}>{stat.icon}</div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>{stat.label}</div>
                <div style={{ fontWeight: 800, fontSize: "1.25rem", color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Wide Data Table */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr 0.9fr 1fr 1fr 0.9fr", gap: "0.75rem", padding: "0.875rem 1.5rem", background: "var(--ivory-dark)", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
              {["Order ID", "Jamaah → Muthawif", "Lokasi", "Tanggal", "Total", "Status"].map(h => (
                <div key={h} style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
              ))}
            </div>
            {bookings.map((booking, idx) => {
              const color = STATUS_COLORS[booking.status] || { bg: "var(--ivory-dark)", color: "var(--text-muted)" };
              const location = booking.muthawif.profile?.location || "—";
              return (
                <div key={booking.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr 0.9fr 1fr 1fr 0.9fr", gap: "0.75rem", padding: "1rem 1.5rem", borderBottom: idx < bookings.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", background: idx % 2 === 0 ? "white" : "var(--ivory)" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", fontWeight: 700, color: "var(--charcoal)", background: "var(--ivory-dark)", padding: "0.2rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)" }}>#{booking.id.split("-")[0].toUpperCase()}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--charcoal)" }}>{booking.jamaah.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.125rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                      {booking.muthawif.name}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>{location === "BOTH" ? "Makkah & Madinah" : location}</div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--charcoal)" }}>{new Date(booking.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: booking.paymentStatus === "PAID" ? "var(--emerald)" : "var(--charcoal)" }}>Rp {booking.totalFee.toLocaleString("id-ID")}</div>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 600, marginTop: "0.125rem", color: booking.paymentStatus === "PAID" ? "var(--emerald)" : "var(--gold)" }}>{booking.paymentStatus === "PAID" ? "Lunas" : "Belum Bayar"}</div>
                  </div>
                  <span style={{ padding: "0.25rem 0.625rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 700, background: color.bg, color: color.color, whiteSpace: "nowrap" }}>{STATUS_LABELS[booking.status] || booking.status}</span>
                </div>
              );
            })}
            <div style={{ padding: "0.875rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--ivory-dark)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600 }}>{bookings.length} transaksi ditemukan</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--emerald)" }}>Revenue Lunas: Rp {bookings.filter(b => b.paymentStatus === "PAID").reduce((s, b) => s + b.totalFee, 0).toLocaleString("id-ID")}</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {bookings.map((booking) => {
            const status = STATUS_LABELS[booking.status] || booking.status;
            const color = STATUS_COLORS[booking.status] || { bg: "var(--ivory-dark)", color: "var(--text-muted)" };
            const location = booking.muthawif.profile?.location || "";
            const initials = booking.muthawif.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            
            const startDateStr = new Date(booking.startDate);
            const endDateStr = new Date(booking.endDate);
            const durationDays = Math.max(1, Math.round((endDateStr.getTime() - startDateStr.getTime()) / (1000 * 60 * 60 * 24)));

            let displayName = booking.muthawif.name;
            if (session.role === "MUTHAWIF") displayName = "Jamaah: " + booking.jamaah.name;
            else if (session.role === "AMIR") displayName = booking.jamaah.name + " ➔ " + booking.muthawif.name;

            return (
              <div key={booking.id} style={{ display: "flex", flexDirection: "column", background: "white", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", overflow: "hidden" }}>
                {/* Header (Booking ID & Status) */}
                <div style={{ padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ivory)", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1px" }}>ORDER ID</span>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--charcoal)", fontFamily: "monospace" }}>#{booking.id.split('-')[0].toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <span style={{ padding: "0.25rem 0.75rem", borderRadius: "99px", fontSize: "0.8125rem", fontWeight: 600, background: color.bg, color: color.color }}>
                      {status}
                    </span>
                    {booking.paymentStatus === "PAID" && (
                      <span style={{ padding: "0.25rem 0.75rem", borderRadius: "99px", fontSize: "0.8125rem", fontWeight: 700, background: "var(--emerald-pale)", color: "var(--emerald)" }}>
                        Lunas
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center" }}>
                  {/* Profile Info */}
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", flex: "1 1 250px" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--emerald), var(--emerald-light))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.25rem", flexShrink: 0, overflow: "hidden" }}>
                      {booking.muthawif.photoUrl ? <img src={booking.muthawif.photoUrl} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : initials}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>
                        {session.role === "MUTHAWIF" ? "Pesanan dari Jamaah" : session.role === "AMIR" ? "Transaksi" : "Muthawif"}
                      </div>
                      <h4 style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--charcoal)" }}>{displayName}</h4>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.25rem" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                        {location}
                      </div>
                    </div>
                  </div>

                  {/* Schedule Info */}
                  <div style={{ flex: "1 1 200px", display: "flex", gap: "2rem" }}>
                    <div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.375rem" }}>Tanggal Berangkat</div>
                      <div style={{ fontWeight: 700, color: "var(--charcoal)", fontSize: "1rem" }}>{new Date(booking.startDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.375rem" }}>Durasi</div>
                      <div style={{ fontWeight: 700, color: "var(--charcoal)", fontSize: "1rem" }}>{durationDays} Hari</div>
                    </div>
                  </div>

                  {/* Pricing & Action */}
                  <div style={{ flex: "1 1 200px", textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "center", borderLeft: "1px dashed var(--border)", paddingLeft: "1.5rem" }}>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>Total Pembayaran</div>
                    <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--charcoal)" }}>{booking.paymentStatus === "UNPAID" && booking.status !== "CANCELLED" && session.role === "JAMAAH" ? "Belum Lunas" : `Rp ${booking.totalFee.toLocaleString("id-ID")}`}</div>
                    
                    {session.role === "JAMAAH" && booking.paymentStatus === "UNPAID" && booking.status !== "CANCELLED" && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <PaymentSimulationButton bookingId={booking.id} amount={booking.totalFee} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
    );
  };

  return (
    <div className="dashboard-fullscreen">
      {/* Sidebar Menu */}
      <aside className="dashboard-sidebar-fixed">
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--emerald), var(--emerald-light))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
          </div>
          <div>
            <h1 style={{ fontSize: "1.0625rem", fontWeight: 800, lineHeight: 1.2, color: "var(--charcoal)" }}>Wif-Me</h1>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Panel Manajemen</p>
          </div>
        </div>

        <div className="sidebar-scrollable" style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.75rem", textTransform: "uppercase" }}>
            Menu Utama
          </p>
          <nav className="dashboard-nav-flex">
            <Link href="/dashboard?tab=beranda" className={`sidebar-link ${currentTab === "beranda" ? "active" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "0.625rem" }}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Riwayat Pesanan
            </Link>

            {session.role === "JAMAAH" && (
              <Link href="/dashboard?tab=cari" className={`sidebar-link ${currentTab === "cari" ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "0.625rem" }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Cari Muthawif
              </Link>
            )}

            {session.role === "AMIR" && (
              <Link href="/dashboard?tab=muthawif" className={`sidebar-link ${currentTab === "muthawif" ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "0.625rem" }}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                Manajemen Muthawif
              </Link>
            )}
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

        <main style={{ padding: "2rem", overflowY: "auto", flex: 1, minHeight: 0 }}>
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                    {[
                      { label: "Total", value: countTotal, color: "var(--charcoal)", accent: "var(--ivory-dark)" },
                      { label: "Menunggu Review", value: countReview, color: "#A16207", accent: "#FEF9C3", dot: countReview > 0 },
                      { label: "Aktif", value: countActive, color: "var(--emerald)", accent: "var(--emerald-pale)" },
                      { label: "Belum Lengkap", value: countIncomplete, color: "#6B7280", accent: "#F3F4F6" },
                    ].map(m => (
                      <div key={m.label} style={{ background: "white", borderRadius: "12px", border: "1px solid var(--border)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.875rem", position: "relative", overflow: "hidden" }}>
                        <div style={{ width: 8, height: 44, borderRadius: "99px", background: m.accent, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", lineHeight: 1 }}>{m.label}</div>
                          <div style={{ fontSize: "1.625rem", fontWeight: 800, color: m.color, lineHeight: 1.1, marginTop: "0.25rem" }}>{m.value}</div>
                        </div>
                        {m.dot && <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", width: 8, height: 8, borderRadius: "50%", background: "var(--error)" }} />}
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
