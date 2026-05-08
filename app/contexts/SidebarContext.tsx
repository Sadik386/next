"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextValue {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  isExpanded: boolean;
  sidebarWidth: string;
  toggleSidebar: () => void;
  closeMobile: () => void;
  setIsHovered: (hovered: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

const COLLAPSED_WIDTH = "64px";
const EXPANDED_WIDTH = "220px";
const MOBILE_BREAKPOINT = 1024;

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Update CSS variable for sidebar width
  useEffect(() => {
    const isMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
    if (isMobile) return;
    const isExpanded = !isCollapsed || isHovered;
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH
    );
  }, [isCollapsed, isHovered]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (isMobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMobileOpen]);

  // Auto-close the mobile drawer on navigation.
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // Computed values
  const isExpanded = !isCollapsed || isHovered;
  const sidebarWidth = isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        isHovered,
        isExpanded,
        sidebarWidth,
        toggleSidebar,
        closeMobile,
        setIsHovered,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}