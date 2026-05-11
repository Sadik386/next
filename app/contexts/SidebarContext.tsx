"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
  isCollapsed: boolean;
  isHovered: boolean;
  isExpanded: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  setIsHovered: (v: boolean) => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: true,
  isHovered: false,
  isExpanded: false,
  isMobileOpen: false,
  toggleSidebar: () => {},
  setIsHovered: () => {},
  closeMobile: () => {},
  toggleMobile: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const isExpanded = !isCollapsed || isHovered;

  // Load saved state on mount
  useEffect(() => {
    const stored = localStorage.getItem("sidebarCollapsed");
    if (stored !== null) setIsCollapsed(stored === "true");
  }, []);

  // Update --sidebar-width CSS variable on every change
  useEffect(() => {
    const width = isExpanded ? "220px" : "64px";
    document.documentElement.style.setProperty("--sidebar-width", width);
  }, [isExpanded]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebarCollapsed", String(next));
  }, [isCollapsed]);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      isHovered,
      isExpanded,
      isMobileOpen,
      toggleSidebar,
      setIsHovered,
      closeMobile,
      toggleMobile,
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}