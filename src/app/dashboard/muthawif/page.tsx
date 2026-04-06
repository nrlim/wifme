import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ProfileForm } from "./ProfileForm";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { DocumentUpload } from "./DocumentUpload";
import { DashboardHeader } from "./DashboardHeader";
import { AmirHeaderPanel } from "../AmirHeaderPanel";
import { CopyButton } from "../CopyButton";
import MuthawifWallet from "@/components/wallet/MuthawifWallet";
import { getWallet } from "@/actions/finance";
function VerificationTimeline({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "Info Layanan", desc: "Wilayah, tarif & keahlian" },
    { num: 2, label: "Unggah Berkas", desc: "KTP, Selfie, Sertifikat" },
    { num: 3, label: "Dalam Review", desc: "Validasi oleh AMIR" },
    { num: 4, label: "Akun Aktif", desc: "Siap menerima pesanan" }
  ];

  // progress from 0% to 100% — each completed step adds 1/3
  const progressPct = Math.min(((currentStep - 1) / (steps.length - 1)) * 100, 100);

  return (
    <div style={{ background: "white", borderRadius: "16px", border: "1px solid var(--border)", padding: "2rem 2.5rem 1.75rem", marginBottom: "2rem" }}>
      {/* Stepper wrapper — fixed height so the line is always centered on the dots */}
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", alignItems: "flex-start" }}>

        {/* Track background */}
        <div style={{
          position: "absolute",
          top: 20, // half of 40px dot
          left: "calc(12.5%)",   // start at center of first dot
          right: "calc(12.5%)",  // end at center of last dot
          height: 3,
          background: "#E5E7EB",
          borderRadius: 99,
          zIndex: 0,
        }} />

        {/* Track fill */}
        <div style={{
          position: "absolute",
          top: 20,
          left: "calc(12.5%)",
          height: 3,
          width: `calc(${progressPct}% * 0.75)`,  // 75% because track spans 75% of container
          background: "linear-gradient(90deg, var(--emerald), var(--emerald-light, #2ECC71))",
          borderRadius: 99,
          zIndex: 1,
          transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
        }} />

        {steps.map((step) => {
          const isCompleted = currentStep > step.num;
          const isActive = currentStep === step.num;
          return (
            <div key={step.num} style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              {/* Dot */}
              <div style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                background: isCompleted ? "var(--emerald)" : isActive ? "white" : "#F3F4F6",
                border: `2.5px solid ${isCompleted ? "var(--emerald)" : isActive ? "var(--emerald)" : "#D1D5DB"}`,
                color: isCompleted ? "white" : isActive ? "var(--emerald)" : "#9CA3AF",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "0.9375rem",
                boxShadow: isActive ? "0 0 0 6px rgba(27,107,74,0.12)" : isCompleted ? "0 2px 8px rgba(27,107,74,0.2)" : "none",
                transition: "all 0.4s ease",
              }}>
                {isCompleted
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  : step.num}
              </div>

              {/* Label group */}
              <div style={{ textAlign: "center", lineHeight: 1.4 }}>
                <div className="vtl-label" style={{
                  fontSize: "0.8125rem",
                  fontWeight: isActive || isCompleted ? 700 : 500,
                  color: isActive ? "var(--emerald)" : isCompleted ? "var(--charcoal)" : "#9CA3AF",
                  letterSpacing: isActive ? "0.01em" : "normal",
                }}>
                  {step.label}
                </div>
                <div className="vtl-desc" style={{
                  fontSize: "0.6875rem",
                  color: isActive || isCompleted ? "var(--text-muted)" : "#D1D5DB",
                  marginTop: "0.2rem",
                }}>
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @media (max-width: 480px) {
          .vtl-label { font-size: 0.6rem !important; }
          .vtl-desc { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default async function MuthawifDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; step?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "MUTHAWIF") {
    redirect("/auth/login?redirect=/dashboard/muthawif");
  }

  const { tab, step } = await searchParams;
  let currentTab = typeof tab === "string" ? tab : "schedule";
  const urlStep = typeof step === "string" ? parseInt(step, 10) : null;

  // Fetch all necessary data
  const profile = (await prisma.muthawifProfile.findUnique({
    where: { userId: session.id },
    include: {
      user: { select: { photoUrl: true } },
      availability: {
        where: {
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, // Today onwards
        },
        select: { date: true, status: true, timeSlots: true },
      },
    },
  })) as any;

  const globalSettings = (await prisma.globalSetting.findUnique({
    where: { id: "singleton" },
  })) as any;
  // No fallback defaults — only show options actually configured in master data
  const supportedLocations: string[] = globalSettings?.supportedLocations ?? [];
  const supportedServices: string[] = globalSettings?.supportedServices ?? [];
  const supportedLanguages: string[] = globalSettings?.supportedLanguages ?? [];

  const bookings = await prisma.booking.findMany({
    where: { muthawifId: session.id },
    include: { jamaah: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  let walletData = null;
  if (currentTab === "wallet") {
    walletData = await getWallet(session.id);
  }

  const isPending = !profile || profile.verificationStatus === "PENDING" || profile.verificationStatus === "REVIEW";
  
  if (isPending) {
    const isReview = profile?.verificationStatus === "REVIEW";
    // Profile is done if they have basic service info (basePrice > 0 and operatingAreas set)
    const isProfileDone = !!(profile?.basePrice && profile.basePrice > 0 && profile?.operatingAreas && profile.operatingAreas.length > 0);
    
    let currentStepNum = 1;

    if (isReview) {
      currentStepNum = 3;
    } else if (urlStep !== null) {
      currentStepNum = urlStep;
      if (currentStepNum === 2 && !isProfileDone) currentStepNum = 1;
    } else {
      currentStepNum = isProfileDone ? 2 : 1;
    }
    const stepTitles: Record<number, string> = {
      1: "Informasi Layanan",
      2: "Unggah Berkas Verifikasi",
      3: "Menunggu Persetujuan"
    };

    return (
      <div style={{ background: "var(--ivory)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <DashboardHeader 
          name={session.name || "Muthawif"} 
          email={session.email || ""} 
          avatarUrl={profile?.user?.photoUrl} 
          title={stepTitles[currentStepNum]} 
        />
        
        <main style={{ flex: 1, overflow: "auto" }}>
          <div style={{ padding: "clamp(1rem, 3vw, 1.75rem) clamp(1rem, 4vw, 2rem)", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ width: "100%" }}>
              <VerificationTimeline currentStep={currentStepNum} />
            </div>
            
            {/* STEP 1 — Informasi Layanan */}
            {currentStepNum === 1 && (
              <ProfileForm
                profile={profile as any}
                userName={session.name}
                supportedLocations={supportedLocations}
                supportedServices={supportedServices}
                supportedLanguages={supportedLanguages}
              />
            )}

            {/* STEP 2 — Unggah Berkas */}
            {currentStepNum === 2 && (
              <div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--charcoal)", margin: 0 }}>Unggah Dokumen Verifikasi</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>Unggah tiga berkas di bawah untuk dikirim ke proses review AMIR.</p>
                </div>
                <DocumentUpload documents={profile?.documentsUrl || []} />
              </div>
            )}

            {/* STEP 3 — Dalam Review */}
            {currentStepNum === 3 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem", background: "white", borderRadius: "20px", border: "1px solid var(--border)", textAlign: "center", gap: "1.5rem" }}>
                <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--emerald-pale)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: "1.625rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.75rem" }}>Sedang Dalam Antrian Review</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto" }}>
                    Data dan dokumen Anda telah berhasil dikirimkan. Tim AMIR Wif-Me sedang memvalidasi kelengkapan berkas Anda. Harap tunggu notifikasi lebih lanjut.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginTop: "0.5rem" }}>
                  <div style={{ background: "var(--ivory-dark)", borderRadius: "12px", padding: "1rem 1.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estimasi Proses</div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--charcoal)", marginTop: "0.25rem" }}>1–3 Hari Kerja</div>
                  </div>
                  <div style={{ background: "var(--ivory-dark)", borderRadius: "12px", padding: "1rem 1.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status Saat Ini</div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#A16207", marginTop: "0.25rem" }}>Menunggu AMIR</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Active Authenticated Screen
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

  const TAB_TITLES_MAP: Record<string, string> = {
    schedule: "Kelola Jadwal Kesediaan",
    bookings: "Riwayat Pesanan Saya",
    profile: "Pengaturan Profil & Layanan",
    wallet: "Dompet Muthawif",
  };

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
            MENU UTAMA
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {[
              { id: "schedule", href: "/dashboard/muthawif?tab=schedule", label: "Jadwal",           desc: "Kelola ketersediaan",    emoji: "📅",  sub: false },
              { id: "bookings", href: "/dashboard/muthawif/bookings",     label: "Pesanan",           desc: "Riwayat pesanan masuk",  emoji: "📋",  sub: false },
              { id: "agenda",   href: "/agenda",                          label: "Agenda Perjalanan", desc: "Timeline & laporan",     emoji: "🗓️", sub: true  },
              { id: "profile",  href: "/dashboard/muthawif?tab=profile",  label: "Profil Layanan",   desc: "Info, tarif & keahlian", emoji: "👤",  sub: false },
              { id: "wallet",   href: "/dashboard/muthawif?tab=wallet",   label: "Dompet Muthawif",  desc: "Balans Escrow",          emoji: "💰",  sub: false },
            ].map((t) => {
              const isActive = t.id === "bookings" ? false : currentTab === t.id;
              return (
                <Link
                  key={t.id}
                  href={t.href}
                  className="dsb-nav-lnk"
                  style={{
                    display: "flex", alignItems: "center", gap: t.sub ? "0.5rem" : "0.75rem",
                    padding: t.sub ? "0.5rem 0.625rem 0.5rem 2.25rem" : "0.6875rem 0.75rem",
                    borderRadius: t.sub ? 10 : 12, textDecoration: "none", marginBottom: "0.25rem",
                    marginLeft: t.sub ? "0.5rem" : "0",
                    background: isActive ? "rgba(255,255,255,0.14)" : "transparent",
                    border: isActive ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
                    transition: "background 0.15s, border-color 0.15s",
                    position: "relative",
                  }}
                >
                  {/* Connector line for sub-items */}
                  {t.sub && (
                    <div style={{
                      position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)",
                      width: 8, height: 1, background: "rgba(255,255,255,0.2)",
                    }} />
                  )}
                  <div style={{ width: t.sub ? 26 : 34, height: t.sub ? 26 : 34, borderRadius: t.sub ? 7 : 9, background: isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: t.sub ? "0.8125rem" : "1rem", flexShrink: 0 }}>
                    {t.emoji}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: isActive ? "white" : t.sub ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.8)", fontWeight: isActive ? 700 : t.sub ? 500 : 600, fontSize: t.sub ? "0.8125rem" : "0.875rem", lineHeight: 1.2 }}>
                      {t.label}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.5625rem", marginTop: "0.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.desc}
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
      </aside>

      <div className="dashboard-main-area">
        <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--charcoal)" }}>
              {TAB_TITLES_MAP[currentTab] || "Panel Muthawif"}
            </h2>
          </div>
          <AmirHeaderPanel
            name={session.name || "Muthawif"}
            email={session.email || ""}
            role={session.role}
            avatarUrl={profile?.user?.photoUrl}
          />
        </header>

        {/* Main Content Area */}
        <main style={{ padding: "clamp(1rem, 4vw, 2rem)", overflowY: "auto", flex: 1, minHeight: 0 }}>

        {currentTab === "schedule" && (
          <div>
            {!profile ? (
              <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "16px", border: "1px dashed var(--border)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📋</div>
                <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Profil belum dilengkapi</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Lengkapi data layanan Anda terlebih dahulu sebelum mengelola jadwal.</p>
              </div>
            ) : (
              <AvailabilityCalendar availability={profile.availability} />
            )}
          </div>
        )}

        {currentTab === "profile" && (
          <div className="card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>Update Informasi Layanan</h2>
            <ProfileForm
              profile={profile as any}
              userName={session.name}
              supportedLocations={supportedLocations}
              supportedServices={supportedServices}
              supportedLanguages={supportedLanguages}
            />
          </div>
        )}

        {currentTab === "bookings" && (
          <div>
            {bookings.length === 0 ? (
              <div style={{ padding: "4rem 2rem", textAlign: "center", background: "white", borderRadius: "20px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--ivory-dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.0625rem", marginBottom: "0.375rem" }}>Belum Ada Pesanan</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Pesanan dari Jamaah akan muncul di sini setelah akun Anda aktif.</p>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {bookings.map((booking) => {
                    const color = STATUS_COLORS[booking.status] || { bg: "#eee", color: "#666" };
                    const initials = booking.jamaah.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                    const durationDays = Math.max(1, Math.round((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)));

                    return (
                      <div key={booking.id} style={{ display: "flex", flexDirection: "column", background: "white", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", overflow: "hidden" }}>
                        {/* Header (Booking ID & Status) */}
                        <div style={{ padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ivory)", flexWrap: "wrap", gap: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1px" }}>ORDER ID</span>
                            <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--charcoal)", fontFamily: "monospace", display: "flex", alignItems: "center" }}>
                              #{(booking.id.includes("-") ? booking.id.split("-")[0] : booking.id.slice(0, 8)).toUpperCase()}
                              <CopyButton text={booking.id} />
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <span style={{ padding: "0.25rem 0.75rem", borderRadius: "99px", fontSize: "0.8125rem", fontWeight: 600, background: color.bg, color: color.color }}>
                              {STATUS_LABELS[booking.status] || booking.status}
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
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>
                                Pesanan dari Jamaah
                              </div>
                              <h4 style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--charcoal)" }}>{booking.jamaah.name}</h4>
                              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.25rem" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M4 9h16"/><path d="M9 4v16"/></svg>
                                {booking.jamaah.email}
                              </div>
                            </div>
                          </div>

                          {/* Schedule Info */}
                          <div style={{ flex: "1 1 200px", display: "flex", gap: "2rem" }}>
                            <div>
                              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.375rem" }}>Tanggal Pelaksanaan</div>
                              <div style={{ fontWeight: 700, color: "var(--charcoal)", fontSize: "1rem" }}>{new Date(booking.startDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.375rem" }}>Durasi</div>
                              <div style={{ fontWeight: 700, color: "var(--charcoal)", fontSize: "1rem" }}>{durationDays} Hari</div>
                            </div>
                          </div>

                          {/* Pricing & Action */}
                          <div style={{ flex: "1 1 180px", textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
                            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>Total Pendapatan</div>
                            <div style={{ fontSize: "1.375rem", fontWeight: 800, color: booking.paymentStatus === "PAID" ? "var(--emerald)" : "var(--charcoal)" }}>Rp {booking.totalFee.toLocaleString("id-ID")}</div>
                            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
                               {booking.paymentStatus === "PAID" ? "✅ Menunggu pelaksanaan" : "⏳ Menunggu pembayaran Jamaah"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: "1rem", padding: "1.25rem 1.5rem", borderRadius: "16px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)" }}>Total {bookings.length} pesanan</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.125rem" }}>Total Pendapatan (Lunas)</div>
                    <span style={{ fontWeight: 800, color: "var(--emerald)", fontSize: "1.125rem" }}>
                      Rp {bookings.filter(b => b.paymentStatus === "PAID").reduce((s, b) => s + b.totalFee, 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {currentTab === "wallet" && walletData && (
          <MuthawifWallet wallet={walletData} userId={session.id} />
        )}
        </main>
      </div>
    </div>
  );
}
