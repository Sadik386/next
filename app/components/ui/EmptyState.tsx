import React from "react";
import { FileX } from "lucide-react";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          backgroundColor: "var(--input-bg)",
          border: "1px solid var(--card-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "12px",
          color: "var(--text-muted)",
        }}
      >
        {icon ?? <FileX size={20} strokeWidth={1.5} />}
      </div>
      <p
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "4px",
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            maxWidth: "320px",
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: "14px" }}>{action}</div>}
    </div>
  );
}
