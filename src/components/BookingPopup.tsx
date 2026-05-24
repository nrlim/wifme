"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import BookingWizard from "@/app/book/[muthawifId]/BookingWizard";
import { getBookingWizardData } from "@/actions/booking";
import type { Activity, Prisma } from "@prisma/client";
import type { FeeConfig } from "@/lib/fee";

type BundleType = Prisma.ActivityBundleGetPayload<{
  include: { items: { include: { activity: true } } };
}>;

interface BookingPopupProps {
  muthawifId: string;
  muthawifName: string;
  onClose: () => void;
}

export default function BookingPopup({ muthawifId, muthawifName, onClose }: BookingPopupProps) {
  const [data, setData] = useState<{
    activities: Activity[];
    bundles: BundleType[];
    feeConfig: FeeConfig;
    availabilities: any[];
    bookedItems: any[];
  } | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    getBookingWizardData(muthawifId).then((res) => {
      if (!mounted) return;
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || "Gagal memuat data.");
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="booking-popup-overlay"
        className="booking-popup-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "rgba(17, 24, 39, 0.6)",
          backdropFilter: "blur(8px)",
          padding: "1rem",
        }}
      >
        <motion.div
          className="booking-popup-container"
          initial={{ y: 50, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            background: "var(--ivory)",
            width: "100%",
            maxWidth: "1000px",
            height: "90vh",
            maxHeight: "900px",
            borderRadius: "12px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.25)",
            position: "relative",
          }}
        >
          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", position: "relative", display: "flex", flexDirection: "column" }}>
            {!data && !error && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: "column", gap: "1rem", color: "var(--text-muted)" }}>
                <span className="spinner" style={{ width: 32, height: 32, borderColor: "rgba(27,107,74,0.2)", borderTopColor: "var(--emerald)" }} />
                <p style={{ fontWeight: 600 }}>Memuat data pemesanan...</p>
              </div>
            )}
            {error && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", padding: "2rem", textAlign: "center", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: "#FEF2F2", color: "var(--error)", padding: "1rem 1.5rem", borderRadius: "12px", border: "1px solid #FECACA" }}>
                  {error}
                </div>
                <button 
                  onClick={onClose}
                  style={{ background: "var(--emerald)", color: "white", padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: 600, border: "none", cursor: "pointer" }}
                >
                  Tutup
                </button>
              </div>
            )}
            {data && (
              <BookingWizard
                muthawifId={muthawifId}
                muthawifName={muthawifName}
                activities={data.activities}
                bundles={data.bundles}
                feeConfig={data.feeConfig}
                availabilities={data.availabilities}
                bookedItems={data.bookedItems}
                onClose={onClose}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
      <style>{`
        @media (max-width: 640px) {
          .booking-popup-overlay {
            padding: 0 !important;
          }
          .booking-popup-container {
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}
