"use client";

import Link from "next/link";
import { PUBLIC_LINKS, LEGAL_LABELS, getCurrentYear } from "./public-links";

const fixedFooterStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "20px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 20,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
};

const inlineFooterStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "8px",
  width: "100%",
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(12px)",
  borderRadius: "20px",
  padding: "5px 16px",
  fontSize: "12px",
  color: "#6b7280",
  whiteSpace: "nowrap",
  border: "1px solid rgba(255,255,255,0.5)",
};

const legalStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "center",
};

const linkStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#9ca3af",
  textDecoration: "none",
  transition: "color 0.2s ease",
};

const separatorStyle: React.CSSProperties = {
  color: "#d1d5db",
  fontSize: "10px",
};

export default function LegalFooter({
  showBadge = true,
  variant = "fixed",
  showMainLink = false,
}: {
  showBadge?: boolean;
  variant?: "fixed" | "inline";
  showMainLink?: boolean;
}) {
  const year = getCurrentYear();
  const footerStyle = variant === "inline" ? inlineFooterStyle : fixedFooterStyle;

  return (
    <div style={footerStyle}>
      {showBadge && <div style={badgeStyle}>Acuity Commerce Operating System</div>}
      <div style={legalStyle}>
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>© {year}</span>
        <span style={separatorStyle}>·</span>
        <Link href={PUBLIC_LINKS.legal.terms} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {LEGAL_LABELS.terms}
        </Link>
        <span style={separatorStyle}>·</span>
        <Link href={PUBLIC_LINKS.legal.privacy} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {LEGAL_LABELS.privacy}
        </Link>
        <span style={separatorStyle}>·</span>
        <Link href={PUBLIC_LINKS.legal.security} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {LEGAL_LABELS.security}
        </Link>
        <span style={separatorStyle}>·</span>
        <Link href={PUBLIC_LINKS.docs} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {LEGAL_LABELS.docs}
        </Link>
        {showMainLink && (
          <>
            <span style={separatorStyle}>·</span>
            <Link href={PUBLIC_LINKS.main} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              acuitycommerce.com
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
