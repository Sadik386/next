"use client";

import { useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";

export function DynamicFavicon() {
  const { settings } = useSettings();
  const logoUrl = settings?.logoUrl;

  useEffect(() => {
    if (!logoUrl) return;

    // Find or create the favicon link element
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement("link");
      link.rel = "shortcut icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }

    // Add cache-busting parameter to logoUrl
    const cacheBustedUrl = `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}v=${new Date().getTime()}`;
    link.href = cacheBustedUrl;

    // Also update apple-touch-icon if it exists or create it
    let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (!appleIcon) {
      appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      document.getElementsByTagName("head")[0].appendChild(appleIcon);
    }
    appleIcon.href = cacheBustedUrl;

  }, [logoUrl]);

  return null;
}
