"use client";

import { useState, useTransition } from "react";
import { addDocumentUrl, removeDocumentUrl, submitForReview } from "./actions";
import { useUI } from "@/components/UIProvider";

import { supabaseClient, bucketName, compressImage } from "@/lib/supabase-client";

export function DocumentUpload({ documents }: { documents: string[] }) {
  const [isPending, startTransition] = useTransition();
  const [uploadingObj, setUploadingObj] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const { toast, confirm } = useUI();

  const getDoc = (type: string) => documents.find((d) => d.startsWith(`${type}::`));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingObj(type);
    setFeedback(null);
    
    try {
      const compressedFile = await compressImage(file, 0.5);
      const fileExt = compressedFile.name.split('.').pop() || "jpg";
      const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `muthawif/${fileName}`;

      const { error } = await supabaseClient.storage.from(bucketName).upload(filePath, compressedFile);
      if (error) throw error;

      const { data: urlData } = supabaseClient.storage.from(bucketName).getPublicUrl(filePath);
      const finalString = `${type}::${urlData.publicUrl}`;

      const existingDoc = getDoc(type);

      startTransition(async () => {
        if (existingDoc) {
          await removeDocumentUrl(existingDoc);
        }
        const formData = new FormData();
        formData.append("documentUrl", finalString);
        const result = await addDocumentUrl({ success: false, message: "" }, formData);
        
        if (result.success) {
          toast("success", "Berhasil", "Dokumen telah diunggah.");
        } else {
          toast("error", "Gagal", result.message);
        }
        setUploadingObj(null);
      });
    } catch (err: any) {
      toast("error", "Kesalahan", "Gagal mengunggah file. Pastikan ukuran file sesuai dan koneksi stabil.");
      setUploadingObj(null);
    }
  };

  const handleRemove = async (docString: string) => {
    const ok = await confirm({
      title: "Hapus Dokumen",
      message: "Konfirmasi penghapusan dokumen ini?",
      confirmLabel: "Ya, Hapus",
      cancelLabel: "Batal",
      variant: "danger",
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await removeDocumentUrl(docString);
      if (result.success) {
        toast("success", "Dihapus", "Dokumen berhasil dihapus.");
      } else {
        toast("error", "Gagal", result.message);
      }
    });
  };

  const ktp = getDoc("ktp");
  const selfie = getDoc("selfie");
  const sertif = getDoc("sertifikasi");
  
  const isComplete = ktp && selfie && sertif;

  const renderSlot = (type: string, title: string, desc: string, iconUrl?: string) => {
    const doc = getDoc(type);
    const isUploading = uploadingObj === type;
    
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "16px", background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--charcoal)", marginBottom: "0.25rem" }}>{title}</h4>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", maxWidth: "340px", lineHeight: 1.5 }}>{desc}</p>
          </div>
          
          {doc ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <a href={doc.split("::")[1]} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", background: "var(--emerald-pale)", color: "var(--emerald)", borderColor: "transparent" }}>
                Lihat File
              </a>
              <button disabled={isPending || isUploading} onClick={() => handleRemove(doc)} className="btn btn-secondary btn-sm" style={{ padding: "0.5rem", color: "var(--error)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ) : (
            <label className="btn btn-primary btn-sm" style={{ cursor: isUploading || isPending ? "not-allowed" : "pointer", padding: "0.5rem 1.25rem", fontSize: "0.8125rem" }}>
              {isUploading ? "Mengunggah..." : "Pilih File"}
              <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => handleUpload(e, type)} disabled={isUploading || isPending} />
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", padding: "1rem 1.25rem", borderRadius: "12px", fontSize: "0.875rem", color: "var(--error)", lineHeight: 1.6 }}>
        <strong>Tahap 2 Verifikasi:</strong> Wajib mengunggah setiap dokumen pada slot yang telah disediakan. Dokumen ini digunakan sebagai validasi keamanan oleh tim AMIR Wif-Me.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {renderSlot("ktp", "Kartu Tanda Penduduk (KTP)", "Foto KTP asli. Pastikan tulisan dan foto wajah terlihat jelas dan tidak buram.")}
        {renderSlot("selfie", "Foto Selfie Wajah", "Foto wajah (Selfie) Anda secara jelas. Tidak perlu memegang KTP, cukup wajah yang terang.")}
        {renderSlot("sertifikasi", "Sertifikasi / Tasreh", "Dokumen bukti lisensi, Tasreh, atau sertifikat Muthawif yang sah.")}
      </div>

      <div style={{ padding: "1.5rem", marginTop: "1rem", background: "white", borderRadius: "16px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h4 style={{ fontWeight: 700, color: "var(--charcoal)", fontSize: "1rem" }}>Status Dokumen</h4>
          <p style={{ fontSize: "0.8125rem", color: isComplete ? "var(--emerald)" : "var(--text-muted)" }}>
            {isComplete ? "Semua dokumen lengkap. Siap dikirim." : "Mohon lengkapi ketiga dokumen di atas untuk melanjutkan."}
          </p>
        </div>
        <button
          onClick={() => {
            startTransition(async () => {
              const result = await submitForReview();
              if (result.success) {
                toast("success", "Berhasil", "Dokumen telah dikirim ke tim AMIR.");
                setTimeout(() => window.location.reload(), 1500); 
              } else {
                toast("error", "Gagal", result.message);
              }
            });
          }}
          disabled={isPending || !isComplete}
          className="btn btn-primary"
          style={{ padding: "0.875rem 2rem", fontSize: "0.9375rem" }}
        >
          {isPending ? "Memproses..." : "Kirim ke Verifikasi AMIR"}
        </button>
      </div>

    </div>
  );
}
