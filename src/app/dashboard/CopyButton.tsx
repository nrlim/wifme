'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Salin ID Pesanan"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.25rem",
        borderRadius: "6px",
        border: "1px solid var(--border)",
        background: "white",
        cursor: "pointer",
        color: copied ? "var(--emerald)" : "var(--text-muted)",
        transition: "all 0.2s",
        marginLeft: "0.25rem"
      }}
      onMouseEnter={e => {
        if (!copied) {
          e.currentTarget.style.borderColor = "var(--emerald)";
          e.currentTarget.style.color = "var(--emerald)";
          e.currentTarget.style.background = "var(--emerald-pale)";
        }
      }}
      onMouseLeave={e => {
        if (!copied) {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.background = "white";
        }
      }}
    >
      {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} strokeWidth={2.5} />}
    </button>
  );
}
