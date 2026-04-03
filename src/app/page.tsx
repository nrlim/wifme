import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import SearchForm from "@/components/SearchForm";
import Link from "next/link";

export default async function HomePage() {
  const session = await getSession();

  return (
    <>
      <Navbar user={session} />

      {/* ── HERO SECTION ── */}
      <section
        style={{
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          background: "linear-gradient(160deg, #0f3d28 0%, #1B6B4A 45%, #2A8A60 100%)",
        }}
      >
        {/* Decorative geometric pattern */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {/* Large circle top-right */}
          <div style={{
            position: "absolute",
            top: "-15%",
            right: "-10%",
            width: "60vw",
            maxWidth: 700,
            height: "60vw",
            maxHeight: 700,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }} />
          {/* Medium circle, offset */}
          <div style={{
            position: "absolute",
            top: "10%",
            right: "5%",
            width: "30vw",
            maxWidth: 360,
            height: "30vw",
            maxHeight: 360,
            borderRadius: "50%",
            background: "rgba(196, 151, 59, 0.08)",
            border: "1px solid rgba(196, 151, 59, 0.12)",
          }} />
          {/* Bottom-left geometric */}
          <div style={{
            position: "absolute",
            bottom: "-5%",
            left: "-5%",
            width: "40vw",
            maxWidth: 480,
            height: "40vw",
            maxHeight: 480,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }} />
          {/* Horizontal accent line */}
          <div style={{
            position: "absolute",
            bottom: "18%",
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(196,151,59,0.3), transparent)",
          }} />
          {/* Kaaba silhouette SVG subtle */}
          <svg
            style={{ position: "absolute", bottom: 0, right: "8%", opacity: 0.04, width: 280 }}
            viewBox="0 0 200 180"
            fill="white"
          >
            <rect x="20" y="60" width="160" height="120" rx="4"/>
            <rect x="80" y="110" width="40" height="70"/>
            <rect x="10" y="55" width="180" height="12"/>
            <polygon points="100,10 10,55 190,55"/>
          </svg>
        </div>

        <div className="container" style={{ position: "relative", zIndex: 2, paddingTop: "7rem", paddingBottom: "4rem" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            alignItems: "center",
          }} className="hero-grid">
            {/* Left: Headline + CTA */}
            <div>
              {/* Bismillah */}
              <p
                className="font-arabic"
                style={{
                  fontSize: "clamp(1.375rem, 2.5vw, 1.875rem)",
                  color: "rgba(196,151,59,0.9)",
                  marginBottom: "1.25rem",
                  lineHeight: 1.8,
                  letterSpacing: "0.02em",
                }}
              >
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
              </p>

              <div style={{ marginBottom: "1rem" }}>
                <span style={{
                  display: "inline-block",
                  background: "rgba(196,151,59,0.15)",
                  border: "1px solid rgba(196,151,59,0.3)",
                  color: "rgba(196,151,59,0.95)",
                  padding: "0.375rem 1rem",
                  borderRadius: "99px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  Platform Muthawif Pertama di Indonesia
                </span>
              </div>

              <h1 style={{
                fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                fontWeight: 800,
                color: "white",
                lineHeight: 1.15,
                marginBottom: "1.25rem",
                letterSpacing: "-0.025em",
              }}>
                Ibadah Lebih{" "}
                <span style={{
                  background: "linear-gradient(135deg, #E4B55A, #C4973B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  Khusyuk
                </span>
                {" "}Bersama Muthawif Terpercaya
              </h1>

              <p style={{
                fontSize: "clamp(1rem, 1.8vw, 1.125rem)",
                color: "rgba(255,255,255,0.78)",
                lineHeight: 1.75,
                marginBottom: "2rem",
                maxWidth: 480,
              }}>
                Temukan pembimbing Umrah profesional yang berpengalaman. Booking langsung, transparan, dan terpercaya — semua dalam satu platform.
              </p>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <a href="#search" className="btn btn-gold btn-lg">
                  Cari Muthawif
                </a>
                <a href="#cara-kerja" className="btn" style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  backdropFilter: "blur(8px)",
                  padding: "0.9375rem 2rem",
                  fontSize: "1.0625rem",
                }}>
                  Pelajari Lebih
                </a>
              </div>

              {/* Trust indicators */}
              <div style={{
                display: "flex",
                gap: "2rem",
                marginTop: "2.5rem",
                paddingTop: "2rem",
                borderTop: "1px solid rgba(255,255,255,0.12)",
                flexWrap: "wrap",
              }}>
                {[
                  { num: "500+", label: "Muthawif Terverifikasi" },
                  { num: "10K+", label: "Jamaah Puas" },
                  { num: "4.9", label: "Rating Rata-rata" },
                ].map((stat) => (
                  <div key={stat.num}>
                    <div style={{ fontSize: "1.625rem", fontWeight: 800, color: "white" }}>{stat.num}</div>
                    <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", marginTop: "0.125rem" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Search Form */}
            <div id="search" style={{ display: "flex", justifyContent: "center" }}>
              <SearchForm />
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 80 }}>
            <path d="M0,80 L1440,80 L1440,30 Q1080,80 720,45 Q360,10 0,50 Z" fill="var(--ivory)" />
          </svg>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="cara-kerja" className="section" style={{ background: "var(--ivory)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div className="ornament" style={{ margin: "0 auto 1.25rem" }} />
            <h2 className="section-title">Cara Kerja Wif-Me</h2>
            <p className="section-subtitle" style={{ maxWidth: 520, margin: "0 auto" }}>
              Proses booking yang mudah, cepat, dan transparan dalam 3 langkah sederhana
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "2rem",
          }} className="steps-grid">
            {[
              {
                num: "01",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                ),
                title: "Cari & Filter",
                desc: "Masukkan jadwal keberangkatan, durasi, dan lokasi. Sistem akan menampilkan Muthawif yang benar-benar tersedia.",
              },
              {
                num: "02",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                title: "Pilih Muthawif",
                desc: "Lihat profil, pengalaman, bahasa, dan ulasan. Pilih Muthawif yang paling sesuai dengan kebutuhan Anda.",
              },
              {
                num: "03",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>
                  </svg>
                ),
                title: "Book & Bayar",
                desc: "Lakukan pemesanan dan pembayaran secara aman. Lacak status perjalanan Anda secara real-time.",
              },
            ].map((step, i) => (
              <div key={i} className="card" style={{ padding: "2rem", textAlign: "center", border: "none" }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: "var(--radius-md)",
                  background: "var(--emerald-pale)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--emerald)",
                  margin: "0 auto 1.25rem",
                }}>
                  {step.icon}
                </div>
                <div style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--gold)",
                  letterSpacing: "0.1em",
                  marginBottom: "0.5rem",
                }}>
                  LANGKAH {step.num}
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem" }}>{step.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-body)", lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY WIF-ME ── */}
      <section id="tentang" style={{ background: "var(--ivory-dark)", padding: "5rem 0" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="about-grid">
            <div>
              <div className="ornament" />
              <h2 className="section-title" style={{ marginBottom: "1rem" }}>
                Mengapa Memilih Wif-Me?
              </h2>
              <p style={{ color: "var(--text-body)", lineHeight: 1.8, marginBottom: "2rem", fontSize: "1rem" }}>
                Kami memahami betapa pentingnya perjalanan spiritual Anda. Wif-Me hadir sebagai jembatan antara jamaah mandiri dengan Muthawif profesional yang telah terverifikasi.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {[
                  {
                    icon: "✓",
                    title: "Ketersediaan Real-Time",
                    desc: "Sistem cerdas kami memastikan hanya Muthawif yang benar-benar kosong yang ditampilkan.",
                  },
                  {
                    icon: "✓",
                    title: "Harga Transparan",
                    desc: "Tidak ada biaya tersembunyi. Semua harga tercantum jelas sejak awal.",
                  },
                  {
                    icon: "✓",
                    title: "Tracking Perjalanan",
                    desc: "Pantau status booking dan perjalanan Umrah Anda secara real-time.",
                  },
                  {
                    icon: "✓",
                    title: "Muthawif Terverifikasi",
                    desc: "Setiap Muthawif telah melalui proses verifikasi dokumen dan pengalaman.",
                  },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--emerald)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 2,
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.25rem" }}>{item.title}</h4>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-body)", lineHeight: 1.65 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Quote card */}
              <div style={{
                background: "linear-gradient(135deg, var(--emerald) 0%, var(--emerald-light) 100%)",
                borderRadius: "var(--radius-xl)",
                padding: "2.5rem 2rem",
                color: "white",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                }} />
                <p
                  className="font-arabic"
                  style={{ fontSize: "1.25rem", lineHeight: 2, marginBottom: "1rem", color: "rgba(255,255,255,0.95)", direction: "rtl" }}
                >
                  وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ
                </p>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.75)", marginBottom: "0.5rem" }}>
                  "Dan sempurnakanlah ibadah haji dan umrah karena Allah."
                </p>
                <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
                  — Al-Baqarah: 196
                </p>
              </div>

              {/* CTA Card */}
              <div className="card" style={{ padding: "1.75rem", border: "2px solid var(--emerald-pale)" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                  Siap Mendaftar sebagai Muthawif?
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-body)", marginBottom: "1.25rem", lineHeight: 1.65 }}>
                  Bergabunglah bersama ratusan Muthawif profesional dan mulai terima booking dari jamaah seluruh Indonesia.
                </p>
                <Link
                  href="/auth/register?role=MUTHAWIF"
                  className="btn btn-primary"
                  style={{ display: "inline-flex" }}
                >
                  Daftar sebagai Muthawif
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA BAND ── */}
      <section style={{
        background: "linear-gradient(135deg, var(--charcoal) 0%, #1a1a1a 100%)",
        padding: "4rem 0",
        textAlign: "center",
      }}>
        <div className="container">
          <h2 style={{ color: "white", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", marginBottom: "1rem" }}>
            Mulai Perjalanan Spiritual Anda
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: "2rem", fontSize: "1.0625rem" }}>
            Daftar sekarang dan temukan Muthawif terbaik untuk perjalanan Umrah Anda
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/register" className="btn btn-gold btn-lg">
              Daftar Gratis
            </Link>
            <a href="#search" className="btn" style={{
              background: "rgba(255,255,255,0.1)",
              color: "white",
              border: "1.5px solid rgba(255,255,255,0.2)",
              padding: "0.9375rem 2.25rem",
              fontSize: "1.0625rem",
            }}>
              Cari Muthawif
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: "#111",
        color: "rgba(255,255,255,0.5)",
        padding: "2.5rem 0",
        textAlign: "center",
        fontSize: "0.875rem",
      }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "7px",
              background: "var(--emerald)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <span style={{ color: "white", fontWeight: 700 }}>Wif-Me</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Wif-Me. Semua hak dilindungi.</p>
          <p style={{ marginTop: "0.5rem" }}>Platform Marketplace Muthawif & Umrah Mandiri</p>
        </div>
      </footer>


    </>
  );
}
