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
              <SearchForm />
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
                  { emoji: "📍", title: "Tracking Perjalanan", desc: "Pantau status booking dan perjalanan Umrah Anda real-time." },
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
            <Link href="/auth/register" className="lp-footer-btn-primary">
              ✨ Daftar Gratis Sekarang
            </Link>
            <a href="#search" className="lp-footer-btn-secondary">
              🔍 Cari Muthawif
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0d0d0d", color: "rgba(255,255,255,0.45)", padding: "2.5rem 0", textAlign: "center", fontSize: "0.875rem" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--emerald)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <span style={{ color: "white", fontWeight: 700, fontSize: "1rem" }}>Wif-Me</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Wif-Me. Semua hak dilindungi.</p>
          <p style={{ marginTop: "0.375rem" }}>Platform Marketplace Muthawif &amp; Umrah Mandiri</p>
        </div>
      </footer>
    </>
  );
}
