"use client";

import { useMemo } from "react";

interface WhatsAppButtonProps {
  phoneNumber: string | null | undefined;
  recipientName: string;
  bookingId: string;
  variant?: "primary" | "compact";
  className?: string;
  isMuthawifView?: boolean;
}

export default function WhatsAppButton({
  phoneNumber,
  recipientName,
  bookingId,
  variant = "primary",
  className = "",
  isMuthawifView = false,
}: WhatsAppButtonProps) {
  // If no phone number is provided, we still render a button but disable it (or for Muthawif view, we show an info badge)
  
  const formattedPhone = useMemo(() => {
    if (!phoneNumber) return "";
    // Hapus karakter non-digit
    let num = phoneNumber.replace(/\D/g, "");
    // Jika diawali 0, ganti dengan 62
    if (num.startsWith("0")) {
      num = "62" + num.slice(1);
    }
    return num;
  }, [phoneNumber]);

  const defaultMessage = `Halo ${recipientName}, saya menghubungi terkait pesanan Wifme dengan Booking ID #${bookingId.slice(0, 8).toUpperCase()}.`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(defaultMessage)}`;

  // Styling based on variant
  const buttonStyle: React.CSSProperties =
    variant === "compact"
      ? {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.3rem",
          padding: "0.375rem 0.875rem",
          background: "linear-gradient(135deg, #25D366, #128C7E)",
          color: "#fff",
          borderRadius: 8,
          fontSize: "0.75rem",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "opacity 0.15s, transform 0.15s",
          textDecoration: "none",
          fontFamily: "inherit",
        }
      : {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.875rem",
          borderRadius: 14,
          background: "linear-gradient(135deg, #25D366, #128C7E)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.9375rem",
          border: "none",
          cursor: "pointer",
          width: "100%",
          marginTop: "1rem",
          fontFamily: "inherit",
          transition: "opacity 0.15s, transform 0.15s",
          textDecoration: "none",
        };

  if (isMuthawifView) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: variant === "compact" ? "0.375rem 0.75rem" : "0.75rem",
          background: "rgba(37, 211, 102, 0.1)",
          color: "#128C7E",
          borderRadius: variant === "compact" ? 8 : 12,
          fontSize: variant === "compact" ? "0.6875rem" : "0.8125rem",
          fontWeight: 700,
          border: "1px dashed rgba(37, 211, 102, 0.3)",
          marginTop: variant === "compact" ? 0 : "1rem",
          width: variant === "compact" ? "auto" : "100%",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        Jamaah akan menghubungi via WA
      </div>
    );
  }

  if (!phoneNumber) {
    return (
      <button
        className={className}
        style={{
          ...buttonStyle,
          background: "var(--ivory-dark)",
          color: "var(--text-muted)",
          cursor: "not-allowed",
          border: "1px solid var(--border)",
        }}
        disabled
        title="Nomor WhatsApp belum diatur oleh Muthawif"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        WA Belum Tersedia
      </button>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={buttonStyle}
      title={`Hubungi ${recipientName} via WhatsApp`}
    >
      <svg width={variant === "compact" ? 14 : 18} height={variant === "compact" ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
      </svg>
      {variant === "compact" ? "Chat WA" : `Chat ${recipientName} via WA`}
    </a>
  );
}
