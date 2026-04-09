"use client";

import { useState, useCallback, useEffect } from "react";

interface PromoResult {
  valid: boolean;
  promotionId?: string;
  code?: string;
  discountAmount?: number;
  finalAmount?: number;
  message: string;
  type?: "FIXED_AMOUNT" | "PERCENTAGE";
  value?: number;
}

interface PromoInputProps {
  bookingAmount: number;
  jamaahId: string;
  onPromoApplied: (result: PromoResult | null) => void;
  applied?: PromoResult | null;
  initialCode?: string;  // pre-filled from VoucherPicker flow
}

export default function PromoInput({
  bookingAmount,
  jamaahId,
  onPromoApplied,
  applied,
  initialCode,
}: PromoInputProps) {
  const [code, setCode] = useState(applied?.code ?? initialCode ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PromoResult | null>(applied ?? null);

  const handleValidate = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), bookingAmount, jamaahId }),
      });
      const data: PromoResult = await res.json();
      setResult(data);
      if (data.valid) {
        onPromoApplied(data);
      } else {
        onPromoApplied(null);
      }
    } catch {
      const err: PromoResult = { valid: false, message: "Gagal menghubungi server. Coba lagi." };
      setResult(err);
      onPromoApplied(null);
    } finally {
      setLoading(false);
    }
  }, [code, bookingAmount, jamaahId, onPromoApplied]);

  const handleRemove = useCallback(() => {
    setCode("");
    setResult(null);
    onPromoApplied(null);
  }, [onPromoApplied]);

  // Auto-validate if initialCode provided (from VoucherPicker) on first render
  useEffect(() => {
    if (initialCode && !applied && !result) {
      handleValidate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

  const isApplied = result?.valid === true;

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1.5px solid ${isApplied ? "#1B6B4A" : result && !result.valid ? "#EF444440" : "#E0D8CC"}`,
        background: isApplied ? "#EBF5EF" : "#FAFAF8",
        padding: "1rem 1.125rem",
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: "0.6875rem",
          fontWeight: 800,
          color: "#8A8A8A",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "0.625rem",
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
        }}
      >
        🏷️ Kode Promo
        {isApplied && (
          <span
            style={{
              background: "#1B6B4A",
              color: "white",
              padding: "0.1rem 0.5rem",
              borderRadius: 99,
              fontSize: "0.5625rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
            }}
          >
            AKTIF
          </span>
        )}
      </div>

      {/* Input row */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          id="promo-code-input"
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (result) {
              setResult(null);
              onPromoApplied(null);
            }
          }}
          onKeyDown={(e) => { if (e.key === "Enter") handleValidate(); }}
          placeholder="Contoh: UMRAH10"
          disabled={isApplied || loading}
          maxLength={30}
          style={{
            flex: 1,
            padding: "0.625rem 0.875rem",
            borderRadius: 10,
            border: `1.5px solid ${isApplied ? "#1B6B4A55" : result && !result.valid ? "#EF444460" : "#DCE0E4"}`,
            fontSize: "0.9rem",
            fontWeight: 700,
            fontFamily: "monospace",
            letterSpacing: "0.08em",
            color: "#2C2C2C",
            background: isApplied ? "#F0FAF4" : "white",
            outline: "none",
            transition: "border-color 0.15s",
          }}
        />
        {isApplied ? (
          <button
            onClick={handleRemove}
            style={{
              padding: "0.625rem 1rem",
              borderRadius: 10,
              border: "1.5px solid #C0392B33",
              background: "#FEF2F2",
              color: "#C0392B",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            ✕ Hapus
          </button>
        ) : (
          <button
            id="promo-validate-btn"
            onClick={handleValidate}
            disabled={!code.trim() || loading}
            style={{
              padding: "0.625rem 1.125rem",
              borderRadius: 10,
              border: "none",
              background:
                !code.trim() || loading
                  ? "#E5E7EB"
                  : "linear-gradient(135deg, #1B6B4A, #27956A)",
              color: !code.trim() || loading ? "#9CA3AF" : "white",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: !code.trim() || loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "background 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid #9CA3AF",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Cek...
              </>
            ) : (
              "Gunakan"
            )}
          </button>
        )}
      </div>

      {/* Feedback message */}
      {result && (
        <div
          style={{
            marginTop: "0.625rem",
            padding: "0.625rem 0.875rem",
            borderRadius: 10,
            background: result.valid ? "#EBF5EF" : "#FEF2F2",
            border: `1px solid ${result.valid ? "#1B6B4A33" : "#EF444433"}`,
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>
            {result.valid ? "✅" : "❌"}
          </span>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.8125rem",
                color: result.valid ? "#1B6B4A" : "#C0392B",
                lineHeight: 1.4,
              }}
            >
              {result.message}
            </div>
            {result.valid && result.discountAmount !== undefined && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#6B7280",
                  marginTop: "0.2rem",
                }}
              >
                Total setelah diskon:{" "}
                <strong style={{ color: "#1B6B4A" }}>
                  Rp {result.finalAmount?.toLocaleString("id-ID")}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        #promo-code-input:focus {
          border-color: #1B6B4A;
          box-shadow: 0 0 0 3px rgba(27,107,74,0.1);
        }
      `}</style>
    </div>
  );
}
