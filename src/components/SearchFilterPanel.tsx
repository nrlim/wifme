"use client";

import { useState } from "react";
import SearchForm from "./SearchForm";

interface SearchFilterPanelProps {
  startDate?: string;
  duration?: string;
  location?: string;
  forceOpen?: boolean;
}

export default function SearchFilterPanel({ startDate, duration, location, forceOpen = false }: SearchFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(forceOpen);

  return (
    <div style={{ marginTop: "1rem" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.5625rem 0.875rem",
          borderRadius: 12,
          border: "1.5px solid var(--border)",
          background: "white",
          fontSize: "0.8125rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          whiteSpace: "nowrap",
          transition: "all 0.2s",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        {isOpen ? "Tutup Edit" : "Ubah Pencarian"}
      </button>

      {isOpen && (
        <div style={{ 
          marginTop: "1.5rem", 
          animation: "fadeInDown 0.3s ease-out",
          width: "100%",
          display: "flex",
          justifyContent: "center"
        }}>
          <SearchForm initialValues={{ startDate, duration, location }} />
          <style>{`
            @keyframes fadeInDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
