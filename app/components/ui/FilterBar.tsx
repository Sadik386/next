"use client";
import { ReactNode } from "react";
import { X } from "lucide-react";

interface FilterBarProps {
  search?: ReactNode;
  filters?: ReactNode;
  dateRange?: ReactNode;
  onClear?: () => void;
  showClear?: boolean;
  count?: { start: number; end: number; total: number };
  rightExtras?: ReactNode;
}

export default function FilterBar({
  search,
  filters,
  dateRange,
  onClear,
  showClear,
  count,
  rightExtras,
}: FilterBarProps) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {search}
        {filters}
        <div style={{ flex: "1 1 auto" }} />
        {dateRange}
        {rightExtras}
        {showClear && onClear && (
          <button
            type="button"
            onClick={onClear}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--card-border)",
              backgroundColor: "var(--card-bg)",
              fontSize: "13px",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <X size={13} /> Clear Filters
          </button>
        )}
      </div>
      {count && count.total > 0 && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "8px",
          }}
        >
          Showing {count.start}-{count.end} of {count.total} results
        </div>
      )}
    </div>
  );
}
