'use client';

import { useState, useId } from 'react';
import { 
  Plus, Trash2, Save, Percent, Banknote, Settings2, 
  Info, CheckCircle, ChevronDown, GripVertical, X
} from 'lucide-react';
import { updateGlobalSettings } from '@/actions/finance';
import { useUI } from '@/components/UIProvider';

type FeeType = 'PERCENT' | 'FLAT';

interface FeeComponent {
  id: string;
  label: string;
  type: FeeType;
  value: number;
  description?: string;
}

interface Settings {
  feeType: FeeType;
  feeValue: number;
  feeComponents: FeeComponent[];
  minimumWithdrawal: number;
}

function calculatePreview(muthawifPrice: number, settings: Settings): {
  muthawifPrice: number;
  baseFee: number;
  componentsFee: number;
  totalPrice: number;
  platformEarning: number;
} {
  const baseFee = settings.feeType === 'PERCENT'
    ? muthawifPrice * (settings.feeValue / 100)
    : settings.feeValue;

  const componentsFee = settings.feeComponents.reduce((sum, c) => {
    return sum + (c.type === 'PERCENT' ? muthawifPrice * (c.value / 100) : c.value);
  }, 0);

  return {
    muthawifPrice,
    baseFee,
    componentsFee,
    totalPrice: muthawifPrice + baseFee + componentsFee,
    platformEarning: baseFee + componentsFee,
  };
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--emerald)' : '#D1D5DB',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18,
        borderRadius: '50%', background: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
      }} />
    </button>
  );
}

function FeeTypeSelector({ value, onChange }: { value: FeeType; onChange: (v: FeeType) => void }) {
  return (
    <div style={{ display: 'inline-flex', background: '#F3F4F6', borderRadius: 12, padding: 4, gap: 4 }}>
      {([
        { v: 'PERCENT' as FeeType, icon: <Percent size={14} />, label: 'Persentase' },
        { v: 'FLAT' as FeeType, icon: <Banknote size={14} />, label: 'Nominal Tetap' },
      ] as const).map(opt => (
        <button
          key={opt.v}
          type="button"
          onClick={() => onChange(opt.v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 1.25rem', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.8125rem', fontFamily: 'inherit',
            background: value === opt.v ? 'white' : 'transparent',
            color: value === opt.v ? 'var(--emerald)' : 'var(--text-muted)',
            boxShadow: value === opt.v ? '0 2px 8px rgba(0,0,0,0.07)' : 'none',
            transition: 'all 0.18s',
          }}
        >
          {opt.icon} {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function FeeSettings({ initialSettings }: { initialSettings: Settings | null }) {
  const defaultSettings: Settings = {
    feeType: 'PERCENT',
    feeValue: 5,
    feeComponents: [],
    minimumWithdrawal: 50000,
  };

  const [settings, setSettings] = useState<Settings>(initialSettings ?? defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [previewPrice, setPreviewPrice] = useState(1000000);
  const { toast, confirm } = useUI();

  const preview = calculatePreview(previewPrice, settings);

  const addComponent = () => {
    setSettings(s => ({
      ...s,
      feeComponents: [...s.feeComponents, {
        id: crypto.randomUUID(),
        label: 'Biaya Baru',
        type: 'FLAT',
        value: 0,
        description: '',
      }]
    }));
  };

  const removeComponent = async (id: string) => {
    const ok = await confirm({
      title: 'Hapus Komponen Biaya',
      message: 'Komponen ini akan dihapus permanen. Lanjutkan?',
      confirmLabel: 'Hapus',
      variant: 'danger',
    });
    if (!ok) return;
    setSettings(s => ({ ...s, feeComponents: s.feeComponents.filter(c => c.id !== id) }));
  };

  const updateComponent = (id: string, patch: Partial<FeeComponent>) => {
    setSettings(s => ({
      ...s,
      feeComponents: s.feeComponents.map(c => c.id === id ? { ...c, ...patch } : c)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.feeValue < 0 || settings.minimumWithdrawal < 0) {
      toast("error", "Input Tidak Valid", "Nilai tidak boleh negatif.");
      return;
    }
    setIsSaving(true);
    try {
      await updateGlobalSettings(settings);
      toast("success", "Konfigurasi Disimpan", "Biaya layanan berhasil diperbarui dan aktif.");
    } catch (err: any) {
      toast("error", "Gagal Menyimpan", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatIDR = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  return (
    <form onSubmit={handleSave} style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr min(420px, 38%)', gap: '2rem', alignItems: 'start' }}>
      
      {/* ─── Left: Config Panel ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Base Fee Card */}
        <section style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--emerald-pale)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings2 size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--charcoal)' }}>Biaya Layanan Utama</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Biaya dasar di setiap transaksi. Pilih satu skema.</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <FeeTypeSelector value={settings.feeType} onChange={v => setSettings(s => ({ ...s, feeType: v }))} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {settings.feeType === 'PERCENT' ? 'Persentase (%)' : 'Nominal (IDR)'}
              </label>
              <div style={{ position: 'relative', maxWidth: 280 }}>
                {settings.feeType === 'FLAT' && (
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Rp</div>
                )}
                <input
                  type="number"
                  min="0"
                  step={settings.feeType === 'PERCENT' ? '0.1' : '1000'}
                  className="form-input"
                  value={settings.feeValue}
                  onChange={e => setSettings(s => ({ ...s, feeValue: parseFloat(e.target.value) || 0 }))}
                  style={{ paddingLeft: settings.feeType === 'FLAT' ? '2.5rem' : '1rem', paddingRight: settings.feeType === 'PERCENT' ? '2.5rem' : '1rem', fontWeight: 700, fontSize: '1.125rem' }}
                />
                {settings.feeType === 'PERCENT' && (
                  <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--emerald)' }}>%</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Additional Fee Components */}
        <section style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF9C3', color: '#A16207', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--charcoal)' }}>Komponen Biaya Tambahan</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tambahkan biaya terpisah selain biaya utama.</div>
              </div>
            </div>
            <button
              type="button"
              onClick={addComponent}
              className="btn btn-secondary"
              style={{ gap: '0.375rem', fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
            >
              <Plus size={16} /> Tambah
            </button>
          </div>

          {settings.feeComponents.length === 0 ? (
            <div style={{ padding: '2.5rem', background: 'var(--ivory)', borderRadius: 14, textAlign: 'center', border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏷️</div>
              <div style={{ fontWeight: 700, color: 'var(--charcoal)', fontSize: '0.875rem' }}>Belum Ada Komponen Tambahan</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Contoh: Biaya admin, biaya asuransi, dll.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {settings.feeComponents.map((comp, i) => (
                <div key={comp.id} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', background: 'var(--ivory)', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>{i + 1}</div>
                    <input
                      type="text"
                      placeholder="Nama komponen biaya..."
                      className="form-input"
                      value={comp.label}
                      onChange={e => updateComponent(comp.id, { label: e.target.value })}
                      style={{ fontWeight: 700, flex: 1 }}
                    />
                    <button type="button" onClick={() => removeComponent(comp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', padding: '0.25rem', display: 'flex', borderRadius: 6, flexShrink: 0 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tipe</label>
                      <FeeTypeSelector value={comp.type} onChange={v => updateComponent(comp.id, { type: v })} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nilai</label>
                      <div style={{ position: 'relative' }}>
                        {comp.type === 'FLAT' && <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Rp</div>}
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          value={comp.value}
                          onChange={e => updateComponent(comp.id, { value: parseFloat(e.target.value) || 0 })}
                          style={{ paddingLeft: comp.type === 'FLAT' ? '2rem' : '0.75rem', paddingRight: comp.type === 'PERCENT' ? '2rem' : '0.75rem', fontSize: '0.875rem' }}
                        />
                        {comp.type === 'PERCENT' && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--emerald)', fontSize: '0.75rem' }}>%</div>}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder="Deskripsi singkat (opsional)..."
                      className="form-input"
                      value={comp.description || ''}
                      onChange={e => updateComponent(comp.id, { description: e.target.value })}
                      style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Minimum Withdrawal */}
        <section style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--charcoal)' }}>Ambang Batas Penarikan</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo minimal sebelum Muthawif bisa mengajukan pencairan.</div>
            </div>
          </div>
          <div style={{ position: 'relative', maxWidth: 280 }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Rp</div>
            <input
              type="number"
              min="0"
              step="10000"
              className="form-input"
              value={settings.minimumWithdrawal}
              onChange={e => setSettings(s => ({ ...s, minimumWithdrawal: parseFloat(e.target.value) || 0 }))}
              style={{ paddingLeft: '2.75rem', fontWeight: 700, fontSize: '1rem' }}
            />
          </div>
        </section>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="btn"
          style={{ padding: '1rem 2rem', background: 'var(--charcoal)', color: 'white', borderRadius: 14, justifyContent: 'center', gap: '0.75rem', fontSize: '0.9375rem' }}
        >
          {isSaving ? <span className="spinner" /> : <Save size={20} />}
          {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi Biaya'}
        </button>
      </div>

      {/* ─── Right: Live Preview Panel ─── */}
      <div style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Preview Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 20, padding: '1.75rem', color: 'white' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Simulasi Kalkulasi</div>
          
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.375rem' }}>Harga Dasar Muthawif</div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Rp</div>
              <input
                type="number"
                className="form-input"
                value={previewPrice}
                onChange={e => setPreviewPrice(parseFloat(e.target.value) || 0)}
                style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontWeight: 800, fontSize: '1.125rem' }}
              />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ opacity: 0.6 }}>Biaya Muthawif</span>
              <span style={{ fontWeight: 600 }}>{formatIDR(preview.muthawifPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ opacity: 0.6 }}>Fee Utama ({settings.feeType === 'PERCENT' ? `${settings.feeValue}%` : 'Flat'})</span>
              <span style={{ fontWeight: 600, color: '#FCD34D' }}>+{formatIDR(preview.baseFee)}</span>
            </div>
            {settings.feeComponents.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ opacity: 0.5 }}>{c.label || 'Komponen'} ({c.type === 'PERCENT' ? `${c.value}%` : 'Flat'})</span>
                <span style={{ fontWeight: 600, color: '#FCD34D' }}>+{formatIDR(c.type === 'PERCENT' ? previewPrice * c.value / 100 : c.value)}</span>
              </div>
            ))}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
              <span>Total Harga User</span>
              <span style={{ fontSize: '1.125rem', color: '#34D399' }}>{formatIDR(preview.totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Platform Earnings */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem' }}>Platform Mendapatkan</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--emerald)' }}>{formatIDR(preview.platformEarning)}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>dari setiap transaksi Rp {previewPrice.toLocaleString('id-ID')}</div>
          {preview.totalPrice > 0 && (
            <div style={{ marginTop: '0.75rem', background: 'var(--emerald-pale)', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald)' }}>
              Margin: {((preview.platformEarning / preview.totalPrice) * 100).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Info Note */}
        <div style={{ background: '#FEF9C3', borderRadius: 14, padding: '1rem 1.25rem', border: '1px solid #FDE68A', display: 'flex', gap: '0.75rem' }}>
          <Info size={16} style={{ color: '#A16207', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.75rem', color: '#A16207', lineHeight: 1.6, margin: 0 }}>
            Harga yang tampil ke <b>Jamaah</b> sudah termasuk seluruh komponen biaya. Muthawif menerima sesuai tarif yang mereka atur di profil.
          </p>
        </div>
      </div>
    </form>
  );
}
