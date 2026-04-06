'use client';

import { useState } from 'react';
import { requestWithdrawal } from '@/actions/finance';

interface Tx {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  createdAt: Date;
}

interface WalletData {
  id: string;
  availableBalance: number;
  escrowBalance: number;
  transactions: Tx[];
}

const TX_LABEL: Record<string, string> = {
  PAYMENT_ESCROW:    'Pembayaran Jamaah → Escrow',
  ESCROW_SETTLEMENT: 'Pencairan Amanah → Tersedia',
  WITHDRAWAL:        'Penarikan Dana',
};

const TX_ICON_BG: Record<string, { bg: string; text: string; icon: string }> = {
  PAYMENT_ESCROW:    { bg: 'rgba(59,130,246,0.08)',  text: '#1D4ED8', icon: '⬇' },
  ESCROW_SETTLEMENT: { bg: 'rgba(27,107,74,0.08)',   text: '#166534', icon: '✓' },
  WITHDRAWAL:        { bg: 'rgba(217,119,6,0.08)',   text: '#92400E', icon: '↑' },
};

const STATUS_PILL: Record<string, { label: string; bg: string; text: string }> = {
  SUCCESS: { label: 'Sukses', bg: '#DCFCE7', text: '#166534' },
  PENDING: { label: 'Proses', bg: '#FEF9C3', text: '#854D0E' },
  FAILED:  { label: 'Gagal',  bg: '#FEE2E2', text: '#991B1B' },
};

const BANKS = ['BSI', 'BCA', 'BNI', 'Mandiri', 'BRI', 'CIMB Niaga', 'Permata', 'Lainnya'];

/** Format IDR — uses non-breaking space between "Rp" and digits for clean layout */
function fmtRp(v: number) {
  return 'Rp\u00A0' + Math.round(v).toLocaleString('id-ID');
}

/** Compact format for stats panel */
function fmtCompact(v: number) {
  if (v >= 1_000_000) return 'Rp\u00A0' + (v / 1_000_000).toFixed(2) + '\u00A0jt';
  if (v >= 1_000)     return 'Rp\u00A0' + (v / 1_000).toFixed(0) + '\u00A0rb';
  return fmtRp(v);
}

export default function MuthawifWallet({ wallet, userId }: { wallet: WalletData; userId: string }) {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [form, setForm] = useState({ amount: '', bankName: '', accountNumber: '', accountHolderName: '' });
  const [msg,     setMsg]     = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg('');
    try {
      await requestWithdrawal(
        userId, parseInt(form.amount) || 0,
        form.bankName, form.accountNumber, form.accountHolderName,
      );
      setMsgType('success');
      setMsg('Permintaan penarikan berhasil diajukan! Dana akan diproses dalam 1–3 hari kerja.');
      setForm({ amount: '', bankName: '', accountNumber: '', accountHolderName: '' });
      setTimeout(() => setShowWithdraw(false), 3000);
    } catch (err: unknown) {
      setMsgType('error');
      setMsg(err instanceof Error ? err.message : 'Gagal mengajukan penarikan');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Financial Calculations (CORRECTED) ──────────────────────────────────────
  //
  // Alur dana di sistem:
  //   Jamaah bayar totalFee
  //     └→ Platform ambil (totalFee - baseFee) sebagai komisi
  //     └→ baseFee masuk ke wallet muthawif sebagai PAYMENT_ESCROW
  //   Saat booking COMPLETED → ESCROW_SETTLEMENT memindahkan dana ke availableBalance
  //   Muthawif request WITHDRAWAL → dana keluar
  //
  // ❌ Bug lama: menghitung PAYMENT_ESCROW + ESCROW_SETTLEMENT = double count
  // ✅ Fix: totalGross = PAYMENT_ESCROW (uang masuk dari jamaah, sudah neto fee platform)
  //        totalNetSettled = ESCROW_SETTLEMENT (perpindahan internal escrow → available)
  //        totalOut = WITHDRAWAL (uang keluar ke rekening)

  const totalGross = wallet.transactions
    .filter(t => t.type === 'PAYMENT_ESCROW' && t.status === 'SUCCESS')
    .reduce((s, t) => s + t.amount, 0);

  const totalNetSettled = wallet.transactions
    .filter(t => t.type === 'ESCROW_SETTLEMENT' && t.status === 'SUCCESS')
    .reduce((s, t) => s + t.amount, 0);

  const totalOut = wallet.transactions
    .filter(t => t.type === 'WITHDRAWAL' && t.status === 'SUCCESS')
    .reduce((s, t) => s + t.amount, 0);

  const escrowCount = wallet.transactions.filter(t => t.type === 'PAYMENT_ESCROW').length;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Balance Hero ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d2818 0%, #1B6B4A 55%, #27956A 100%)',
        borderRadius: 24,
        padding: 'clamp(1.5rem, 4vw, 2rem)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -80, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        {/* Row 1: Two balances side by side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr',
          gap: '0',
          marginBottom: '1.125rem',
          position: 'relative',
        }}>
          {/* Dana Amanah */}
          <div style={{ paddingRight: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.5875rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Dana Amanah (Escrow)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {fmtRp(wallet.escrowBalance)}
            </div>
            <div style={{ fontSize: '0.6875rem', opacity: 0.5, marginTop: '0.375rem' }}>Menunggu penyelesaian ibadah</div>
          </div>

          {/* Divider */}
          <div style={{ background: 'rgba(255,255,255,0.15)' }} />

          {/* Saldo Tersedia */}
          <div style={{ paddingLeft: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.5875rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Saldo Tersedia
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {fmtRp(wallet.availableBalance)}
            </div>
            <div style={{ marginTop: '0.625rem' }}>
              <button
                onClick={() => setShowWithdraw(!showWithdraw)}
                disabled={wallet.availableBalance <= 0}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.375rem 0.875rem',
                  background: wallet.availableBalance > 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  borderRadius: 99, color: 'white',
                  fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 700,
                  cursor: wallet.availableBalance > 0 ? 'pointer' : 'not-allowed',
                  opacity: wallet.availableBalance > 0 ? 1 : 0.5,
                  backdropFilter: 'blur(6px)',
                  transition: 'all 0.15s',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                Tarik Dana
              </button>
              {wallet.availableBalance <= 0 && (
                <div style={{ fontSize: '0.6875rem', opacity: 0.5, marginTop: '0.3rem' }}>Belum ada saldo tersedia</div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: 4 stat pills full-width */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', position: 'relative' }}>
          {[
            { label: 'Diterima Jamaah',  value: fmtCompact(totalGross),      color: '#86EFAC' },
            { label: 'Sudah Cair',       value: fmtCompact(totalNetSettled), color: '#6EE7B7' },
            { label: 'Total Ditarik',    value: fmtCompact(totalOut),        color: '#FCA5A5' },
            { label: 'Jml Booking',      value: `${escrowCount}x`,           color: '#93C5FD' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(0,0,0,0.18)',
              borderRadius: 10,
              padding: '0.5rem 0.75rem',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: '0.5625rem', fontWeight: 700, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 900, color: s.color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fee Info Banner ───────────────────────────────────────────────────── */}
      {totalGross > 0 && (
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid #E0D8CC',
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1.25rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', flex: 1, minWidth: 200 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#EBF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B6B4A" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#2C2C2C' }}>Transparansi Dana</div>
              <div style={{ fontSize: '0.75rem', color: '#8A8A8A', marginTop: '0.125rem', lineHeight: 1.5 }}>
                Nilai yang masuk ke dompet adalah <strong>bagian bersih Muthawif</strong> — platform fee sudah
                dipotong saat booking dikonfirmasi, sebelum dana masuk ke sini.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Diterima (baseFee)', value: fmtRp(totalGross),      color: '#1B6B4A', bg: '#EBF5EF' },
              { label: 'Sudah Cair',         value: fmtRp(totalNetSettled), color: '#0EA5E9', bg: '#F0F9FF' },
              { label: 'Ditarik',            value: fmtRp(totalOut),        color: '#C0392B', bg: '#FEF2F2' },
            ].map(m => (
              <div key={m.label} style={{ background: m.bg, borderRadius: 10, padding: '0.5rem 0.875rem', textAlign: 'center', minWidth: 106 }}>
                <div style={{ fontSize: '0.5625rem', fontWeight: 800, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>{m.label}</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 900, color: m.color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Withdraw Form ─────────────────────────────────────────────────────── */}
      {showWithdraw && (
        <div style={{
          background: 'white',
          borderRadius: 20,
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          overflow: 'hidden',
          animation: 'slideDown 0.25s ease',
          position: 'relative',
        }}>
          {/* Overlay loading state */}
          {isLoading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(3px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem'
            }}>
              <span className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--emerald-pale)', borderTopColor: 'var(--emerald)', borderWidth: 4 }} />
              <div style={{ fontWeight: 800, color: 'var(--emerald)', fontSize: '0.9375rem' }}>Sedang Memproses...</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mohon jangan tutup jendela ini</div>
            </div>
          )}

          <div style={{ padding: '1.25rem 1.5rem', background: 'var(--ivory)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--emerald-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--charcoal)' }}>Tarik Dana</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo tersedia: {fmtRp(wallet.availableBalance)}</div>
              </div>
            </div>
            <button onClick={() => setShowWithdraw(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <form onSubmit={handleWithdraw} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {msg && (
              <div style={{
                padding: '0.875rem 1rem', borderRadius: 12,
                background: msgType === 'success' ? '#DCFCE7' : '#FEE2E2',
                color: msgType === 'success' ? '#166534' : '#991B1B',
                border: `1px solid ${msgType === 'success' ? '#BBF7D0' : '#FECACA'}`,
                fontSize: '0.875rem', fontWeight: 600,
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              }}>
                <span>{msgType === 'success' ? '✓' : '!'}</span>
                {msg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.375rem' }}>
                Nominal Penarikan (IDR) <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                type="number" required min={10000} max={wallet.availableBalance}
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="Contoh: 1000000"
                style={{ width: '100%', padding: '0.875rem 1rem', border: '1.5px solid var(--border)', borderRadius: 12, fontFamily: 'inherit', fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                onFocus={e => e.target.style.borderColor = 'var(--emerald)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Minimum Rp 10.000 · Maksimum {fmtRp(wallet.availableBalance)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.375rem' }}>
                  Nama Bank <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <select
                  required value={form.bankName}
                  onChange={e => setForm({ ...form, bankName: e.target.value })}
                  style={{ width: '100%', padding: '0.875rem 1rem', border: '1.5px solid var(--border)', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--charcoal)', outline: 'none', background: 'white', appearance: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = 'var(--emerald)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'}
                >
                  <option value="">Pilih bank...</option>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.375rem' }}>
                  Nomor Rekening <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text" required value={form.accountNumber}
                  onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder="Nomor rekening"
                  style={{ width: '100%', padding: '0.875rem 1rem', border: '1.5px solid var(--border)', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--charcoal)', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                  onFocus={e => e.target.style.borderColor = 'var(--emerald)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.375rem' }}>
                Nama Pemilik Rekening <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                type="text" required value={form.accountHolderName}
                onChange={e => setForm({ ...form, accountHolderName: e.target.value })}
                placeholder="Nama sesuai buku tabungan"
                style={{ width: '100%', padding: '0.875rem 1rem', border: '1.5px solid var(--border)', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--charcoal)', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                onFocus={e => e.target.style.borderColor = 'var(--emerald)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.75rem', background: 'rgba(27,107,74,0.05)', borderRadius: 10, border: '1px solid rgba(27,107,74,0.12)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Nomor rekening dienkripsi dan disimpan dengan aman. Pencairan diproses dalam <strong>1–3 hari kerja</strong>.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => setShowWithdraw(false)} style={{
                flex: 1, padding: '0.875rem', borderRadius: 12,
                background: 'var(--ivory-dark)', border: '1.5px solid var(--border)',
                fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer',
              }}>
                Batal
              </button>
              <button type="submit" disabled={isLoading} style={{
                flex: 2, padding: '0.875rem', borderRadius: 12,
                background: isLoading ? 'var(--text-muted)' : 'var(--emerald)', border: 'none',
                color: 'white', fontFamily: 'inherit', fontSize: '0.9375rem', fontWeight: 800,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: isLoading ? 'none' : '0 4px 14px rgba(27,107,74,0.25)',
              }}>
                {isLoading ? (
                  <><span className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', borderWidth: 2.5 }} /> Memproses...</>
                ) : (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg> Ajukan Penarikan</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Transaction Table ─────────────────────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '1.125rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--charcoal)" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--charcoal)' }}>Riwayat Transaksi</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--border)', padding: '0.2rem 0.625rem', borderRadius: 99, fontWeight: 600 }}>
            {wallet.transactions.length} transaksi
          </span>
        </div>

        {wallet.transactions.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ivory-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Belum ada transaksi</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>Transaksi akan muncul setelah jamaah melakukan pembayaran</p>
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.1fr 1fr', padding: '0.625rem 1.5rem', background: '#F9FAFB', borderBottom: '1px solid var(--border)' }} className="tx-table-header">
              {['Transaksi', 'Tanggal', 'Jumlah', 'Status'].map(h => (
                <div key={h} style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
              ))}
            </div>

            {wallet.transactions.map((tx, idx) => {
              const cfg       = TX_ICON_BG[tx.type] ?? { bg: 'var(--ivory)', text: 'var(--charcoal)', icon: '•' };
              const statusCfg = STATUS_PILL[tx.status]  ?? { label: tx.status, bg: '#F3F4F6', text: '#374151' };
              const isLast    = idx === wallet.transactions.length - 1;
              const isInflow  = tx.type !== 'WITHDRAWAL';

              return (
                <div key={tx.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)', transition: 'background 0.15s' }} className="tx-row">
                  {/* Desktop row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.1fr 1fr', padding: '1rem 1.5rem', alignItems: 'center' }} className="tx-desktop-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: cfg.bg, color: cfg.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800 }}>
                        {cfg.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--charcoal)' }}>{TX_LABEL[tx.type] ?? tx.type}</div>
                        {tx.description && (
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{tx.description}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      <div style={{ fontSize: '0.6875rem', marginTop: '0.1rem' }}>
                        {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 900, color: isInflow ? '#166534' : '#991B1B', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                      {isInflow ? '+' : '−'}{fmtRp(tx.amount)}
                    </div>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: 99, background: statusCfg.bg, color: statusCfg.text, fontSize: '0.6875rem', fontWeight: 800 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.text }} />
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Mobile row */}
                  <div style={{ padding: '0.875rem 1.25rem' }} className="tx-mobile-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, color: cfg.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 800 }}>
                          {cfg.icon}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{TX_LABEL[tx.type] ?? tx.type}</div>
                      </div>
                      <div style={{ fontWeight: 900, fontSize: '0.9375rem', color: isInflow ? '#166534' : '#991B1B', fontVariantNumeric: 'tabular-nums' }}>
                        {isInflow ? '+' : '−'}{fmtRp(tx.amount)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <span style={{ background: statusCfg.bg, color: statusCfg.text, padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.625rem', fontWeight: 800 }}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tx-row:hover { background: var(--ivory) !important; }
        .tx-desktop-row { display: grid !important; }
        .tx-mobile-row  { display: none !important; }

        @media (max-width: 960px) {
          .wallet-divider { display: none !important; }
        }

        @media (max-width: 640px) {
          .tx-table-header  { display: none !important; }
          .tx-desktop-row   { display: none !important; }
          .tx-mobile-row    { display: block !important; }
        }
      `}</style>
    </div>
  );
}
