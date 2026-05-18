"use client";

import { User, Shield, ShieldCheck, UserCog, Warehouse, LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string;
  role?: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
  fallbackClassName?: string;
}

const ROLE_ICONS: Record<string, LucideIcon> = {
  super_admin: ShieldCheck,
  admin: Shield,
  manager: UserCog,
  store_keeper: Warehouse,
  staff: User,
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "#7c3aed", // violet
  admin: "var(--brand)",
  manager: "#2563eb", // blue
  store_keeper: "#d97706", // amber
  staff: "#6b7280", // gray
};

export function UserAvatar({
  name,
  role,
  imageUrl,
  size = 32,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const Icon = role && ROLE_ICONS[role] ? ROLE_ICONS[role] : User;
  const color = role && ROLE_COLORS[role] ? ROLE_COLORS[role] : "var(--brand)";
  
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const fontSize = Math.max(10, size / 2.5);
  const iconSize = Math.max(12, size / 2);

  return (
    <Avatar 
      className={cn(className)} 
      style={{ width: `${size}px`, height: `${size}px`, borderRadius: "8px" }}
    >
      {imageUrl && <AvatarImage src={imageUrl} alt={name || "User avatar"} />}
      <AvatarFallback
        className={cn("text-white", fallbackClassName)}
        style={{
          backgroundColor: color,
          borderRadius: "8px",
          fontSize: `${fontSize}px`,
          fontWeight: 600,
        }}
      >
        {role ? (
          <Icon size={iconSize} strokeWidth={2.2} />
        ) : (
          initials
        )}
      </AvatarFallback>
    </Avatar>
  );
}
