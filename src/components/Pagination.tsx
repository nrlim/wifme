"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export default function Pagination({ page, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const qs = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  const navigate = (newPage: number) => {
    const next = new URLSearchParams(qs.toString());
    next.set("page", String(newPage));
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  return (
    <div style={{ padding: "0.875rem 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
      <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
        Halaman <strong style={{ color: "var(--charcoal)" }}>{page}</strong> dari <strong style={{ color: "var(--charcoal)" }}>{totalPages}</strong>
      </span>
      <div style={{ display: "flex", gap: "0.25rem", opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}>
        <button
          disabled={page <= 1 || isPending}
          onClick={() => navigate(page - 1)}
          style={{ padding: "0.4375rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: page <= 1 ? "var(--ivory)" : "white", color: page <= 1 ? "var(--text-muted)" : "var(--charcoal)", cursor: page <= 1 ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.8125rem", fontFamily: "inherit" }}
        >
          ←
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
          return (
            <button key={p} onClick={() => navigate(p)}
              style={{ padding: "0.4375rem 0.75rem", minWidth: 36, borderRadius: "8px", border: `1px solid ${p === page ? "var(--emerald)" : "var(--border)"}`, background: p === page ? "var(--emerald)" : "white", color: p === page ? "white" : "var(--charcoal)", cursor: "pointer", fontWeight: 700, fontSize: "0.8125rem", fontFamily: "inherit" }}>
              {p}
            </button>
          );
        })}
        <button
          disabled={page >= totalPages || isPending}
          onClick={() => navigate(page + 1)}
          style={{ padding: "0.4375rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: page >= totalPages ? "var(--ivory)" : "white", color: page >= totalPages ? "var(--text-muted)" : "var(--charcoal)", cursor: page >= totalPages ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.8125rem", fontFamily: "inherit" }}
        >
          →
        </button>
      </div>
    </div>
  );
}
