"use client";
import { useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { createPortal } from "react-dom";

interface PopoverItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface FloatingPopoverProps {
  trigger: ReactNode;
  items: PopoverItem[];
  width?: number;
  align?: "left" | "right";
}

export function FloatingPopover({ trigger, items, width = 180, align = "right" }: FloatingPopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuW = width;
    const menuH = items.length * 38 + 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = align === "right" ? rect.right - menuW : rect.left;
    let top = rect.bottom + 6;

    if (left + menuW > vw - 8) left = vw - menuW - 8;
    if (left < 8) left = 8;
    if (top + menuH > vh - 8) top = rect.top - menuH - 6;

    setPos({ top, left });
  }, [align, width, items.length]);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const handleScroll = () => updatePos();
    const handleResize = () => updatePos();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        triggerRef.current && triggerRef.current.contains(e.target as Node)
      ) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <>
      <div ref={triggerRef} onClick={() => setOpen((o) => !o)} style={{ cursor: "pointer", display: "inline-flex" }}>
        {trigger}
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width,
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: 10,
              boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
              zIndex: 9999,
              padding: "6px",
              animation: "fpFadeIn 0.12s ease",
              transformOrigin: align === "right" ? "top right" : "top left",
            }}
          >
            <style>{`
              @keyframes fpFadeIn {
                from { opacity: 0; transform: scale(0.92); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                disabled={item.disabled}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  border: "none",
                  borderRadius: 6,
                  backgroundColor: "transparent",
                  color: item.danger
                    ? "#dc2626"
                    : item.disabled
                    ? "var(--text-muted)"
                    : "var(--text-primary)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: item.disabled ? "not-allowed" : "pointer",
                  textAlign: "left",
                  opacity: item.disabled ? 0.5 : 1,
                  transition: "background-color 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled)
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--input-bg)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                <span style={{ color: "inherit", display: "flex", alignItems: "center", flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}