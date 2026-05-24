"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient, bucketName, compressImage } from "@/lib/supabase-client";
import { CopyButton } from "@/app/dashboard/CopyButton";

interface Props {
  bookingId: string;
  amount: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
}

export default function PaymentProofUpload({ bookingId, amount, bankName, bankAccount, bankHolder }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");
    
    try {
      const compressedFile = await compressImage(file, 0.6);
      const fileExt = compressedFile.name.split('.').pop() || "jpg";
      const fileName = `payment_proofs/${bookingId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabaseClient.storage.from(bucketName).upload(fileName, compressedFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseClient.storage.from(bucketName).getPublicUrl(fileName);
      setProofUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error(err);
      setError("Gagal mengunggah bukti. Pastikan ukurannya tidak terlalu besar.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!proofUrl) {
      setError("Silakan unggah bukti transfer terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      setError("");
      try {
        const res = await fetch(`/api/bookings/${bookingId}/upload-proof`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proofUrl }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Gagal menyimpan bukti pembayaran.");
          return;
        }

        setSuccessMsg("Bukti pembayaran berhasil diunggah. Menunggu verifikasi AMIR.");
        // Refresh page to show updated status
        setTimeout(() => router.refresh(), 2000);
      } catch (err) {
        setError("Terjadi kesalahan jaringan.");
      }
    });
  };

  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", padding: "1.25rem", marginTop: "1rem" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "1rem" }}>Instruksi Pembayaran</h3>
      
      {/* Bank Details */}
      <div style={{ background: "var(--ivory)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Transfer ke Bank:</div>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--charcoal)" }}>{bankName || "Bank BSI"}</div>
        
        <div style={{ margin: "0.75rem 0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.125rem" }}>Nomor Rekening</div>
            <div style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--emerald)", fontFamily: "monospace", letterSpacing: "1px" }}>
              {bankAccount || "7123456789"}
            </div>
          </div>
          <CopyButton text={bankAccount || "7123456789"} />
        </div>
        
        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Atas Nama: <strong style={{ color: "var(--charcoal)" }}>{bankHolder || "PT Wifme Indonesia"}</strong>
        </div>
      </div>

      <div style={{ background: "rgba(196,151,59,0.08)", padding: "0.75rem", borderRadius: 8, marginBottom: "1.5rem", fontSize: "0.875rem", color: "var(--gold)" }}>
        Pastikan Anda mentransfer tepat <strong>Rp {amount.toLocaleString("id-ID")}</strong>
      </div>

      {/* Upload Area */}
      <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.75rem" }}>Upload Bukti Transfer</h3>
      
      {proofUrl ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ width: "100%", height: 200, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "var(--ivory)", position: "relative" }}>
            <img src={proofUrl} alt="Bukti Transfer" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            <button 
              onClick={() => setProofUrl(null)}
              style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <label style={{ 
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
          border: "2px dashed var(--border)", borderRadius: 12, padding: "2rem 1rem", 
          background: "var(--ivory)", cursor: isUploading ? "not-allowed" : "pointer", transition: "background 0.2s" 
        }}>
          {isUploading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3, borderColor: "var(--emerald-pale)", borderTopColor: "var(--emerald)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "0.8125rem", color: "var(--emerald)", fontWeight: 700 }}>Mengunggah...</span>
            </div>
          ) : (
            <>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--charcoal)" }}>Pilih Foto/Screenshot</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Format JPG atau PNG (Maks. 2MB)</div>
            </>
          )}
          <input type="file" accept="image/jpeg,image/png" style={{ display: "none" }} onChange={handleUpload} disabled={isUploading} />
        </label>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
        <button
          onClick={() => router.push("/dashboard")}
          disabled={isPending}
          style={{
            flex: 1,
            background: "white",
            color: "var(--charcoal)",
            border: "1.5px solid var(--border)",
            padding: "0.875rem",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: "0.9375rem",
            cursor: isPending ? "not-allowed" : "pointer",
            transition: "opacity 0.15s"
          }}
        >
          Kembali
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending || !proofUrl}
          style={{
            flex: 1,
            background: "linear-gradient(135deg, var(--emerald), var(--emerald-light))",
            color: "white",
            border: "none",
            padding: "0.875rem",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: "0.9375rem",
            cursor: (isPending || !proofUrl) ? "not-allowed" : "pointer",
            opacity: (isPending || !proofUrl) ? 0.5 : 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            transition: "opacity 0.15s"
          }}
        >
          {isPending ? "Memproses..." : "Sudah Bayar"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", color: "var(--error)", padding: "0.75rem", borderRadius: 8, fontSize: "0.8125rem", marginTop: "1rem", border: "1px solid #FCA5A5" }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ background: "var(--emerald-pale)", color: "var(--emerald)", padding: "0.75rem", borderRadius: 8, fontSize: "0.8125rem", marginTop: "1rem", border: "1px solid rgba(27,107,74,0.3)" }}>
          {successMsg}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
