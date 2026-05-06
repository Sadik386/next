"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Moon, Sun, Bell, Menu, LogOut, User, ChevronDown } from "lucide-react";

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const pathLabel = "/" + pathname.replace("/", "").toUpperCase();

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: "220px",
        right: 0,
        height: "48px",
        backgroundColor: "var(--topbar-bg)",
        borderBottom: "1px solid var(--topbar-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Menu size={15} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "4px",
              backgroundColor: "var(--brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
              fontWeight: 700,
              color: "white",
            }}
          >
            A
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{pathLabel}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <button
          onClick={toggleTheme}
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Bell size={14} />
          <span
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              width: "5px",
              height: "5px",
              backgroundColor: "var(--brand)",
              borderRadius: "50%",
            }}
          />
        </button>
        <div
          style={{
            width: "1px",
            height: "18px",
            backgroundColor: "var(--card-border)",
            margin: "0 6px",
          }}
        />
        <button
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            border: "1px solid var(--card-border)",
            backgroundColor: "transparent",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
          onClick={() => router.push("/pos")}
        >
          POS
        </button>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "5px 8px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "7px",
                backgroundColor: "var(--brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={13} color="white" />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
              Admin
            </span>
            <ChevronDown size={12} color="var(--text-muted)" />
          </button>
          {showMenu && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 90 }}
                onClick={() => setShowMenu(false)}
              />
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "40px",
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "10px",
                  padding: "5px",
                  minWidth: "150px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                  zIndex: 100,
                }}
              >
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#ef4444",
                    fontWeight: 500,
                  }}
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
