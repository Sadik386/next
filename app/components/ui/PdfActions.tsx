"use client";
import { useState, useRef, useEffect, ReactNode } from "react";

interface PdfMenuItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface PdfMenuGroup {
  label?: string;
  items: PdfMenuItem[];
  divider?: boolean;
}

interface PdfActionsProps {
  groups: PdfMenuGroup[];
  trigger?: ReactNode;
  menuWidth?: number;
}

export default function PdfActions({ groups, trigger, menuWidth = 200 }: PdfActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "6px",
          border: "1px solid var(--card-border)",
          backgroundColor: open ? "var(--brand)" : "transparent",
          color: open ? "#fff" : "var(--text-secondary)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
        }}
        title="Document Actions"
      >
        {trigger ?? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="5" r="1.2" />
            <circle cx="12" cy="12" r="1.2" />
            <circle cx="12" cy="19" r="1.2" />
          </svg>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 1000,
            minWidth: menuWidth,
            overflow: "hidden",
            animation: "dropdownFadeIn 0.12s ease",
          }}
        >
          <style>{`
            @keyframes dropdownFadeIn {
              from { opacity: 0; transform: translateY(-4px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          {groups.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && group.divider !== false && (
                <div style={{ height: "1px", backgroundColor: "var(--card-border)", margin: "4px 0" }} />
              )}
              {group.label && (
                <div style={{
                  padding: "8px 14px 4px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  {group.label}
                </div>
              )}
              {group.items.map((item, ii) => (
                <button
                  key={ii}
                  onClick={() => { item.onClick(); setOpen(false); }}
                  disabled={item.disabled}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 14px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: item.danger
                      ? "#dc2626"
                      : item.disabled
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: item.disabled ? "not-allowed" : "pointer",
                    textAlign: "left",
                    opacity: item.disabled ? 0.5 : 1,
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!item.disabled) (e.target as HTMLElement).style.backgroundColor = "var(--input-bg)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = "transparent";
                  }}
                >
                  <span style={{ color: "inherit", display: "flex", alignItems: "center" }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}