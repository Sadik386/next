"use client";
import { X } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function BulkActionBar({ selectedCount, onClear, actions, children }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "var(--brand)",
        borderRadius: "10px",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        zIndex: 100,
      }}
    >
      <span style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>
        {selectedCount} selected
      </span>
      {actions}
      {children}
      <button
        onClick={onClear}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          borderRadius: "6px",
          padding: "4px 8px",
          cursor: "pointer",
          color: "white",
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}