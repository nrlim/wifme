'use client';

import { useState } from 'react';
import { CreditCard, CheckCircle, XCircle, ArrowRight, UploadCloud } from 'lucide-react';
import { settleEscrow } from '@/actions/finance';

export default function MidtransSimulator() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const simulatePayment = async (status: 'settlement' | 'cancel') => {
    if (!orderId) {
      setResult({ type: 'error', message: 'Order ID wajib diisi' });
      return;
    }
    setLoading('payment');
    setResult(null);

    try {
      const res = await fetch('/api/webhook/midtrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          transaction_status: status,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Terjadi kesalahan sistem');
      setResult({ type: status, message: status === 'settlement' ? 'Pembayaran Berhasil! Otomatis dipindah ke Escrow.' : 'Pembayaran Gagal/Cancel.' });
    } catch (err: any) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setLoading(null);
    }
  };

  const completeTrip = async () => {
    if (!orderId) {
      setResult({ type: 'error', message: 'Order ID wajib diisi' });
      return;
    }
    setLoading('completion');
    setResult(null);
    try {
      // Ambil id asli jika diawali dengan BOOKING-
      let bookingId = orderId.replace('BOOKING-', '');
      await settleEscrow(bookingId);
      setResult({ type: 'settlement', message: 'Ibadah dikonfirmasi selesai. Dana settlement escrow cair ke Saldo Muthawif!' });
    } catch (err: any) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="card" style={{ width: '100%', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          padding: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          position: "relative",
          color: "white"
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.03)", filter: "blur(20px)" }} />
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(59,130,246,0.1)", color: "#60A5FA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CreditCard style={{ width: 32, height: 32 }} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "white" }}>Simulator Webhook Midtrans</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", marginTop: "0.25rem" }}>Alat testing internal AMIR untuk skenario pembayaran manual</p>
          </div>
        </div>

        {/* Content Desktop Grid */}
        <div style={{ padding: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", alignItems: "start" }}>
          
          {/* Kolom Kiri: Detil Pesanan */}
          <div>
            <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, marginBottom: "1rem", color: "var(--charcoal)" }}>Input Referensi Transaksi</h3>
            
            <div style={{ background: "var(--ivory)", borderRadius: "var(--radius-md)", padding: "1.5rem", border: "1px solid var(--border)" }}>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: "0.25rem" }}>Nomor Order ID</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: BOOKING-XXXXXXXX atau cg11..."
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  style={{ fontFamily: "monospace", fontSize: "1.0625rem", padding: "0.875rem 1rem" }}
                />
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  Masukkan Order ID pesanan yang ada di database dengan akurat.
                </p>
              </div>
            </div>

            {/* Result Alert Inline */}
            {result && (
              <div className={`alert mt-6 flex items-start gap-3 ${result.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginTop: "1.5rem" }}>
                {result.type === 'error' ? <XCircle style={{ width: 22, height: 22, flexShrink: 0 }} /> : <CheckCircle style={{ width: 22, height: 22, flexShrink: 0 }} />}
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9375rem" }}>{result.message}</p>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Aksi Simulasi */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            <div>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--charcoal)" }}>Fase 1: Tembak Webhook Pembayaran</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Mensimulasikan bahwa tagihan jamaah telah lunas. Status akan otomatis berubah menjadi PAID dan dana masuk Escrow Wallet Muthawif.</p>
              
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  disabled={loading !== null || !orderId.trim()}
                  onClick={() => simulatePayment('settlement')}
                  className="btn"
                  style={{ background: "#2563EB", color: "white", flex: 1, justifyContent: "center" }}
                >
                  {loading === 'payment' ? <span className="spinner" /> : <UploadCloud style={{ width: 18, height: 18 }} />}
                  Tembak Settle
                </button>
                <button
                  disabled={loading !== null || !orderId.trim()}
                  onClick={() => simulatePayment('cancel')}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: "center", color: "var(--charcoal)", borderColor: "var(--border)" }}
                >
                  {loading === 'cancel' ? <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--charcoal)' }} /> : <XCircle style={{ width: 18, height: 18 }} />}
                  Simulasi Gagal
                </button>
              </div>
            </div>

            <div className="divider">
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fase 2: Ibadah Selesai</span>
            </div>
            
            <div>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--charcoal)" }}>Pencairan Escrow (Otomatisasi Status)</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Mem-bypass waktu penahanan ibadah. Escrow saldo akan direalisasikan menjadi Saldo Tersedia yang dapat ditarik oleh Muthawif.</p>
              
              <button
                disabled={loading !== null || !orderId.trim()}
                onClick={completeTrip}
                className="btn"
                style={{ 
                  background: "var(--emerald-pale)", color: "var(--emerald)", border: "1px solid rgba(27,107,74,0.2)",
                  width: "100%", justifyContent: "center"
                }}
              >
                {loading === 'completion' ? <span className="spinner" style={{ borderColor: 'rgba(27,107,74,0.2)', borderTopColor: 'var(--emerald)' }} /> : <ArrowRight style={{ width: 18, height: 18 }} />}
                Selesaikan Pesanan & Cairkan Escrow
              </button>
            </div>

          </div>
          
        </div>
      </div>
    </div>
  );
}
