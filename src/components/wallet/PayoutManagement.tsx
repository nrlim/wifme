'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Clock, Banknote, User, Mail,
  ArrowUpRight, ShieldCheck, History, Search, ChevronLeft,
  ChevronRight, Eye, Info, CreditCard, Calendar
} from 'lucide-react';
import { approvePayout, rejectPayout } from '@/actions/finance';
import { useUI } from '@/components/UIProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { CopyButton } from '@/app/dashboard/CopyButton';

interface Payout {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  createdAt: Date;
  wallet: {
    user: {
      name: string;
      email: string;
    }
  }
}

interface PayoutData {
  items: Payout[];
  total: number;
  page: number;
  totalPages: number;
}

export default function PayoutManagement({ payouts: initialPayoutData }: { payouts: PayoutData }) {
  const [data, setData] = useState(initialPayoutData);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const { confirm, toast } = useUI();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setData(initialPayoutData);
  }, [initialPayoutData]);

  const updateParams = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === "" || v === "ALL") params.delete(k);
      else params.set(k, String(v));
    });
    router.push(`/dashboard?${params.toString()}`);
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const handleApprove = async (id: string) => {
    const ok = await confirm({
      title: "Setujui Penarikan",
      message: "Konfirmasi transfer dana telah dilakukan ke rekening muthawif.",
      confirmLabel: "Ya, Selesaikan",
      variant: "primary"
    });
    if (!ok) return;
    setLoadingId(id);
    try {
      await approvePayout(id);
      setData(prev => ({ ...prev, items: prev.items.map(p => p.id === id ? { ...p, status: 'SUCCESS' } : p) }));
      toast("success", "Berhasil", "Penarikan telah divalidasi.");
      if (selectedPayout?.id === id) setSelectedPayout(prev => prev ? { ...prev, status: 'SUCCESS' } : null);
    } catch (err: any) {
      toast("error", "Gagal", err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const ok = await confirm({
      title: "Tolak Penarikan",
      message: "Saldo akan dikembalikan ke dompet muthawif. Lanjutkan?",
      confirmLabel: "Ya, Tolak",
      variant: "danger"
    });
    if (!ok) return;
    const reason = prompt('Alasan penolakan:');
    setLoadingId(id);
    try {
      await rejectPayout(id, reason || 'Ditolak oleh Admin');
      setData(prev => ({ ...prev, items: prev.items.map(p => p.id === id ? { ...p, status: 'FAILED' } : p) }));
      toast("warning", "Ditolak", "Dana telah dikembalikan.");
      if (selectedPayout?.id === id) setSelectedPayout(prev => prev ? { ...prev, status: 'FAILED' } : null);
    } catch (err: any) {
      toast("error", "Gagal", err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ─── Toolbar ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '0.375rem', background: 'var(--ivory)', padding: '0.25rem', borderRadius: 10 }}>
          {['ALL', 'PENDING', 'SUCCESS', 'FAILED'].map(t => {
            const active = (searchParams.get('status') || 'ALL') === t;
            return (
              <button key={t} onClick={() => updateParams({ status: t, page: 1 })} style={{ padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer', background: active ? 'white' : 'transparent', color: active ? 'var(--emerald)' : 'var(--text-muted)', boxShadow: active ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                {t === 'ALL' ? 'Semua' : t === 'PENDING' ? 'Menunggu' : t === 'SUCCESS' ? 'Selesai' : 'Gagal'}
              </button>
            );
          })}
        </div>
        <div style={{ position: 'relative', flex: '1', maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Cari nama pemohon..." className="form-input" defaultValue={searchParams.get('q') || ''} onKeyDown={e => e.key === 'Enter' && updateParams({ q: e.currentTarget.value, page: 1 })} style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }} />
        </div>
      </div>

      {/* ─── Main Table Card ─── */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>

        {/* Table header info row */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: data.items.some(p => p.status === 'PENDING') ? 'var(--error)' : 'var(--emerald)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--charcoal)' }}>Daftar Penarikan</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {data.total === 0 ? 'Tidak ada hasil' : `${(data.page - 1) * 10 + 1}–${Math.min(data.page * 10, data.total)} dari ${data.total}`}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 680 }}>
            <thead>
              <tr style={{ background: 'var(--ivory)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Pemohon', w: 'auto' },
                  { label: 'Bank & Rekening', w: 190 },
                  { label: 'Nominal', w: 140 },
                  { label: 'Tanggal', w: 120 },
                  { label: 'Status', w: 110 },
                  { label: 'Aksi', w: 150, right: true },
                ].map(h => (
                  <th key={h.label} style={{ padding: '0.75rem 1.25rem', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', width: h.w, textAlign: (h as any).right ? 'right' : 'left' }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <Banknote size={24} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.375rem' }}>Belum ada data penarikan</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Permintaan penarikan dari Muthawif akan muncul di sini.</div>
                  </td>
                </tr>
              ) : data.items.map((p, idx) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: idx < data.items.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--ivory)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--emerald-pale)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8125rem', flexShrink: 0, border: '1px solid var(--border)' }}>
                        {p.wallet.user.name[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.wallet.user.name}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.wallet.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--charcoal)' }}>{p.bankName}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {p.accountNumber} <CopyButton text={p.accountNumber} />
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: p.status === 'SUCCESS' ? 'var(--emerald)' : 'var(--charcoal)' }}>{formatIDR(p.amount)}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ padding: '0.3rem 0.75rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, background: p.status === 'SUCCESS' ? 'var(--emerald-pale)' : p.status === 'PENDING' ? '#FEF9C3' : '#FEF2F2', color: p.status === 'SUCCESS' ? 'var(--emerald)' : p.status === 'PENDING' ? '#A16207' : '#DC2626' }}>
                      {p.status === 'SUCCESS' ? 'Selesai' : p.status === 'PENDING' ? 'Menunggu' : 'Gagal'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setSelectedPayout(p)}
                        style={{ background: 'white', border: '1px solid var(--border)', padding: '0.4375rem 0.75rem', borderRadius: 8, cursor: 'pointer', color: 'var(--charcoal)', fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--emerald)'; e.currentTarget.style.color = 'var(--emerald)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--charcoal)'; }}
                        title="Lihat Detail"
                      >
                        <Eye size={14} /> Detail
                      </button>
                      {p.status === 'PENDING' && (<>
                        <button onClick={() => handleApprove(p.id)} disabled={!!loadingId} style={{ background: 'var(--emerald-pale)', border: '1px solid rgba(27,107,74,0.25)', padding: '0.4375rem', borderRadius: 8, cursor: 'pointer', color: 'var(--emerald)', display: 'flex', transition: 'all 0.15s' }} title="Setujui">
                          {loadingId === p.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <CheckCircle size={16} />}
                        </button>
                        <button onClick={() => handleReject(p.id)} disabled={!!loadingId} style={{ background: '#FFF1F2', border: '1px solid #FCA5A5', padding: '0.4375rem', borderRadius: 8, cursor: 'pointer', color: '#DC2626', display: 'flex', transition: 'all 0.15s' }} title="Tolak">
                          <XCircle size={16} />
                        </button>
                      </>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Halaman <strong style={{ color: 'var(--charcoal)' }}>{data.page}</strong> dari <strong style={{ color: 'var(--charcoal)' }}>{data.totalPages}</strong>
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button disabled={data.page <= 1} onClick={() => updateParams({ page: data.page - 1 })} style={{ padding: '0.4375rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: data.page <= 1 ? 'var(--ivory)' : 'white', color: data.page <= 1 ? 'var(--text-muted)' : 'var(--charcoal)', cursor: data.page <= 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'inherit' }}>←</button>
              {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(data.totalPages - 4, data.page - 2)) + i;
                return (<button key={pg} onClick={() => updateParams({ page: pg })} style={{ padding: '0.4375rem 0.75rem', minWidth: 36, borderRadius: 8, border: `1px solid ${pg === data.page ? 'var(--emerald)' : 'var(--border)'}`, background: pg === data.page ? 'var(--emerald)' : 'white', color: pg === data.page ? 'white' : 'var(--charcoal)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8125rem', fontFamily: 'inherit' }}>{pg}</button>);
              })}
              <button disabled={data.page >= data.totalPages} onClick={() => updateParams({ page: data.page + 1 })} style={{ padding: '0.4375rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: data.page >= data.totalPages ? 'var(--ivory)' : 'white', color: data.page >= data.totalPages ? 'var(--text-muted)' : 'var(--charcoal)', cursor: data.page >= data.totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'inherit' }}>→</button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Detail Modal ─── */}
      {selectedPayout && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedPayout(null)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 32px 64px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'scaleIn 0.2s ease' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '2rem', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}><Banknote size={32} /></div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Konfirmasi Penarikan</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.25rem' }}>{formatIDR(selectedPayout.amount)}</div>
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--emerald-pale)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User /></div>
                  <div>
                    <div style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pemohon</div>
                    <div style={{ fontWeight: 800, color: 'var(--charcoal)' }}>{selectedPayout.wallet.user.name}</div>
                  </div>
                </div>
                <div style={{ background: 'var(--ivory)', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Detail Rekening</div>
                    <CreditCard size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--charcoal)', fontSize: '1rem' }}>{selectedPayout.bankName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.125rem', letterSpacing: '0.05em' }}>{selectedPayout.accountNumber}</div>
                    <CopyButton text={selectedPayout.accountNumber} />
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>a/n {selectedPayout.accountHolderName}</div>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}><Calendar size={14} /> {new Date(selectedPayout.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: 99, fontSize: '0.625rem', fontWeight: 800, background: selectedPayout.status === 'SUCCESS' ? 'var(--emerald-pale)' : '#FEF9C3', color: selectedPayout.status === 'SUCCESS' ? 'var(--emerald)' : '#A16207' }}>{selectedPayout.status}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button onClick={() => setSelectedPayout(null)} style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'white', fontWeight: 700, cursor: 'pointer' }}>Tutup</button>
                {selectedPayout.status === 'PENDING' && (
                  <button onClick={() => handleApprove(selectedPayout.id)} disabled={!!loadingId} style={{ flex: 2, padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'var(--emerald)', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {loadingId === selectedPayout.id ? <span className="spinner" /> : <><ArrowUpRight size={18} /> Konfirmasi Transfer</>}
                  </button>
                )}
              </div>
              {selectedPayout.status === 'PENDING' && (
                <button onClick={() => handleReject(selectedPayout.id)} disabled={!!loadingId} style={{ width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', color: '#DC2626', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Tolak Permintaan</button>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
