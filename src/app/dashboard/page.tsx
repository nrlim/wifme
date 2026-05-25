import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MuthawifDataTable } from "./MuthawifDataTable";
import { AmirHeaderPanel } from "./AmirHeaderPanel";
import DashboardSearchForm from "./DashboardSearchForm";
import DashboardSearchList from "./DashboardSearchList";
import ChatWidget from "@/components/ChatWidget";
import BookingStatusButton from "./BookingStatusButton";
import PaymentVerificationButton from "./PaymentVerificationButton";
import ReviewButton from "@/components/ReviewButton";
import MidtransSimulator from "@/components/wallet/MidtransSimulator";
import PayoutManagement from "@/components/wallet/PayoutManagement";
import FeeSettings from "@/components/wallet/FeeSettings";
import LocationSettings from "@/components/wallet/LocationSettings";
import ServiceSettings from "@/components/wallet/ServiceSettings";
import LanguageSettings from "@/components/wallet/LanguageSettings";
import { getPayouts, getGlobalSettings } from "@/actions/finance";
import { CopyButton } from "./CopyButton";
import { getFeeConfig, type FeeConfig } from "@/lib/fee";
import MobileSidebarDrawer from "@/components/MobileSidebarDrawer";
import JamaahMobileNav from "./JamaahMobileNav";
import EarningsDashboard from "@/components/earnings/EarningsDashboard";
import PromoManagement from "@/components/wallet/PromoManagement";
import { getPromotions } from "@/actions/promotions";
import ActivityManagement from "@/components/admin/ActivityManagement";
import TableToolbar from "@/components/TableToolbar";
import Pagination from "@/components/Pagination";
import { BarChart3, Search, ClipboardList, Users, Banknote, Settings, Tag, MapPin, Briefcase, Languages, ListTodo, CreditCard } from "lucide-react";

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

type DashboardBooking = Prisma.BookingGetPayload<{
  include: {
    jamaah: { select: { name: true; email: true } };
    muthawif: {
      select: {
        id: true;
        name: true;
        photoUrl: true;
        profile: {
          select: {
            basePrice: true;
            operatingAreas: true;
            rating: true;
            totalReviews: true;
            experience: true;
            bio: true;
            specializations: true;
            languages: true;
          };
        };
      };
    };
    review: { select: { id: true } };
  };
}>;

type GlobalSettingsForDashboard = React.ComponentProps<typeof FeeSettings>["initialSettings"] &
  React.ComponentProps<typeof LocationSettings>["initialSettings"] &
  React.ComponentProps<typeof ServiceSettings>["initialSettings"] &
  React.ComponentProps<typeof LanguageSettings>["initialSettings"];

type DashboardSearchMuthawif = Prisma.MuthawifProfileGetPayload<{
  include: { user: { select: { id: true; name: true; photoUrl: true; email: true } } };
}>;

const TAB_TITLES: Record<string, string> = {
  analytics: "Dashboard Analitik",
  beranda: "Riwayat Pesanan",
  cari: "Cari Muthawif",
  pembayaran: "Pembayaran",
  pengaturan: "Pengaturan Akun",
  muthawif: "Manajemen Muthawif",
  penarikan: "Manajemen Penarikan",
  biaya: "Pengaturan Biaya",
  promo: "Kode Promo & Diskon",
  master_lokasi: "Master Wilayah Operasi",
  master_layanan: "Master Jenis Layanan",
  master_bahasa: "Master Bahasa",
  simulator: "Simulator Pembayaran",
  kegiatan: "Katalog Kegiatan",
};

async function getBookingsForUser(opts: {
  userId: string;
  role: string;
  search?: string;
  status?: string;
  sort?: string;
  page?: number;
}) {
  const { userId, role, search = "", status = "ALL", sort = "terbaru", page = 1 } = opts;
  const skip = (page - 1) * PAGE_SIZE;

  const whereClause: any = {};
  if (role === "JAMAAH") whereClause.jamaahId = userId;
  else if (role === "MUTHAWIF") whereClause.muthawifId = userId;
  // AMIR sees all

  const VALID_BOOKING_STATUSES = ["PENDING", "PAYMENT_REVIEW", "CONFIRMED", "CANCELLED", "COMPLETED", "REJECTED"];
  if (status && status !== "ALL" && VALID_BOOKING_STATUSES.includes(status)) {
    whereClause.status = status;
  }

  if (search.trim()) {
    whereClause.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { jamaah: { name: { contains: search, mode: "insensitive" } } },
      { muthawif: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "terlama") orderBy = { createdAt: "asc" };
  if (sort === "termahal") orderBy = { totalFee: "desc" };
  if (sort === "termurah") orderBy = { totalFee: "asc" };

  const [total, items] = await Promise.all([
    prisma.booking.count({ where: whereClause }),
    prisma.booking.findMany({
      where: whereClause,
      include: {
        jamaah: { select: { name: true, email: true } },
        muthawif: { select: { id: true, name: true, photoUrl: true, profile: { select: { basePrice: true, operatingAreas: true, rating: true, totalReviews: true, experience: true, bio: true, specializations: true, languages: true } } } },
        review: { select: { id: true } },
      },
      orderBy,
      skip,
      take: PAGE_SIZE,
    })
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
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

  const VALID_MUTHAWIF_STATUSES = ["PENDING", "REVIEW", "VERIFIED", "REJECTED"];
  if (status && status !== "ALL" && VALID_MUTHAWIF_STATUSES.includes(status)) {
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
  const defaultTab = session.role === "AMIR" ? "analytics" : "beranda";
  const currentTab = typeof searchParams?.tab === "string" ? searchParams.tab : defaultTab;
  const mSearch = typeof searchParams?.q === "string" ? searchParams.q : "";
  const mStatus = typeof searchParams?.status === "string" ? searchParams.status : "ALL";
  const mPage = typeof searchParams?.page === "string" ? Math.max(1, parseInt(searchParams.page, 10) || 1) : 1;

  const searchStartDate = typeof searchParams?.startDate === "string" ? searchParams.startDate : "";
  const searchDuration = typeof searchParams?.duration === "string" ? searchParams.duration : "";
  const searchLocation = typeof searchParams?.location === "string" ? searchParams.location : "";

  const mSort = typeof searchParams?.sort === "string" ? searchParams.sort : "terbaru";

  let bookingData: Awaited<ReturnType<typeof getBookingsForUser>> = { items: [], total: 0, page: 1, totalPages: 0 };
  let muthawifData: Awaited<ReturnType<typeof getMuthawifsPaginated>> = { items: [], total: 0, page: 1, totalPages: 0 };
  let muthawifCounts = { total: 0, review: 0, verified: 0, pending: 0 };
  let currentMuthawifProfile = null;
  let userRecord = null;
  let dbError = false;
  let foundMuthawifs: DashboardSearchMuthawif[] = [];

  let payoutData: Awaited<ReturnType<typeof getPayouts>> = { items: [], total: 0, page: 1, totalPages: 0 };
  let globalSettings: GlobalSettingsForDashboard = null;
  let feeConfig: FeeConfig = { feeType: "PERCENT", feeValue: 0 };
  let promoData: Awaited<ReturnType<typeof getPromotions>> = { items: [], total: 0, page: 1, totalPages: 0 };
  let activitiesData: Prisma.ActivityGetPayload<{}>[] = [];
  let activityBundlesData: Prisma.ActivityBundleGetPayload<{ include: { items: { include: { activity: true } } } }>[] = [];

  try {
    [bookingData, feeConfig] = await Promise.all([
      getBookingsForUser({
        userId: session.id,
        role: session.role,
        search: mSearch,
        status: mStatus,
        sort: mSort,
        page: mPage,
      }),
      getFeeConfig(),
    ]);
    if (session.role === "AMIR") {
      const [nextMuthawifData, nextMuthawifCounts, nextPayoutData, nextGlobalSettings, nextPromoData, nextActivities, nextBundles] = await Promise.all([
        getMuthawifsPaginated({ search: mSearch, status: mStatus, page: mPage }),
        getMuthawifCounts(),
        getPayouts({ search: mSearch, status: mStatus, page: mPage }),
        getGlobalSettings(),
        getPromotions({ page: mPage }),
        prisma.activity.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.activityBundle.findMany({ orderBy: { sortOrder: "asc" }, include: { items: { include: { activity: true } } } }),
      ]);
      muthawifData = nextMuthawifData;
      muthawifCounts = nextMuthawifCounts;
      payoutData = nextPayoutData;
      globalSettings = nextGlobalSettings as unknown as GlobalSettingsForDashboard;
      promoData = nextPromoData;
      activitiesData = nextActivities;
      activityBundlesData = nextBundles;
    }
    if (session.role === "MUTHAWIF") {
      currentMuthawifProfile = await prisma.muthawifProfile.findUnique({
        where: { userId: session.id },
      });
    }
    userRecord = await prisma.user.findUnique({
      where: { id: session.id },
      select: { photoUrl: true },
    });

    // Native inline search for JAMAAH inside dashboard
    if (currentTab === "cari" && session.role === "JAMAAH" && searchStartDate && searchDuration) {
      const start = new Date(searchStartDate);
      const end = new Date(start);
      end.setDate(end.getDate() + parseInt(searchDuration));

      // Build location filter: skip entirely for ALL, otherwise allow exact match OR "BOTH"
      const locFilters = searchLocation && searchLocation !== "ALL"
        ? { operatingAreas: { has: searchLocation } }
        : {};

      foundMuthawifs = await prisma.muthawifProfile.findMany({
        where: {
          isAvailable: true,
          verificationStatus: "VERIFIED",
          ...locFilters,
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
    console.error("Dashboard fetch error:", error);
    dbError = true;
  }

  const bookings = bookingData.items;
  const bookingsTotal = bookingData.total;

  const renderBookings = () => {
    if (dbError) {
      return <div className="alert alert-error">Database belum terhubung. Silakan konfigurasi DATABASE_URL di .env</div>;
    }

    const toolbar = (
      <TableToolbar
        searchPlaceholder="Cari ID, Jamaah, atau Muthawif..."
        filters={[
          { label: "Semua", value: "ALL" },
          { label: "Menunggu", value: "PENDING" },
          { label: "Dikonfirmasi", value: "CONFIRMED" },
          { label: "Selesai", value: "COMPLETED" },
          { label: "Dibatalkan", value: "CANCELLED" }
        ]}
        sorts={[
          { label: "Terbaru", value: "terbaru" },
          { label: "Terlama", value: "terlama" },
          { label: "Harga Tertinggi", value: "termahal" },
          { label: "Harga Terendah", value: "termurah" }
        ]}
      />
    );

    const pagination = bookingData.totalPages > 1 ? (
      <Pagination page={bookingData.page} totalPages={bookingData.totalPages} />
    ) : null;

    if (bookings.length === 0 && !mSearch && mStatus === "ALL") {
      return (
        <div style={{ background: "white", borderRadius: "16px", padding: "3rem 1.5rem", textAlign: "center", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ivory-dark)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>
          </div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>Belum Ada Pesanan</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.9375rem" }}>Belum ada data pesanan saat ini.</p>
          {session.role === "JAMAAH" && (
            <Link href="/dashboard?tab=cari" className="btn btn-primary" style={{ display: "inline-flex" }}>
              Cari Muthawif
            </Link>
          )}
          {session.role === "MUTHAWIF" && (
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Pesanan dari Jamaah akan muncul di sini setelah akun Anda diverifikasi.</p>
          )}
        </div>
      );
    }


    if (session.role === "AMIR") {
      const totalRevenue = bookings.filter(b => b.paymentStatus === "PAID").reduce((s, b) => s + b.totalFee, 0);
      const totalConfirmed = bookings.filter(b => b.status === "CONFIRMED").length;
      const totalPending = bookings.filter(b => b.status === "PENDING").length;
      const totalPaid = bookings.filter(b => b.paymentStatus === "PAID").length;
      const totalCompleted = bookings.filter(b => b.status === "COMPLETED").length;

      return (
        /* ── AMIR: Full-Width Admin Dashboard ──────────────────────────── */
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

          {/* ── KPI Cards Row ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
            gap: "1rem",
          }}>
            {[
              {
                label: "Total Booking",
                value: bookings.length,
                sub: "Semua waktu",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                  </svg>
                ),
                accentColor: "#6366F1",
                bgAccent: "#EEF2FF",
                valueColor: "var(--charcoal)",
              },
              {
                label: "Dikonfirmasi",
                value: totalConfirmed,
                sub: `${bookings.length ? Math.round((totalConfirmed / bookings.length) * 100) : 0}% dari total`,
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ),
                accentColor: "var(--emerald)",
                bgAccent: "var(--emerald-pale)",
                valueColor: "var(--emerald)",
              },
              {
                label: "Menunggu",
                value: totalPending,
                sub: "Perlu tindakan",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
                accentColor: "var(--gold)",
                bgAccent: "rgba(196,151,59,0.1)",
                valueColor: "var(--gold)",
              },
              {
                label: "Selesai",
                value: totalCompleted,
                sub: "Layanan tuntas",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
                  </svg>
                ),
                accentColor: "#0EA5E9",
                bgAccent: "#F0F9FF",
                valueColor: "#0EA5E9",
              },
              {
                label: "Sudah Lunas",
                value: totalPaid,
                sub: `${bookings.length ? Math.round((totalPaid / bookings.length) * 100) : 0}% konversi`,
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                ),
                accentColor: "#10B981",
                bgAccent: "#F0FDF4",
                valueColor: "#10B981",
              },
            ].map(card => (
              <div key={card.label} style={{
                background: "white",
                borderRadius: 18,
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Left color accent bar */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: 4, background: card.accentColor, borderRadius: "4px 0 0 4px",
                }} />
                {/* Icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: card.bgAccent,
                  color: card.accentColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {card.icon}
                </div>
                {/* Value */}
                <div>
                  <div style={{
                    fontSize: "clamp(1.375rem, 3vw, 1.875rem)",
                    fontWeight: 900,
                    color: card.valueColor,
                    lineHeight: 1,
                    marginBottom: "0.375rem",
                    letterSpacing: "-0.02em",
                  }}>
                    {card.value.toLocaleString("id-ID")}
                  </div>
                  <div style={{ fontSize: "0.6875rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    {card.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Revenue Hero Card ── */}
          <div style={{
            background: "linear-gradient(135deg, var(--emerald) 0%, #1a8f62 50%, #27956A 100%)",
            borderRadius: 20,
            padding: "1.5rem 2rem",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Background decoration */}
            <div style={{
              position: "absolute", right: -30, top: -30,
              width: 160, height: 160, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
            }} />
            <div style={{
              position: "absolute", right: 60, bottom: -40,
              width: 100, height: 100, borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem" }}>
                Total Revenue Lunas
              </div>
              <div style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>
                Rp {totalRevenue.toLocaleString("id-ID")}
              </div>
              <div style={{ fontSize: "0.8125rem", opacity: 0.65, marginTop: "0.5rem" }}>
                Dari {totalPaid} transaksi lunas
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", position: "relative" }}>
              {[
                { label: "Rata-rata", value: totalPaid > 0 ? "Rp " + Math.round(totalRevenue / totalPaid).toLocaleString("id-ID") : "—" },
                { label: "Pending Bayar", value: (bookings.length - totalPaid) + " transaksi" },
              ].map(m => (
                <div key={m.label} style={{
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: "0.75rem 1rem",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(4px)",
                  minWidth: 120,
                }}>
                  <div style={{ fontSize: "0.625rem", fontWeight: 800, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>{m.label}</div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 800 }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Transactions Table ── */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "1rem" }}>{toolbar}</div>

            <div style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              overflow: "hidden",
            }}>
              {/* Table Header */}
              <div style={{
                padding: "1.125rem 1.5rem",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "white",
              }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.125rem" }}>
                    Daftar Transaksi
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                    Menampilkan {bookings.length} dari {bookingsTotal} transaksi terdaftar
                  </p>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  background: "var(--emerald-pale)", color: "var(--emerald)",
                  padding: "0.375rem 0.875rem", borderRadius: 99,
                  fontSize: "0.75rem", fontWeight: 800,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--emerald)" }} />
                  Live Data
                </div>
              </div>

              {/* Table — Desktop: full columns / Mobile: card-style */}
              {bookings.length === 0 ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Belum ada data transaksi.
                </div>
              ) : (
                <>
                  {/* Desktop Table Header row */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1.5fr 1.5fr 120px 100px 130px",
                    padding: "0.75rem 1.5rem",
                    background: "var(--ivory)",
                    borderBottom: "1px solid var(--border)",
                    gap: "1rem",
                  }} className="amir-table-header">
                    {["Order ID", "Jamaah", "Muthawif", "Tanggal", "Nominal & Bayar", "Status"].map(h => (
                      <div key={h} style={{ fontSize: "0.625rem", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {h}
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  {bookings.map((booking, idx) => {
                    const statusColor = STATUS_COLORS[booking.status] || { bg: "var(--ivory-dark)", color: "var(--text-muted)" };
                    const location = booking.muthawif.profile?.operatingAreas?.join(", ") || "—";
                    const shortId = booking.id.includes("-") ? booking.id.split("-")[0].toUpperCase() : booking.id.slice(0, 8).toUpperCase();
                    const isPaid = booking.paymentStatus === "PAID";

                    return (
                      <div
                        key={booking.id}
                        className="amir-row"
                        style={{
                          borderBottom: idx === bookings.length - 1 ? "none" : "1px solid var(--border)",
                        }}
                      >
                        {/* Desktop row */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "1.2fr 1.5fr 1.5fr 120px 100px 130px",
                          padding: "1rem 1.5rem",
                          gap: "1rem",
                          alignItems: "center",
                        }} className="amir-table-row">
                          {/* Order ID */}
                          <div>
                            <span style={{
                              fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 800,
                              color: "var(--charcoal)", background: "var(--ivory-dark)",
                              padding: "0.2rem 0.5rem", borderRadius: 6, border: "1px solid var(--border)",
                              display: "flex", alignItems: "center", width: "fit-content"
                            }}>
                              #{shortId}
                              <CopyButton text={booking.id} />
                            </span>
                          </div>
                          {/* Jamaah */}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--charcoal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {booking.jamaah.name}
                            </div>
                            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {booking.jamaah.email}
                            </div>
                          </div>
                          {/* Muthawif */}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--charcoal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {booking.muthawif.name}
                            </div>
                            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                              {location === "BOTH" ? "Makkah & Madinah" : location}
                            </div>
                          </div>
                          {/* Tanggal */}
                          <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-body)" }}>
                            {new Date(booking.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "2-digit" })}
                          </div>
                          {/* Total + Bayar */}
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "0.875rem", color: isPaid ? "var(--emerald)" : "var(--charcoal)" }}>
                              Rp {booking.totalFee.toLocaleString("id-ID")}
                            </div>
                            <span style={{
                              display: "inline-flex", alignItems: "center", padding: "0.15rem 0.5rem",
                              borderRadius: 99, fontSize: "0.5625rem", fontWeight: 800,
                              background: isPaid ? "rgba(27,107,74,0.1)" : "rgba(196,151,59,0.1)",
                              color: isPaid ? "#1B6B4A" : "#92700A",
                              marginTop: "0.25rem",
                            }}>
                              {isPaid ? "Lunas" : "Belum"}
                            </span>
                          </div>
                          {/* Status */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", alignItems: "flex-start" }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: "0.3rem",
                              padding: "0.25rem 0.625rem", borderRadius: 99,
                              fontSize: "0.6875rem", fontWeight: 700,
                              background: statusColor.bg, color: statusColor.color,
                              whiteSpace: "nowrap",
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor.color, flexShrink: 0 }} />
                              {STATUS_LABELS[booking.status] || booking.status}
                            </span>
                            <BookingStatusButton
                              bookingId={booking.id}
                              currentStatus={booking.status}
                              endDate={booking.endDate.toISOString()}
                            />
                          </div>
                        </div>

                        {/* Mobile card row (hidden on desktop via CSS) */}
                        <div style={{ padding: "1rem 1.25rem" }} className="amir-mobile-row">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", background: "var(--ivory-dark)", padding: "0.2rem 0.5rem", borderRadius: 6, display: "flex", alignItems: "center" }}>
                              #{shortId}
                              <CopyButton text={booking.id} />
                            </span>
                            <span style={{ padding: "0.275rem 0.7rem", borderRadius: 99, fontSize: "0.6875rem", fontWeight: 800, background: statusColor.bg, color: statusColor.color }}>
                              {STATUS_LABELS[booking.status] || booking.status}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--charcoal)" }}>{booking.jamaah.name}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--emerald)", fontWeight: 600 }}>→ {booking.muthawif.name}</div>
                              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                {new Date(booking.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} · {location === "BOTH" ? "Makkah & Madinah" : location}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: isPaid ? "var(--emerald)" : "var(--charcoal)" }}>
                                Rp {booking.totalFee.toLocaleString("id-ID")}
                              </div>
                              <div style={{ fontSize: "0.5625rem", fontWeight: 800, color: isPaid ? "var(--emerald)" : "var(--gold)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "0.125rem" }}>
                                {isPaid ? "LUNAS" : "BELUM BAYAR"}
                              </div>
                            </div>
                          </div>
                          {/* Mobile action CTA */}
                          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--border)" }}>
                            <BookingStatusButton
                              bookingId={booking.id}
                              currentStatus={booking.status}
                              endDate={booking.endDate.toISOString()}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {pagination && <div style={{ flexBasis: "100%", borderTop: "1px solid var(--border)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>{pagination}</div>}
            </div>
          </div>
        </div>
      );
    }


    const STATUS_DOT: Record<string, string> = {
      PENDING: "#C4973B", CONFIRMED: "#27956A", CANCELLED: "#EF4444", COMPLETED: "#3B82F6",
    };
    const PAYMENT_META: Record<string, { label: string; bg: string; color: string }> = {
      PAID: { label: "Lunas", bg: "rgba(27,107,74,0.1)", color: "#1B6B4A" },
      UNPAID: { label: "Belum", bg: "rgba(196,151,59,0.1)", color: "#92700A" },
    };

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {toolbar}
        <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 600, paddingBottom: "1rem" }}>
          Menampilkan {bookingsTotal} pesanan
        </div>
        {bookings.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", background: "white", borderRadius: 16, border: "1px solid var(--border)" }}>
            Tidak ada pesanan yang sesuai dengan filter.
          </div>
        ) : (
          <div className="jamaah-bookings-panel" style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            {/* ── Table header (desktop only) ── */}
            <div className="bk-hdr" style={{
              display: "grid",
              gridTemplateColumns: "1.8fr 1.4fr 1.1fr 1.1fr 1fr 180px",
              gap: "0",
              padding: "0.625rem 1.25rem",
              background: "var(--ivory)",
              borderBottom: "1px solid var(--border)",
              alignItems: "center",
            }}>
              {[
                { label: "Muthawif", align: "left" },
                { label: "Tanggal & Durasi", align: "left" },
                { label: "Nominal", align: "center" },
                { label: "Status", align: "center" },
                { label: "Pembayaran", align: "center" },
                { label: "Aksi", align: "center" },
              ].map(h => (
                <div key={h.label} style={{
                  fontSize: "0.5875rem", fontWeight: 800,
                  color: "var(--text-muted)", textTransform: "uppercase",
                  letterSpacing: "0.1em", textAlign: h.align as "left" | "center",
                  padding: "0 0.5rem",
                }}>{h.label}</div>
              ))}
            </div>

            {bookings.map((booking, idx) => {
              const color = STATUS_COLORS[booking.status] || { bg: "#eee", color: "#666" };
              const dot = STATUS_DOT[booking.status] || "#ccc";
              const pm = PAYMENT_META[booking.paymentStatus || "UNPAID"] || PAYMENT_META["UNPAID"];
              const location = booking.muthawif.profile?.operatingAreas?.join(", ") || "";
              const initials = booking.muthawif.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const shortId = booking.id.includes("-") ? booking.id.split("-")[0].toUpperCase() : booking.id.slice(0, 8).toUpperCase();
              const startDate = new Date(booking.startDate);
              const duration = Math.max(1, Math.round((new Date(booking.endDate).getTime() - startDate.getTime()) / 86400000));
              const isPaid = booking.paymentStatus === "PAID";
              const isUnpaid = booking.paymentStatus === "UNPAID" && booking.status !== "CANCELLED";
              const isPaymentReview = booking.paymentStatus === "PAYMENT_REVIEW";
              const showReview = session.role === "JAMAAH" && booking.status === "COMPLETED";

              return (
                <div key={booking.id} className="bk-card-wrap" style={{ borderBottom: idx < bookings.length - 1 ? "1px solid var(--border)" : "none" }}>

                  {/* ── Data row ── */}
                  <div className="bk-row" style={{
                    display: "grid",
                    gridTemplateColumns: "1.8fr 1.4fr 1.1fr 1.1fr 1fr 140px",
                    gap: "0",
                    padding: "0.875rem 1.25rem",
                    alignItems: "center",
                    transition: "background 0.15s",
                  }}>

                    {/* Col 1: Muthawif */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0, padding: "0 0.5rem 0 0" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,var(--emerald),#27956A)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8125rem", flexShrink: 0, overflow: "hidden", border: "2px solid var(--border)" }}>
                        {booking.muthawif.photoUrl
                          ? <span aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", backgroundImage: `url(${booking.muthawif.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                          : initials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--charcoal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{booking.muthawif.name}</div>
                        {location && <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{location === "BOTH" ? "Makkah & Madinah" : location}</div>}
                        <div style={{ fontSize: "0.5625rem", color: "var(--text-muted)", fontFamily: "monospace", marginTop: "0.1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          #{shortId}<CopyButton text={booking.id} />
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Tanggal */}
                    <div style={{ minWidth: 0, padding: "0 0.5rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--charcoal)" }}>
                        {startDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                        {duration} hari · s/d {new Date(booking.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </div>
                    </div>

                    {/* Col 3: Nominal */}
                    <div style={{ display: "flex", justifyContent: "center", minWidth: 0, padding: "0 0.5rem" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.9rem", color: isPaid ? "var(--emerald)" : "var(--charcoal)", whiteSpace: "nowrap" }}>
                        Rp {booking.totalFee.toLocaleString("id-ID")}
                      </span>
                    </div>

                    {/* Col 4: Status */}
                    <div style={{ display: "flex", justifyContent: "center", minWidth: 0, padding: "0 0.5rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.625rem", borderRadius: 99, fontSize: "0.6875rem", fontWeight: 700, background: color.bg, color: color.color, whiteSpace: "nowrap" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </div>

                    {/* Col 5: Pembayaran */}
                    <div style={{ display: "flex", justifyContent: "center", minWidth: 0, padding: "0 0.5rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "0.25rem 0.625rem", borderRadius: 99, fontSize: "0.6875rem", fontWeight: 700, background: pm.bg, color: pm.color, whiteSpace: "nowrap" }}>
                        {pm.label}
                      </span>
                    </div>

                    {/* Col 6: Aksi — chat, bayar, atau review */}
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "stretch", minWidth: 0, padding: "0 0 0 0.5rem", gap: "0.375rem" }}>
                      {/* Tombol Chat Drawer — tampil untuk booking CONFIRMED/COMPLETED */}
                      {(booking.status === "CONFIRMED" || booking.status === "COMPLETED") && (
                        <ChatWidget
                          bookingId={booking.id}
                          currentUser={{ id: session.id, name: session.name!, photoUrl: userRecord?.photoUrl, role: session.role as "JAMAAH" | "MUTHAWIF" }}
                          otherUser={{ id: booking.muthawif.id, name: booking.muthawif.name, photoUrl: booking.muthawif.photoUrl, role: "MUTHAWIF" }}
                          buttonLabel="Chat"
                          variant="compact"
                        />
                      )}
                      {/* Tombol Verifikasi Pembayaran (AMIR) */}
                      {session.role === "AMIR" && isPaymentReview && (
                        <PaymentVerificationButton bookingId={booking.id} proofUrl={booking.paymentProofUrl} />
                      )}
                      {/* Tombol Bayar / Upload Bukti (JAMAAH) */}
                      {session.role === "JAMAAH" && isUnpaid && (
                        <Link
                          href={`/booking/${booking.id}`}
                          style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                            padding: "0.3rem 0.75rem", borderRadius: 8, background: "var(--emerald)", color: "white",
                            fontSize: "0.6875rem", fontWeight: 800, textDecoration: "none"
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Bayar
                        </Link>
                      )}
                      {/* Dash placeholder jika tidak ada aksi tersedia */}
                      {!isUnpaid && !isPaymentReview && booking.status !== "CONFIRMED" && booking.status !== "COMPLETED" && (
                        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>—</span>
                      )}
                    </div>
                  </div>

                  <div className="bk-pay-mobile" style={{ padding: "0 1rem 0.875rem" }}>
                    {/* Tombol Bayar — hanya UNPAID */}
                    {session.role === "JAMAAH" && isUnpaid && (
                      <Link
                        href={`/booking/${booking.id}`}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", width: "100%",
                          padding: "0.5rem", borderRadius: 8, background: "var(--emerald)", color: "white",
                          fontSize: "0.8125rem", fontWeight: 800, textDecoration: "none"
                        }}
                      >
                        Bayar Sekarang
                      </Link>
                    )}
                    {/* Tombol Verifikasi Pembayaran (AMIR) */}
                    {session.role === "AMIR" && isPaymentReview && (
                      <div style={{ width: "100%" }}>
                        <PaymentVerificationButton bookingId={booking.id} proofUrl={booking.paymentProofUrl} />
                      </div>
                    )}
                    {/* Tombol Chat — CONFIRMED atau COMPLETED */}
                    {(booking.status === "CONFIRMED" || booking.status === "COMPLETED") && (
                      <ChatWidget
                        bookingId={booking.id}
                        currentUser={{ id: session.id, name: session.name!, photoUrl: userRecord?.photoUrl, role: session.role as "JAMAAH" | "MUTHAWIF" }}
                        otherUser={{ id: booking.muthawif.id, name: booking.muthawif.name, photoUrl: booking.muthawif.photoUrl, role: "MUTHAWIF" }}
                        buttonLabel={`Chat dengan ${booking.muthawif.name}`}
                        variant="primary"
                      />
                    )}
                  </div>

                  {/* ── Review row (full-width, below data row) ── */}
                  {showReview && (
                    <div className="bk-review-desktop" style={{ padding: "0 1.25rem 0.875rem", marginTop: "-0.25rem" }}>
                      <ReviewButton
                        bookingId={booking.id}
                        muthawifId={booking.muthawif.id}
                        muthawifName={booking.muthawif.name}
                        hasReview={!!booking.review}
                        dashboardHref="/dashboard"
                      />
                    </div>
                  )}

                  {/* ── Tokopedia-style Mobile Card (Compact / Separated) ── */}
                  <div className="bk-row-mobile" style={{ display: "none", flexDirection: "column", padding: "0" }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--charcoal)" }}>Perjalanan • {startDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <span style={{ padding: "0.15rem 0.4rem", borderRadius: 4, fontSize: "0.625rem", fontWeight: 800, background: color.bg, color: color.color, flexShrink: 0 }}>
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </div>

                    {/* Body */}
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.875rem" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,var(--emerald),#27956A)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem", flexShrink: 0, overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
                        {booking.muthawif.photoUrl
                          ? <span aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", backgroundImage: `url(${booking.muthawif.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                          : initials}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 0 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--charcoal)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.1rem" }}>
                            {booking.muthawif.name}
                          </div>
                          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                            {duration} hari • {location === "BOTH" ? "Makkah & Madinah" : location}
                          </div>
                        </div>
                        {(booking.status === "CONFIRMED" || booking.status === "COMPLETED") && (
                          <div style={{ flexShrink: 0 }}>
                            <ChatWidget
                              bookingId={booking.id}
                              currentUser={{ id: session.id, name: session.name!, photoUrl: userRecord?.photoUrl, role: session.role as "JAMAAH" | "MUTHAWIF" }}
                              otherUser={{ id: booking.muthawif.id, name: booking.muthawif.name, photoUrl: booking.muthawif.photoUrl, role: "MUTHAWIF" }}
                              buttonLabel="Chat"
                              variant="compact"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer: Price & Actions */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", borderTop: "1px solid rgba(0,0,0,0.05)", background: "var(--ivory)", borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                      {/* Left Side: Total Price */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                        <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>Total Biaya</div>
                        <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--charcoal)" }}>Rp {booking.totalFee.toLocaleString("id-ID")}</div>
                      </div>

                      {/* Right Side: Actions */}
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        {isUnpaid && <span style={{ fontSize: "0.625rem", fontWeight: 800, color: pm.color, background: pm.bg, padding: "0.2rem 0.5rem", borderRadius: 4 }}>{pm.label}</span>}
                        {session.role === "JAMAAH" && isUnpaid ? (
                          <Link
                            href={`/booking/${booking.id}`}
                            style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.25rem",
                              padding: "0.3rem 0.6rem", borderRadius: 6, background: "var(--emerald)", color: "white",
                              fontSize: "0.6875rem", fontWeight: 800, textDecoration: "none"
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            Bayar
                          </Link>
                        ) : null}
                        {showReview && (
                          <ReviewButton
                            bookingId={booking.id}
                            muthawifId={booking.muthawif.id}
                            muthawifName={booking.muthawif.name}
                            hasReview={!!booking.review}
                            dashboardHref="/dashboard"
                            variant="compact-stars"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Footer with Pagination */}
            <div className="bk-footer" style={{ padding: "0.25rem 1.25rem", borderTop: "1px solid var(--border)", background: "var(--ivory)", minHeight: 48, display: "flex", alignItems: "center" }}>
              {pagination || <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600 }}>Akhir daftar pesanan</span>}
            </div>
          </div>
        )}

        <style>{`
          .bk-hdr { display: grid !important; }
          .bk-row:hover { background: var(--ivory) !important; }
          .jamaah-dashboard .jamaah-bookings-panel {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          .jamaah-dashboard .bk-footer {
            background: transparent !important;
            border-top: none !important;
            justify-content: center;
          }
          .jamaah-dashboard .bk-card-wrap {
            border-bottom: none !important;
            border-radius: 12px;
            background: #fff;
            border: 1px solid rgba(0,0,0,0.08);
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
            margin-bottom: 0.75rem;
            overflow: hidden;
            padding: 0 !important;
          }
          .jamaah-dashboard .bk-hdr {
            display: none !important;
          }
          .jamaah-dashboard .bk-row {
            display: none !important;
          }
          .jamaah-dashboard .bk-review-desktop {
            display: none !important;
          }
          .jamaah-dashboard .bk-pay-mobile {
            display: none !important;
          }
          .jamaah-dashboard .bk-row-mobile {
            display: flex !important;
          }
          .jamaah-dashboard .jamaah-search-card {
            padding: 1rem !important;
          }
        `}</style>
      </div>
    );
  };


  const sidebarNavItems = [
    {
      href: "/dashboard?tab=analytics",
      label: "Dashboard",
      desc: "Analytics & finansial",
      icon: BarChart3,
      tab: "analytics",
      show: session.role === "AMIR",
    },
    {
      href: "/dashboard?tab=cari",
      label: "Cari Muthawif",
      desc: "Temukan muthawif tersedia",
      icon: Search,
      tab: "cari",
      show: session.role === "JAMAAH",
    },
    {
      href: "/dashboard?tab=beranda",
      label: "Riwayat Pesanan",
      desc: "Semua pesanan umrah",
      icon: ClipboardList,
      tab: "beranda",
      show: true,
    },
    {
      href: "/dashboard?tab=muthawif",
      label: "Manajemen Muthawif",
      desc: "Kelola & verifikasi akun",
      icon: Users,
      tab: "muthawif",
      show: session.role === "AMIR",
    },
    {
      href: "/dashboard?tab=penarikan",
      label: "Manajemen Penarikan",
      desc: "Kelola dana keluar",
      icon: Banknote,
      tab: "penarikan",
      show: session.role === "AMIR",
    },
    {
      href: "/dashboard?tab=biaya",
      label: "Pengaturan Biaya",
      desc: "Fee jasa & manajemen",
      icon: Settings,
      tab: "biaya",
      show: session.role === "AMIR",
    },
    {
      href: "/dashboard?tab=promo",
      label: "Kode Promo",
      desc: "Diskon & voucher jamaah",
      icon: Tag,
      tab: "promo",
      show: session.role === "AMIR",
    },
    {
      type: "header",
      label: "MASTER DATA",
      show: session.role === "AMIR",
    },
    {
      href: "/dashboard?tab=master_lokasi",
      label: "Wilayah Operasi",
      desc: "Manajemen area operasi",
      icon: MapPin,
      tab: "master_lokasi",
      show: session.role === "AMIR",
    },
    {
      href: "/dashboard?tab=master_layanan",
      label: "Jenis Layanan",
      desc: "Layanan Muthawif",
      icon: Briefcase,
      tab: "master_layanan",
      show: session.role === "AMIR",
    },
    {
      href: "/dashboard?tab=master_bahasa",
      label: "Spesialisasi Bahasa",
      desc: "Pilihan bahasa komunikasi",
      icon: Languages,
      tab: "master_bahasa",
      show: session.role === "AMIR",
    },
    {
      href: "/dashboard?tab=kegiatan",
      label: "Katalog Kegiatan",
      desc: "Kelola daftar aktivitas",
      icon: ListTodo,
      tab: "kegiatan",
      show: session.role === "AMIR",
    },
    {
      type: "header",
      label: "SISTEM",
      show: session.role === "AMIR",
    },
    {
      href: "/dashboard?tab=simulator",
      label: "Simulator Midtrans",
      desc: "Test Flow Pembayaran",
      icon: CreditCard,
      tab: "simulator",
      show: session.role === "AMIR",
    },
  ].filter((item) => item.show);


  return (
    <div className={`dashboard-fullscreen${session.role === "JAMAAH" ? " jamaah-dashboard" : ""}`}>
      {/* ══ SIDEBAR — wrapped in mobile drawer ══ */}
      <MobileSidebarDrawer brandLabel="PENDAMPING IBADAH UMROH">

        {/* Brand header (desktop) */}
        <div style={{ padding: "1.25rem 1.375rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #1B6B4A, #27956A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 900, fontSize: "1rem", letterSpacing: "-0.02em", lineHeight: 1 }}>
              Wif<span style={{ color: "#E4B55A" }}>–Me</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.07em", marginTop: 2 }}>
              PENDAMPING IBADAH UMROH
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div className="sidebar-scrollable" style={{ padding: "0.875rem 0.75rem", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: "0.5875rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: "0.375rem", padding: "0 0.25rem" }}>
            MENU UTAMA
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {sidebarNavItems.map((item, idx) => {
              if (item.type === "header") {
                return (
                  <div key={`head-${idx}`} style={{ fontSize: "0.5875rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginTop: "1.25rem", marginBottom: "0.375rem", padding: "0 0.25rem" }}>
                    {item.label}
                  </div>
                );
              }

              const isActive = currentTab === item.tab;
              const isSub = !!(item as { isSubItem?: boolean }).isSubItem;
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className="dsb-nav-lnk"
                  style={{
                    display: "flex", alignItems: "center", gap: isSub ? "0.5rem" : "0.75rem",
                    padding: isSub ? "0.5rem 0.625rem 0.5rem 2.25rem" : "0.6875rem 0.75rem",
                    borderRadius: "10px",
                    textDecoration: "none",
                    marginLeft: isSub ? "0.5rem" : "0",
                    background: isActive ? "rgba(255,255,255,0.14)" : "transparent",
                    border: isActive ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
                    transition: "background 0.15s, border-color 0.15s",
                    position: "relative",
                  }}
                >
                  {isSub && (
                    <div style={{
                      position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)",
                      width: 8, height: 1, background: "rgba(255,255,255,0.2)",
                    }} />
                  )}
                  <div style={{
                    width: isSub ? 26 : 34, height: isSub ? 26 : 34,
                    borderRadius: isSub ? 7 : 9,
                    background: isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isSub ? "0.8125rem" : "1rem", flexShrink: 0,
                    color: isActive ? "white" : "rgba(255,255,255,0.7)"
                  }}>
                    {item.icon && <item.icon size={isSub ? 14 : 18} strokeWidth={2.2} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: isActive ? "white" : isSub ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.8)", fontWeight: isActive ? 700 : isSub ? 500 : 600, fontSize: isSub ? "0.8125rem" : "0.875rem", lineHeight: 1.2 }}>
                      {item.label}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.5625rem", marginTop: "0.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.desc}
                    </div>
                  </div>
                  {isActive && (
                    <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#E4B55A", flexShrink: 0 }} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

      </MobileSidebarDrawer>

      {/* Main Content Area */}
      <div className="dashboard-main-area">
        <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--charcoal)" }}>
              {TAB_TITLES[currentTab] || "Dashboard"}
            </h2>
          </div>
          <AmirHeaderPanel name={session.name} email={session.email} role={session.role} avatarUrl={userRecord?.photoUrl} muthawifProfile={currentMuthawifProfile} />
        </header>

        <main className="dashboard-content-scroll" style={{ padding: "clamp(1rem, 4vw, 2rem)", overflowY: "auto", flex: 1, minHeight: 0 }}>
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
              <div className="jamaah-search-layout" style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
                <div className="jamaah-search-card" style={{ background: "white", padding: "1.25rem 1.5rem", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
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
                    feeConfig={feeConfig}
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

            {currentTab === "simulator" && session.role === "AMIR" && (
              <MidtransSimulator />
            )}

            {currentTab === "penarikan" && session.role === "AMIR" && (
              <PayoutManagement payouts={payoutData} />
            )}

            {currentTab === "biaya" && session.role === "AMIR" && (
              <FeeSettings initialSettings={globalSettings} />
            )}

            {currentTab === "master_lokasi" && session.role === "AMIR" && (
              <LocationSettings initialSettings={globalSettings} currentPage={mPage} />
            )}

            {currentTab === "kegiatan" && <ActivityManagement initialActivities={activitiesData} initialBundles={activityBundlesData} />}
            {currentTab === "master_layanan" && session.role === "AMIR" && (
              <ServiceSettings initialSettings={globalSettings} currentPage={mPage} />
            )}

            {currentTab === "master_bahasa" && session.role === "AMIR" && (
              <LanguageSettings initialSettings={globalSettings} currentPage={mPage} />
            )}

            {currentTab === "analytics" && session.role === "AMIR" && (
              <EarningsDashboard initialRole="AMIR" />
            )}

            {currentTab === "promo" && session.role === "AMIR" && (
              <PromoManagement initialData={promoData} />
            )}
          </div>
        </main>
      </div>

      {session.role === "JAMAAH" && <JamaahMobileNav currentTab={currentTab} />}

      <style>{`
        @media (max-width: 768px) {
          .jamaah-dashboard .mob-topbar {
            display: none !important;
          }
          .jamaah-dashboard .dashboard-sidebar-fixed {
            display: none !important;
          }
          .jamaah-dashboard .dashboard-main-area {
            min-height: 100dvh;
            overflow: visible !important;
            background: var(--ivory);
          }
          .jamaah-dashboard .dashboard-header {
            position: sticky;
            top: 0;
            z-index: 120;
            min-height: 64px;
            padding: calc(0.6rem + env(safe-area-inset-top)) 1rem 0.65rem;
            background: rgba(250,247,242,0.94);
            border-bottom: 1px solid rgba(224,216,204,0.75);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
          }
          .jamaah-dashboard .dashboard-header h2 {
            font-size: 1rem !important;
            letter-spacing: -0.02em;
          }
          .jamaah-dashboard .dashboard-content-scroll {
            overflow: visible !important;
            padding: 0.85rem 0.75rem calc(6.25rem + env(safe-area-inset-bottom)) !important;
          }
          .jamaah-dashboard .jamaah-bookings-panel {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
            display: flex;
            flex-direction: column;
            gap: 0.85rem;
          }
          .jamaah-dashboard .bk-card-wrap {
            border-bottom: none !important;
            border-radius: 12px;
            background: #fff;
            border: 1px solid rgba(0,0,0,0.08);
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
            margin-bottom: 0.85rem;
            overflow: hidden;
            padding: 0 !important;
          }
          .jamaah-dashboard .bk-hdr {
            display: none !important;
          }
          .jamaah-dashboard .bk-row {
            display: none !important;
          }
          .jamaah-dashboard .bk-review-desktop {
            display: none !important;
          }
          .jamaah-dashboard .bk-pay-mobile {
            display: none !important;
          }
          .jamaah-dashboard .bk-row-mobile {
            display: flex !important;
          }
          .jamaah-dashboard .jamaah-search-card {
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          .jamaah-dashboard .jamaah-search-layout {
            gap: 0.85rem !important;
          }
        }
      `}</style>
    </div>
  );
}
