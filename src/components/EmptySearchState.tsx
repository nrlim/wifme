"use client";

import Link from "next/link";

interface EmptySearchStateProps {
  startDate?: string;
  duration?: string;
  location?: string;
}

const SUGGESTIONS = [
  {
    icon: "📅",
    title: "Coba tanggal berbeda",
    desc: "Muthawif mungkin tersedia di tanggal lain. Coba geser tanggal keberangkatan beberapa hari.",
  },
  {
    icon: "📍",
    title: "Perluas area lokasi",
    desc: "Pilih 'Semua Lokasi' atau coba lokasi lain seperti Makkah & Madinah sekaligus.",
  },
  {
    icon: "⏱",
    title: "Sesuaikan durasi",
    desc: "Muthawif dengan jadwal penuh mungkin tersedia untuk durasi yang lebih pendek atau lebih panjang.",
  },
];

const QUICK_LINKS = [
  { label: "📞 Hubungi Support", href: "/#contact", desc: "Kami bantu carikan muthawif" },
  { label: "📖 Cara Kerja", href: "/#cara-kerja", desc: "Pelajari proses pemesanan" },
  { label: "✨ Daftar Sebagai Muthawif", href: "/auth/register?role=muthawif", desc: "Daftarkan diri Anda" },
];

export default function EmptySearchState({ startDate, duration, location }: EmptySearchStateProps) {
  const locLabel = location && location !== "ALL"
    ? location === "BOTH" ? "Makkah & Madinah" : location.charAt(0) + location.slice(1).toLowerCase()
    : null;

  const dateLabel = startDate
    ? new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="empty-state-root">

      {/* ── Hero / Message ── */}
      <div className="empty-hero">
        {/* Decorative blobs */}
        <div className="empty-blob empty-blob-1" />
        <div className="empty-blob empty-blob-2" />

        <div className="empty-hero-inner">
          <div className="empty-icon-wrap">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <line x1="11" y1="8" x2="11" y2="13" />
              <line x1="11" y1="16" x2="11.01" y2="16" />
            </svg>
          </div>

          <h2 className="empty-title">
            Muthawif Tidak <span className="empty-title-accent">Tersedia</span>
          </h2>

          <p className="empty-subtitle">
            Tidak ada muthawif yang tersedia
            {dateLabel && <> pada <strong>{dateLabel}</strong></>}
            {duration && <> · <strong>{duration} hari</strong></>}
            {locLabel && <> di <strong>{locLabel}</strong></>}.
            {" "}Coba sesuaikan kriteria pencarian Anda.
          </p>

          <div className="empty-actions">
            <Link href="/search" className="empty-btn-primary">
              🔄 Reset Semua Filter
            </Link>
            <Link href="/" className="empty-btn-secondary">
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tips Section ── */}
      <div className="empty-tips-section">
        <div className="empty-section-label">💡 Tips Pencarian</div>
        <div className="empty-tips-grid">
          {SUGGESTIONS.map((s, i) => (
            <div key={i} className="empty-tip-card">
              <div className="empty-tip-icon">{s.icon}</div>
              <div>
                <div className="empty-tip-title">{s.title}</div>
                <div className="empty-tip-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Links ── */}
      <div className="empty-links-section">
        <div className="empty-section-label">🔗 Butuh Bantuan?</div>
        <div className="empty-links-grid">
          {QUICK_LINKS.map((l, i) => (
            <Link key={i} href={l.href} className="empty-link-card">
              <div className="empty-link-label">{l.label}</div>
              <div className="empty-link-desc">{l.desc}</div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginTop: "auto", color: "var(--emerald)" }}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        /* ─── Root ─── */
        .empty-state-root {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* ─── Hero ─── */
        .empty-hero {
          position: relative;
          background: white;
          border-radius: 28px;
          border: 1px solid rgba(27,107,74,0.08);
          padding: 4rem 2rem;
          text-align: center;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.03);
        }
        .empty-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .empty-blob-1 {
          width: 340px; height: 340px;
          top: -120px; right: -120px;
          background: radial-gradient(circle, rgba(27,107,74,0.07) 0%, transparent 70%);
        }
        .empty-blob-2 {
          width: 260px; height: 260px;
          bottom: -90px; left: -80px;
          background: radial-gradient(circle, rgba(196,151,59,0.07) 0%, transparent 70%);
        }
        .empty-hero-inner {
          position: relative;
          z-index: 1;
          max-width: 580px;
          margin: 0 auto;
        }
        .empty-icon-wrap {
          width: 88px;
          height: 88px;
          border-radius: 28px;
          background: linear-gradient(135deg, white, var(--emerald-pale));
          color: var(--emerald);
          border: 1.5px solid rgba(27,107,74,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          box-shadow: 0 12px 28px rgba(27,107,74,0.1);
        }
        .empty-title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 900;
          color: var(--charcoal);
          letter-spacing: -0.025em;
          line-height: 1.15;
          margin-bottom: 1rem;
        }
        .empty-title-accent {
          color: var(--emerald);
        }
        .empty-subtitle {
          font-size: 1.0625rem;
          color: var(--text-muted);
          line-height: 1.7;
          margin: 0 auto 2.5rem;
        }
        .empty-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .empty-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 2rem;
          background: linear-gradient(135deg, var(--emerald), #27956A);
          color: white;
          font-weight: 800;
          font-size: 0.9375rem;
          border-radius: 14px;
          text-decoration: none;
          box-shadow: 0 6px 20px rgba(27,107,74,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .empty-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(27,107,74,0.35);
        }
        .empty-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: white;
          color: var(--charcoal);
          font-weight: 700;
          font-size: 0.9375rem;
          border-radius: 14px;
          text-decoration: none;
          border: 1.5px solid var(--border);
          transition: border-color 0.2s, background 0.2s;
        }
        .empty-btn-secondary:hover {
          border-color: var(--emerald);
          background: var(--emerald-pale);
          color: var(--emerald);
        }

        /* ─── Section Label ─── */
        .empty-section-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 1rem;
        }

        /* ─── Tips ─── */
        .empty-tips-section {
          padding: 0;
        }
        .empty-tips-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.875rem;
        }
        @media (min-width: 640px) {
          .empty-tips-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .empty-tip-card {
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          border: 1px solid rgba(27,107,74,0.07);
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .empty-tip-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }
        .empty-tip-icon {
          font-size: 1.75rem;
          flex-shrink: 0;
          line-height: 1;
          margin-top: 2px;
        }
        .empty-tip-title {
          font-weight: 800;
          font-size: 0.9375rem;
          color: var(--charcoal);
          margin-bottom: 0.375rem;
        }
        .empty-tip-desc {
          font-size: 0.8125rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* ─── Quick Links ─── */
        .empty-links-section {
          padding: 0;
        }
        .empty-links-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .empty-links-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .empty-link-card {
          background: white;
          border-radius: 18px;
          padding: 1.25rem 1.5rem;
          border: 1.2px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          text-decoration: none;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .empty-link-card:hover {
          border-color: var(--emerald);
          box-shadow: 0 6px 20px rgba(27,107,74,0.1);
          transform: translateY(-2px);
        }
        .empty-link-label {
          font-weight: 800;
          font-size: 0.875rem;
          color: var(--charcoal);
          margin-bottom: 0.125rem;
        }
        .empty-link-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
