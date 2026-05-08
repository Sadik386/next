"use client";
import React from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  Users, 
  Package, 
  User, 
  CheckCircle2,
  Lock
} from "lucide-react";

interface RoleCardProps {
  name: string;
  level: number;
  isHighest?: boolean;
  description: string;
  capabilities: string[];
  icon: React.ReactNode;
  color: string;
}

function RoleCard({ 
  name, 
  level, 
  isHighest, 
  description, 
  capabilities, 
  icon, 
  color 
}: RoleCardProps) {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ 
            width: "40px", 
            height: "40px", 
            borderRadius: "8px", 
            backgroundColor: `${color}15`, 
            color: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {icon}
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>{name}</h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{description}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {isHighest && (
            <span style={{ 
              fontSize: "11px", 
              fontWeight: 600, 
              padding: "2px 8px", 
              borderRadius: "4px", 
              backgroundColor: "#fef3c7", 
              color: "#b45309",
              border: "1px solid #fde68a"
            }}>
              Highest
            </span>
          )}
          <span style={{ 
            fontSize: "11px", 
            fontWeight: 600, 
            padding: "2px 8px", 
            borderRadius: "4px", 
            backgroundColor: "var(--input-bg)", 
            color: "var(--text-secondary)",
            border: "1px solid var(--card-border)"
          }}>
            Level {level}
          </span>
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "8px" }}>
        {capabilities.map((cap, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
            <CheckCircle2 size={14} style={{ color: color, flexShrink: 0 }} />
            <span>{cap}</span>
          </div>
        ))}
        {level > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
            <Lock size={14} style={{ flexShrink: 0 }} />
            <span>All capabilities below</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RolesPage() {
  const roles = [
    {
      name: "Super Admin",
      level: 5,
      isHighest: true,
      description: "Full system access and master control",
      color: "#8b5cf6",
      icon: <ShieldAlert size={20} />,
      capabilities: [
        "Full system access",
        "Create and manage admin users",
        "Approve or reject any delete request",
        "Access all reports and settings",
        "Manage roles and permissions"
      ]
    },
    {
      name: "Admin",
      level: 4,
      description: "Administrative access for business management",
      color: "#6366f1",
      icon: <ShieldCheck size={20} />,
      capabilities: [
        "Administrative access",
        "Create manager, store keeper, and staff users",
        "Approve delete requests",
        "Manage business settings"
      ]
    },
    {
      name: "Manager",
      level: 3,
      description: "Operational oversight and reporting",
      color: "#10b981",
      icon: <Shield size={20} />,
      capabilities: [
        "Manages day-to-day operations",
        "View all reports",
        "View user list",
        "Manage customers and suppliers"
      ]
    },
    {
      name: "Store Keeper",
      level: 2,
      description: "Inventory and transaction management",
      color: "#f59e0b",
      icon: <Package size={20} />,
      capabilities: [
        "Manages inventory, products, orders, sales, expenses",
        "Create and edit products and inventory",
        "Create orders, sales, and expenses",
        "Submit delete requests"
      ]
    },
    {
      name: "Staff",
      level: 1,
      description: "Basic front-end access and visibility",
      color: "#6b7280",
      icon: <User size={20} />,
      capabilities: [
        "Basic access",
        "View products, orders, and inventory",
        "Read-only access to reports"
      ]
    }
  ];

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          Roles & Permissions
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
          Role hierarchy and access levels for this system
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {roles.map((role) => (
          <RoleCard key={role.name} {...role} />
        ))}
      </div>

      <div style={{ 
        marginTop: "32px", 
        padding: "16px", 
        backgroundColor: "var(--input-bg)", 
        borderRadius: "8px",
        border: "1px dashed var(--card-border)",
        color: "var(--text-muted)",
        fontSize: "13px",
        textAlign: "center"
      }}>
        Role assignments enforce strict hierarchy — a user can only assign roles strictly below their own level.
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  padding: "20px",
  transition: "transform 0.2s, box-shadow 0.2s",
};
