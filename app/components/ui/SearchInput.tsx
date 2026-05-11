"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setLocal(value);
      lastEmitted.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (local === lastEmitted.current) return;
    const t = setTimeout(() => {
      lastEmitted.current = local;
      onChange(local);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [local, debounceMs, onChange]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "8px",
        padding: "8px 12px",
        flex: "1 1 280px",
        maxWidth: "360px",
      }}
    >
      <Search size={14} color="var(--text-muted)" />
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: "13px",
          color: "var(--text-primary)",
          flex: 1,
        }}
      />
      {local && (
        <button
          type="button"
          onClick={() => {
            setLocal("");
            lastEmitted.current = "";
            onChange("");
          }}
          aria-label="Clear search"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
            color: "var(--text-muted)",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
