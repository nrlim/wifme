'use client';

import { useState } from 'react';
import { Briefcase, Trash2, Plus, X, Layers } from 'lucide-react';
import { updateGlobalSettings } from '@/actions/finance';
import { useUI } from '@/components/UIProvider';
import Link from 'next/link';

interface Settings {
  supportedServices: string[];
}

const SERVICE_COLORS = [
  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  { bg: '#FDF2F8', text: '#9333EA', border: '#E9D5FF' },
  { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3' },
  { bg: '#F0F9FF', text: '#0284C7', border: '#BAE6FD' },
];

function getServiceColor(idx: number) {
  return SERVICE_COLORS[idx % SERVICE_COLORS.length];
}

export default function ServiceSettings({
  initialSettings,
  currentPage,
}: {
  initialSettings: Settings | null;
  currentPage: number;
}) {
  const defaultServices = ['Umrah Reguler', 'Badal Umrah', 'City Tour'];
  const services: string[] = initialSettings?.supportedServices?.length
    ? initialSettings.supportedServices
    : defaultServices;

  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSvc, setNewSvc] = useState('');
  const { toast, confirm } = useUI();

  const PAGE_SIZE = 10;
  const totalItems = services.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedServices = services.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleDelete = async (svc: string) => {
    const ok = await confirm({
      title: 'Hapus Layanan',
      message: `Yakin menghapus "${svc}"? Muthawif yang memilih layanan ini mungkin terpengaruh.`,
      confirmLabel: 'Ya, Hapus',
      variant: 'danger',
    });
    if (!ok) return;
    setIsSaving(true);
    try {
      await updateGlobalSettings({ supportedServices: services.filter(s => s !== svc) });
      toast('success', 'Dihapus', `Layanan ${svc} telah dihapus dari sistem.`);
    } catch (e: any) {
      toast('error', 'Gagal', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = newSvc.trim();
    if (!val) return;
    if (services.some(s => s.toLowerCase() === val.toLowerCase())) {
      toast('error', 'Duplikasi', 'Layanan tersebut sudah terdaftar.');
      return;
    }
    setIsSaving(true);
    try {
      await updateGlobalSettings({ supportedServices: [val, ...services] });
      toast('success', 'Ditambahkan', `Layanan ${val} berhasil didaftarkan.`);
      setNewSvc('');
      setShowAddModal(false);
    } catch (e: any) {
      toast('error', 'Gagal', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>

        {/* ─── Stats Banner ─── */}
        <div style={{
          background: 'linear-gradient(135deg, #0d2818 0%, #1B6B4A 60%, #27956A 100%)',
          borderRadius: 20,
          padding: '1.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 32px rgba(27,107,74,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <Layers size={26} color="white" />
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Total Layanan Aktif
              </div>
              <div style={{ color: 'white', fontSize: '2.25rem', fontWeight: 900, lineHeight: 1.1 }}>
                {totalItems}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Main Card ─── */}
        <div style={{
          background: 'white', borderRadius: 20,
          border: '1px solid var(--border)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          {/* Card header */}
          <div style={{
            padding: '1.375rem 1.75rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: 'linear-gradient(135deg, var(--emerald-pale), rgba(27,107,74,0.15))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--emerald)',
              }}>
                <Briefcase size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--charcoal)' }}>
                  Daftar Jenis Layanan
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Tersedia sebagai pilihan spesialisasi Muthawif
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                background: 'linear-gradient(135deg, #1B6B4A, #27956A)',
                color: 'white', border: 'none', borderRadius: 12,
                fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(27,107,74,0.3)',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              className="ls-add-btn"
            >
              <Plus size={16} />
              Tambah Layanan
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', width: 56, textAlign: 'center' }}>
                    #
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Nama Layanan
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right', width: 90 }}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedServices.map((svc, idx) => {
                  const globalIdx = (safePage - 1) * PAGE_SIZE + idx + 1;
                  const color = getServiceColor(globalIdx - 1);
                  return (
                    <tr key={svc} className="ls-row" style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: 'var(--ivory)', border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)',
                          margin: '0 auto',
                        }}>
                          {globalIdx}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: color.bg,
                            border: `1px solid ${color.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: color.text, flexShrink: 0,
                          }}>
                            <Briefcase size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--charcoal)' }}>
                              {svc}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>
                              ID: {svc.toLowerCase().replace(/\s+/g, '-')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.3rem 0.75rem', borderRadius: 99,
                          background: '#ECFDF5', color: '#059669',
                          border: '1px solid #A7F3D0',
                          fontSize: '0.75rem', fontWeight: 700,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                          Aktif
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="ls-delete-btn"
                          onClick={() => handleDelete(svc)}
                          disabled={isSaving}
                          aria-label={`Hapus ${svc}`}
                          style={{
                            background: 'transparent', color: 'var(--text-muted)',
                            border: '1px solid var(--border)', borderRadius: 9,
                            padding: '0.4rem 0.6rem', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                            fontSize: '0.75rem', fontWeight: 600,
                            transition: 'all 0.18s', fontFamily: 'inherit',
                          }}
                        >
                          <Trash2 size={14} />
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {paginatedServices.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                      <div style={{ color: '#CBD5E1', marginBottom: '0.75rem' }}>
                        <Layers size={40} />
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--charcoal)', fontSize: '0.9375rem' }}>
                        Belum Ada Layanan
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Klik "Tambah Layanan" untuk mendaftarkan layanan operasi pertama.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {totalItems === 0
                ? 'Tidak ada data'
                : <>Halaman <strong style={{ color: 'var(--charcoal)' }}>{safePage}</strong> dari <strong style={{ color: 'var(--charcoal)' }}>{totalPages}</strong></>}
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <Link href={`/dashboard?tab=master_layanan&page=${safePage - 1}`} style={{ display: 'inline-flex', padding: '0.4375rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: safePage === 1 ? 'var(--ivory)' : 'white', color: safePage === 1 ? 'var(--text-muted)' : 'var(--charcoal)', textDecoration: 'none', fontWeight: 600, fontSize: '0.8125rem', pointerEvents: safePage === 1 ? 'none' : 'auto' }}>←</Link>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, safePage - 2)) + i;
                return (
                  <Link key={p} href={`/dashboard?tab=master_layanan&page=${p}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.4375rem 0.75rem', minWidth: 36, borderRadius: 8, border: `1px solid ${p === safePage ? 'var(--emerald)' : 'var(--border)'}`, background: p === safePage ? 'var(--emerald)' : 'white', color: p === safePage ? 'white' : 'var(--charcoal)', textDecoration: 'none', fontWeight: 700, fontSize: '0.8125rem' }}>
                    {p}
                  </Link>
                );
              })}
              <Link href={`/dashboard?tab=master_layanan&page=${safePage + 1}`} style={{ display: 'inline-flex', padding: '0.4375rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: safePage === totalPages ? 'var(--ivory)' : 'white', color: safePage === totalPages ? 'var(--text-muted)' : 'var(--charcoal)', textDecoration: 'none', fontWeight: 600, fontSize: '0.8125rem', pointerEvents: safePage === totalPages ? 'none' : 'auto' }}>→</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Add Modal ─── */}
      {showAddModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 480,
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '1.5rem', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'rgba(27,107,74,0.1)', border: '1px solid rgba(27,107,74,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--emerald)',
                }}>
                  <Plus size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--charcoal)' }}>
                    Tambah Layanan Baru
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Layanan akan langsung aktif setelah disimpan
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setNewSvc(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0.375rem', borderRadius: 8, color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleAdd} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '0.75rem', fontWeight: 700,
                  color: 'var(--text-muted)', marginBottom: '0.5rem',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Nama Layanan
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Contoh: Badal Haji, Tour Thaif..."
                  className="form-input"
                  value={newSvc}
                  onChange={e => setNewSvc(e.target.value)}
                  disabled={isSaving}
                  style={{ width: '100%', fontSize: '1rem', padding: '0.875rem 1rem' }}
                />
              </div>

              {/* Preview badge */}
              {newSvc.trim() && (
                <div style={{
                  padding: '0.875rem 1rem', borderRadius: 12,
                  background: 'var(--ivory)', border: '1px dashed var(--border)',
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  fontSize: '0.875rem',
                }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Preview:</span>
                  <span style={{
                    padding: '0.25rem 0.875rem', borderRadius: 99,
                    background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                    fontWeight: 700, fontSize: '0.875rem',
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  }}>
                    <Briefcase size={12} /> {newSvc.trim()}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setNewSvc(''); }}
                  disabled={isSaving}
                  className="btn btn-secondary"
                  style={{ padding: '0.75rem 1.25rem', borderRadius: 12 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newSvc.trim()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.75rem 1.5rem', borderRadius: 12,
                    background: newSvc.trim() ? 'linear-gradient(135deg, #1B6B4A, #27956A)' : '#E5E7EB',
                    color: newSvc.trim() ? 'white' : '#9CA3AF',
                    border: 'none', fontWeight: 700, fontSize: '0.9375rem',
                    cursor: newSvc.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                    boxShadow: newSvc.trim() ? '0 4px 14px rgba(27,107,74,0.3)' : 'none',
                  }}
                >
                  {isSaving ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <Plus size={18} />}
                  {isSaving ? 'Menyimpan...' : 'Simpan Layanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .ls-row { transition: background 0.15s; }
        .ls-row:hover { background: #FAFAFA; }
        .ls-delete-btn:hover { background: #FEF2F2 !important; color: #EF4444 !important; border-color: #FECACA !important; }
        .ls-add-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(27,107,74,0.35) !important; }
        .ls-page-btn:hover { background: #F1F5F9 !important; }
      `}</style>
    </>
  );
}
