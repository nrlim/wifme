"use client";

import { useTransition, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

interface TableToolbarProps {
  searchPlaceholder?: string;
  filters?: { label: string; value: string }[];
  sorts?: { label: string; value: string }[];
}

export default function TableToolbar({ searchPlaceholder = "Cari...", filters, sorts }: TableToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const qs = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  const currentSearch = qs.get("q") || "";
  const currentStatus = qs.get("status") || "ALL";
  const currentSort = qs.get("sort") || "terbaru";

  const navigate = (params: Record<string, string>) => {
    const next = new URLSearchParams(qs.toString());
    for (const [k, v] of Object.entries(params)) {
      if (!v || v === "ALL") next.delete(k);
      else next.set(k, v);
    }
    // Always reset page to 1 when changing filters/search/sort
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ q: searchRef.current?.value ?? "" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.25rem", opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        
        {/* Search */}
        <form onSubmit={handleSearch} style={{ flex: "1 1 240px", position: "relative" }}>
          <div style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
            <Search size={16} />
          </div>
          <input
            ref={searchRef}
            defaultValue={currentSearch}
            placeholder={searchPlaceholder}
            style={{
              width: "100%", padding: "0.625rem 1rem 0.625rem 2.5rem", borderRadius: "10px",
              border: "1px solid var(--border)", background: "white", fontSize: "0.875rem", fontFamily: "inherit",
              outline: "none", transition: "border-color 0.2s", color: "var(--charcoal)"
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--emerald)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
        </form>

        {/* Sort */}
        {sorts && sorts.length > 0 && (
          <select
            value={currentSort}
            onChange={(e) => navigate({ sort: e.target.value })}
            style={{
              padding: "0.625rem 1rem", borderRadius: "10px", border: "1px solid var(--border)",
              background: "white", fontSize: "0.875rem", fontFamily: "inherit", color: "var(--charcoal)",
              cursor: "pointer", outline: "none"
            }}
          >
            {sorts.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Filters / Tabs */}
      {filters && filters.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem", scrollbarWidth: "none" }}>
          {filters.map(f => {
            const isActive = currentStatus === f.value || (!currentStatus && f.value === "ALL");
            return (
              <button
                key={f.value}
                onClick={() => navigate({ status: f.value })}
                style={{
                  padding: "0.5rem 1rem", borderRadius: "99px",
                  border: `1px solid ${isActive ? "var(--emerald)" : "var(--border)"}`,
                  background: isActive ? "var(--emerald-pale)" : "white",
                  color: isActive ? "var(--emerald)" : "var(--text-muted)",
                  fontSize: "0.8125rem", fontWeight: isActive ? 700 : 600,
                  whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.2s"
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
