import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import SearchForm from "@/components/SearchForm";
import Link from "next/link";

export default async function HomePage() {
  const session = await getSession();
  const globalSet = (await prisma.globalSetting.findUnique({ where: { id: "singleton" } })) as any;
  const supportedLocations = globalSet?.supportedLocations || ["Makkah", "Madinah"];

  // Fetch top muthawifs
  const topMuthawifs = await prisma.user.findMany({
    where: {
      role: "MUTHAWIF",
      profile: {
        verificationStatus: "VERIFIED",
        isAvailable: true,
      }
    },
    include: { profile: true },
    orderBy: [
      { profile: { rating: "desc" } },
      { profile: { totalReviews: "desc" } }
    ],
    take: 4
  });

  return (
    <>
      <Navbar user={session} />

      {/* ── HERO SECTION ── */}
      <section
        id="home"
        style={{
          minHeight: "100svh",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflow: "hidden",
          background: "linear-gradient(155deg, #0a2e1a 0%, #1B6B4A 55%, #27956A 100%)",
          paddingTop: "clamp(6rem, 12vw, 9rem)",
          paddingBottom: "6rem",
        }}
      >
        {/* Decorative circles */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-20%", right: "-15%", width: "70vw", maxWidth: 600, height: "70vw", maxHeight: 600, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", top: "15%", right: "2%", width: "35vw", maxWidth: 280, height: "35vw", maxHeight: 280, borderRadius: "50%", background: "rgba(196,151,59,0.07)", border: "1px solid rgba(196,151,59,0.1)" }} />
          <div style={{ position: "absolute", bottom: "-10%", left: "-8%", width: "50vw", maxWidth: 400, height: "50vw", maxHeight: 400, borderRadius: "50%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }} />
        </div>

        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div className="lp-hero-grid">

            {/* ── Text Block ── */}
            <div className="lp-hero-text">

              {/* Bismillah */}
              <p className="font-arabic lp-bismillah">
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
              </p>

              {/* Badge */}
              <div className="lp-badge-wrap">
                <span className="lp-badge">
                  🕌 Platform Muthawif Pertama di Indonesia
                </span>
              </div>

              {/* Headline */}
              <h1 className="lp-headline">
                Ibadah Lebih{" "}
                <span className="lp-headline-gold">Khusyuk</span>
                {" "}Bersama Muthawif Terpercaya
              </h1>

              {/* Subtitle */}
              <p className="lp-subtitle">
                Temukan pembimbing Umrah profesional yang berpengalaman. Booking langsung, transparan, dan terpercaya.
              </p>

              {/* CTA Buttons */}
              <div className="lp-cta-group">
                <a href="#search" className="lp-btn-primary">
                  🔍 Cari Muthawif
                </a>
                <a href="#cara-kerja" className="lp-btn-secondary">
                  Pelajari Lebih
                </a>
              </div>

              {/* Trust stats */}
              <div className="lp-stats">
                <div className="lp-stat">
                  <span className="lp-stat-num">500+</span>
                  <span className="lp-stat-label">Muthawif Terverifikasi</span>
                </div>
                <div className="lp-stat-divider" />
                <div className="lp-stat">
                  <span className="lp-stat-num">10K+</span>
                  <span className="lp-stat-label">Jamaah Puas</span>
                </div>
                <div className="lp-stat-divider" />
                <div className="lp-stat">
                  <span className="lp-stat-num">4.9★</span>
                  <span className="lp-stat-label">Rating Rata-rata</span>
                </div>
              </div>
            </div>

            {/* ── Search Form ── */}
            <div id="search" className="lp-search-wrap">
              <SearchForm supportedLocations={supportedLocations} />
            </div>

          </div>
        </div>

        {/* Bottom wave */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 70 }}>
            <path d="M0,70 L1440,70 L1440,25 Q1080,70 720,40 Q360,10 0,45 Z" fill="var(--ivory)" />
          </svg>
        </div>

        {/* All responsive CSS for this page */}
        <style>{`
          /* ── Hero Grid ── */
          .lp-hero-grid {
            display: flex;
            flex-direction: column;
            gap: 2.5rem;
            align-items: center;
          }
          .lp-hero-text {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            width: 100%;
          }
          .lp-search-wrap {
            display: flex;
            justify-content: center;
            width: 100%;
          }

          /* ── Bismillah ── */
          .lp-bismillah {
            font-size: clamp(1rem, 4vw, 1.5rem);
            color: rgba(196,151,59,0.9);
            margin-bottom: 1.25rem;
            line-height: 1.8;
          }

          /* ── Badge ── */
          .lp-badge-wrap { margin-bottom: 1rem; }
          .lp-badge {
            display: inline-block;
            background: rgba(196,151,59,0.15);
            border: 1px solid rgba(196,151,59,0.35);
            color: rgba(228,181,90,1);
            padding: 0.4rem 1rem;
            border-radius: 99px;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.05em;
          }

          /* ── Headline ── */
          .lp-headline {
            font-size: clamp(1.875rem, 7vw, 3.75rem);
            font-weight: 900;
            color: white;
            line-height: 1.15;
            margin-bottom: 1.125rem;
            letter-spacing: -0.01em;
            max-width: 620px;
          }
          .lp-headline-gold {
            background: linear-gradient(135deg, #E4B55A, #C4973B);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          /* ── Subtitle ── */
          .lp-subtitle {
            font-size: clamp(0.9375rem, 2.5vw, 1.0625rem);
            color: rgba(255,255,255,0.75);
            line-height: 1.75;
            margin-bottom: 2rem;
            max-width: 480px;
          }

          /* ── CTA Buttons ── */
          .lp-cta-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            width: 100%;
            max-width: 400px;
            margin-bottom: 2.5rem;
          }
          .lp-btn-primary {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem 1.5rem;
            border-radius: 14px;
            background: linear-gradient(135deg, #C4973B, #E4B55A);
            color: white;
            font-weight: 800;
            font-size: 1.0625rem;
            text-decoration: none;
            box-shadow: 0 4px 20px rgba(196,151,59,0.5);
            transition: transform 0.2s, box-shadow 0.2s;
            gap: 0.5rem;
          }
          .lp-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 28px rgba(196,151,59,0.6);
          }
          .lp-btn-secondary {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem 1.5rem;
            border-radius: 14px;
            background: rgba(255,255,255,0.08);
            color: white;
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            border: 1.5px solid rgba(255,255,255,0.22);
            transition: background 0.2s;
          }
          .lp-btn-secondary:hover {
            background: rgba(255,255,255,0.15);
          }

          /* ── Trust Stats ── */
          .lp-stats {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1.25rem;
            padding-top: 1.75rem;
            border-top: 1px solid rgba(255,255,255,0.12);
            width: 100%;
          }
          .lp-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .lp-stat-num {
            font-size: clamp(1.25rem, 4vw, 1.625rem);
            font-weight: 900;
            color: white;
            line-height: 1.1;
          }
          .lp-stat-label {
            font-size: clamp(0.625rem, 1.5vw, 0.75rem);
            color: rgba(255,255,255,0.55);
            margin-top: 0.2rem;
            line-height: 1.3;
            max-width: 80px;
          }
          .lp-stat-divider {
            width: 1px;
            height: 32px;
            background: rgba(255,255,255,0.15);
            flex-shrink: 0;
          }

          /* ── How It Works steps ── */
          .lp-step-icon {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            background: var(--emerald-pale);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--emerald);
            margin: 0 auto 1.25rem;
            flex-shrink: 0;
          }

          /* ── Why Wif-Me feature items ── */
          .lp-feature {
            display: flex;
            gap: 1rem;
            align-items: flex-start;
          }
          .lp-feature-icon {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--emerald);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 2px;
          }

          /* ── Footer CTA section buttons ── */
          .lp-footer-cta-btns {
            display: flex;
            flex-direction: column;
            gap: 0.875rem;
            align-items: center;
            width: 100%;
            max-width: 420px;
            margin: 0 auto;
          }
          .lp-footer-btn-primary {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 1.0625rem 2rem;
            border-radius: 14px;
            background: linear-gradient(135deg, #C4973B, #E4B55A);
            color: white;
            font-weight: 800;
            font-size: 1.0625rem;
            text-decoration: none;
            box-shadow: 0 4px 20px rgba(196,151,59,0.4);
            transition: transform 0.2s;
          }
          .lp-footer-btn-primary:hover { transform: translateY(-2px); }
          .lp-footer-btn-secondary {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 1.0625rem 2rem;
            border-radius: 14px;
            background: rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.9);
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            border: 1.5px solid rgba(255,255,255,0.2);
            transition: background 0.2s;
          }
          .lp-footer-btn-secondary:hover { background: rgba(255,255,255,0.14); }

          /* ── Quote card ── */
          .lp-quote-card {
            background: linear-gradient(135deg, var(--emerald) 0%, #27956A 100%);
            border-radius: 20px;
            padding: clamp(1.5rem, 5vw, 2.25rem);
            position: relative;
            overflow: hidden;
            color: white;
          }

          /* ── CTA card ── */
          .lp-cta-card {
            background: white;
            border-radius: 20px;
            padding: clamp(1.5rem, 5vw, 2rem);
            border: 2px solid var(--emerald-pale);
            box-shadow: 0 4px 16px rgba(0,0,0,0.04);
          }

          /* ─────────── DESKTOP ─────────── */
          @media (min-width: 768px) {
            .lp-hero-grid {
              flex-direction: row;
              align-items: center;
              gap: 3.5rem;
            }
            .lp-hero-text {
              align-items: flex-start;
              text-align: left;
              flex: 1;
            }
            .lp-search-wrap {
              flex: 0 0 auto;
              width: auto;
            }
            .lp-cta-group {
              flex-direction: row;
              max-width: none;
            }
            .lp-btn-primary, .lp-btn-secondary {
              width: auto;
            }
            .lp-stats {
              justify-content: flex-start;
              gap: 2rem;
            }
          }
        `}</style>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="cara-kerja" style={{ padding: "clamp(3.5rem, 8vw, 5.5rem) 0", background: "var(--ivory)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="ornament" style={{ margin: "0 auto 1rem" }} />
            <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.75rem" }}>Cara Kerja Wif-Me</h2>
            <p style={{ fontSize: "clamp(0.9375rem, 2vw, 1.0625rem)", color: "var(--text-muted)", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
              Proses booking yang mudah, cepat, dan transparan dalam 3 langkah sederhana
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "1.25rem" }}>
            {[
              {
                num: "01",
                emoji: "🔍",
                title: "Cari & Filter",
                desc: "Masukkan jadwal, durasi, dan lokasi. Sistem kami menampilkan Muthawif yang benar-benar tersedia.",
              },
              {
                num: "02",
                emoji: "👤",
                title: "Pilih Muthawif",
                desc: "Lihat profil, pengalaman, bahasa, dan ulasan. Pilih yang paling sesuai kebutuhan Anda.",
              },
              {
                num: "03",
                emoji: "💳",
                title: "Book & Bayar",
                desc: "Lakukan pemesanan dan pembayaran secara aman. Lacak status perjalanan secara real-time.",
              },
            ].map((step, i) => (
              <div key={i} style={{ background: "white", borderRadius: "20px", padding: "clamp(1.5rem, 5vw, 2rem)", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid var(--border)" }}>
                <div className="lp-step-icon">
                  <span style={{ fontSize: "1.75rem" }}>{step.emoji}</span>
                </div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                  LANGKAH {step.num}
                </div>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.625rem" }}>{step.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-body)", lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY WIF-ME ── */}
      <section id="tentang" style={{ background: "var(--ivory-dark)", padding: "clamp(3.5rem, 8vw, 5.5rem) 0" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "clamp(2rem, 5vw, 4rem)", alignItems: "start" }}>

            {/* Left: features list */}
            <div>
              <div className="ornament" />
              <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontWeight: 800, color: "var(--charcoal)", marginBottom: "1rem" }}>
                Mengapa Memilih Wif-Me?
              </h2>
              <p style={{ color: "var(--text-body)", lineHeight: 1.8, marginBottom: "2rem", fontSize: "0.9375rem" }}>
                Kami memahami betapa pentingnya perjalanan spiritual Anda. Wif-Me hadir sebagai jembatan antara jamaah mandiri dengan Muthawif profesional terverifikasi.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {[
                  { emoji: "⚡", title: "Ketersediaan Real-Time", desc: "Hanya Muthawif yang benar-benar kosong yang ditampilkan." },
                  { emoji: "💰", title: "Harga Transparan", desc: "Tidak ada biaya tersembunyi. Semua harga tercantum jelas." },
                  { emoji: "📍", title: "Tracking Perjalanan", desc: "Pantau status booking dan perjalanan Umrah real-time." },
                  { emoji: "✅", title: "Muthawif Terverifikasi", desc: "Setiap Muthawif telah melalui verifikasi dokumen & pengalaman." },
                ].map((item, i) => (
                  <div key={i} className="lp-feature">
                    <div className="lp-feature-icon">{item.emoji}</div>
                    <div>
                      <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "0.25rem" }}>{item.title}</h4>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-body)", lineHeight: 1.65 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Quran quote card */}
              <div className="lp-quote-card">
                <div style={{ position: "absolute", top: "-20px", right: "-20px", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                <p className="font-arabic" dir="rtl" style={{ fontSize: "clamp(1.25rem, 4vw, 1.625rem)", lineHeight: 1.8, marginBottom: "1rem", color: "rgba(255,255,255,0.95)", textAlign: "right" }}>
                  وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ
                </p>
                <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.8)", marginBottom: "0.375rem", fontStyle: "italic" }}>
                  "Dan sempurnakanlah ibadah haji dan umrah karena Allah."
                </p>
                <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)" }}>
                  — Al-Baqarah: 196
                </p>
              </div>

              {/* Muthawif CTA card */}
              <div className="lp-cta-card">
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.75rem" }}>
                  Siap Mendaftar sebagai Muthawif?
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-body)", marginBottom: "1.25rem", lineHeight: 1.7 }}>
                  Bergabunglah bersama ratusan Muthawif profesional dan mulai terima booking dari jamaah seluruh Indonesia.
                </p>
                <Link
                  href="/auth/register?role=MUTHAWIF"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.875rem 1.5rem", borderRadius: "12px", background: "var(--emerald)", color: "white", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none", width: "100%", boxSizing: "border-box" }}
                >
                  Daftar sebagai Muthawif →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOP MUTHAWIF ── */}
      {topMuthawifs.length > 0 && (
        <section id="top-muthawif" style={{ padding: "clamp(3.5rem, 8vw, 5.5rem) 0", background: "white" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <div className="ornament" style={{ margin: "0 auto 1rem" }} />
              <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.75rem" }}>
                Top Muthawif Pilihan
              </h2>
              <p style={{ fontSize: "clamp(0.9375rem, 2vw, 1.0625rem)", color: "var(--text-muted)", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
                Temukan Muthawif yang tepat untuk mendampingi ibadah Anda. Semua telah melalui verifikasi ketat.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
              {topMuthawifs.map((m) => (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", height: "100%", border: "1.5px solid var(--border)", borderRadius: "20px", overflow: "hidden", background: "white", transition: "transform 0.3s, box-shadow 0.3s" }}>
                  <div style={{ height: 120, background: "linear-gradient(145deg, var(--emerald), #004D40)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
                    ) : (
                      <div style={{ fontSize: "3rem", color: "rgba(255,255,255,0.2)" }}>👤</div>
                    )}
                    <div style={{ position: "absolute", top: 12, right: 12, width: 26, height: 26, background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 2 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                    </div>
                    {m.profile?.specializations && m.profile.specializations.length > 0 && (
                      <span style={{ position: "absolute", bottom: 12, left: 12, background: "var(--emerald-dark)", color: "white", fontSize: "0.65rem", fontWeight: 700, padding: "4px 10px", borderRadius: "50px", letterSpacing: "0.03em" }}>
                        {m.profile.specializations[0]}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "4px" }}>{m.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "12px" }}>
                      <span style={{ color: "var(--gold)", fontSize: "0.8rem" }}>★</span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--charcoal)" }}>{m.profile?.rating.toFixed(1)}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>({m.profile?.totalReviews} ulasan)</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {m.profile?.languages && m.profile.languages.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span>🌍</span> {m.profile.languages.join(", ")}</div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span>⏱️</span> {m.profile?.experience || 0} thn pengalaman</div>
                      {m.profile?.operatingAreas && m.profile.operatingAreas.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span>📍</span> {m.profile.operatingAreas.join(" & ")}</div>
                      )}
                    </div>
                    <Link href={`/muthawif/${m.id}`} style={{ marginTop: "auto", display: "block", textAlign: "center", background: "var(--emerald-pale)", color: "var(--emerald)", fontWeight: 700, fontSize: "0.875rem", padding: "0.75rem", borderRadius: "12px", textDecoration: "none" }}>
                      Lihat Profil
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <Link href="/search" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "1rem 1.5rem", borderRadius: "14px", border: "1.5px solid var(--emerald)", color: "var(--emerald)", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none" }}>
                Lihat Semua Muthawif →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONI PLATFORM ── */}
      <section id="testimoni" style={{ padding: "clamp(3.5rem, 8vw, 5.5rem) 0", background: "var(--ivory-dark)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="ornament" style={{ margin: "0 auto 1rem" }} />
            <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.75rem" }}>
              Mereka Sudah Merasakan Bedanya
            </h2>
            <p style={{ fontSize: "clamp(0.9375rem, 2vw, 1.0625rem)", color: "var(--text-muted)", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
              Kepercayaan jamaah adalah fondasi Wifme. Ini kisah nyata pengalaman menggunakan platform kami.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", alignItems: "stretch" }}>
            {[
              { text: "Alhamdulillah, umrah kami terasa sangat berbeda. Pembayaran via escrow membuat kami tenang. Ustadz yang mendampingi sangat memahami kondisi ibu saya yang sudah sepuh.", author: "Ahmad Fauzi", loc: "Jakarta · Umrah 2024" },
              { text: "Pertama kali umrah mandiri dan sangat terbantu oleh platform ini. Booking mudah, harga transparan, dan muthawif sangat sabar membimbing dari awal sampai akhir.", author: "Siti Rahmawati", loc: "Bandung · Umrah Pertama" },
              { text: "Berangkat sekeluarga dengan 3 anak kecil. Platform Wifme sangat membantu mencari muthawif family-friendly. Anak-anak bisa ikut ibadah dengan tenang dan nyaman.", author: "Keluarga Rizky", loc: "Surabaya · Family Trip" },
            ].map((t, i) => (
              <div key={i} style={{ background: "white", padding: "2rem", borderRadius: "20px", border: "1.5px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: "var(--gold)", fontSize: "1.2rem", marginBottom: "1rem" }}>★★★★★</div>
                  <p style={{ fontSize: "0.9375rem", fontStyle: "italic", lineHeight: 1.8, color: "var(--text-body)", marginBottom: "1.5rem" }}>
                    "{t.text}"
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, var(--emerald), #27956A)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem" }}>
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--charcoal)", fontSize: "0.9375rem" }}>{t.author}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TUMBUH BERSAMA ── */}
      <section id="bergabung" style={{ padding: "clamp(4rem, 8vw, 6rem) 0", background: "linear-gradient(150deg, var(--charcoal) 0%, #0d2a26 100%)", position: "relative", overflow: "hidden" }}>
        {/* Geometric background pattern */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle at 20% 50%, rgba(27,107,74,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(196,151,59,0.1) 0%, transparent 50%)" }} />

        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div style={{ display: "inline-block", padding: "0.4rem 1rem", background: "rgba(255,255,255,0.08)", borderRadius: "50px", color: "var(--emerald-light)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Bergabung Bersama Wifme</div>
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, color: "white", marginBottom: "1rem", letterSpacing: "-0.02em" }}>
              Tumbuh Bersama Platform<br />Muslim Travel Terbesar
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9375rem", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
              Bergabunglah sebagai jamaah untuk pengalaman ibadah yang tenang, atau daftarkan diri Anda sebagai mitra muthawif profesional.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            {/* Jamaah Card */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", padding: "2.5rem 2rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, var(--emerald), #4DB6AC)" }} />
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, var(--emerald), #004D40)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", marginBottom: "1.5rem" }}>
                👤
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", marginBottom: "0.75rem" }}>Saya Jamaah</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9375rem", lineHeight: 1.7, marginBottom: "2rem" }}>
                Temukan pendamping ibadah terpercaya, booking langsung, dan nikmati perjalanan umrah yang lebih khusyuk dan nyaman.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
                {["Pilih dari ratusan muthawif terverifikasi", "Booking & bayar dalam satu platform aman", "Pantau perjalanan real-time via app", "Garansi uang kembali jika dibatalkan"].map((perk, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--emerald-light)" }}>✓</span> {perk}
                  </div>
                ))}
              </div>
              <Link href="/auth/register" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "1rem", borderRadius: "14px", background: "var(--emerald)", color: "white", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none" }}>
                Daftar sebagai Jamaah
              </Link>
            </div>

            {/* Muthawif Card */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", padding: "2.5rem 2rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, var(--gold), #F0C040)" }} />
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, var(--gold), #9a6a10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", marginBottom: "1.5rem" }}>
                💼
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", marginBottom: "0.75rem" }}>Saya Muthawif</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9375rem", lineHeight: 1.7, marginBottom: "2rem" }}>
                Daftarkan diri sebagai mitra Wifme dan dapatkan jamaah lebih banyak, kelola jadwal lebih mudah, dan tingkatkan penghasilan.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
                {["Akses ke ribuan jamaah potensial", "Atur jadwal & tarif layanan sendiri", "Pembayaran cepat & aman via escrow", "Dashboard profesional & laporan keuangan"].map((perk, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "rgba(255,255,255,0.8)", fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--gold)" }}>✓</span> {perk}
                  </div>
                ))}
              </div>
              <Link href="/auth/register?role=MUTHAWIF" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "1rem", borderRadius: "14px", background: "linear-gradient(135deg, var(--gold), #E4B55A)", color: "white", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none", boxShadow: "0 4px 20px rgba(196,151,59,0.3)" }}>
                Daftar jadi Mitra Muthawif
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA BAND ── */}
      <section style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", padding: "clamp(3.5rem, 8vw, 5rem) 0", textAlign: "center" }}>
        <div className="container">
          <div style={{ marginBottom: "0.75rem", fontSize: "2rem" }}>🌙</div>
          <h2 style={{ fontSize: "clamp(1.625rem, 5vw, 2.5rem)", fontWeight: 900, color: "white", marginBottom: "1rem", lineHeight: 1.2 }}>
            Mulai Perjalanan Spiritual Anda
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: "2.5rem", fontSize: "clamp(0.9375rem, 2vw, 1.0625rem)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 2.5rem" }}>
            Daftar sekarang dan temukan Muthawif terbaik untuk perjalanan Umrah Anda
          </p>
          <div className="lp-footer-cta-btns">
            <Link href="/#search" className="lp-footer-btn-primary">
              🔍 Cari Muthawif Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0a0a0a", color: "rgba(255,255,255,0.6)", padding: "4rem 0 2rem", fontSize: "0.875rem", paddingBottom: "calc(2rem + 64px)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "3rem", marginBottom: "3rem" }}>

            {/* Brand Column */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden" }}>
                  <img src="/logo-icon.png" alt="Wifme" width={32} height={32} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <span style={{ color: "white", fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.02em" }}>Wif<span style={{ color: "var(--gold)" }}>-Me</span></span>
              </div>
              <p style={{ lineHeight: 1.7, marginBottom: "1.5rem" }}>
                Platform muslim travel pertama yang menghubungkan jamaah dengan Muthawif terpercaya di Makkah dan Madinah.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <a href="#" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", textDecoration: "none", transition: "background 0.2s" }}>IG</a>
                <a href="#" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", textDecoration: "none", transition: "background 0.2s" }}>WA</a>
                <a href="#" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", textDecoration: "none", transition: "background 0.2s" }}>YT</a>
              </div>
            </div>

            {/* Layanan */}
            <div>
              <h4 style={{ color: "white", fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem" }}>Layanan</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <li><a href="#" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.2s" }}>Pendampingan Umrah</a></li>
                <li><a href="#" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.2s" }}>Family Muslim Trip</a></li>
                <li><a href="#" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.2s" }}>Pendampingan Lansia</a></li>
                <li><a href="#" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.2s" }}>City Tour Makkah & Madinah</a></li>
              </ul>
            </div>

            {/* Bergabung */}
            <div>
              <h4 style={{ color: "white", fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem" }}>Bergabung</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <li><Link href="/auth/register" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.2s" }}>Daftar sebagai Jamaah</Link></li>
                <li><Link href="/auth/register?role=MUTHAWIF" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.2s" }}>Daftar Mitra Muthawif</Link></li>
                <li><a href="#" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.2s" }}>Program Pelatihan</a></li>
              </ul>
            </div>

            {/* Hubungi Kami */}
            <div>
              <h4 style={{ color: "white", fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem" }}>Hubungi Kami</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--emerald)" }}>📞</span> +62 812-3456-7890
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--emerald)" }}>✉️</span> halo@wifme.id
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--emerald)" }}>📍</span> Jakarta & Makkah
                </li>
              </ul>
            </div>
          </div>

          <div style={{ paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", fontSize: "0.8rem" }}>
            <p>&copy; {new Date().getFullYear()} Wif-Me. Semua hak dilindungi undang-undang.</p>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <Link href="/privacy" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Kebijakan Privasi</Link>
              <Link href="/terms" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Syarat & Ketentuan</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
