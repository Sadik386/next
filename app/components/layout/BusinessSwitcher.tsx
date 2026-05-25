"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

export function BusinessSwitcher() {
  const router = useRouter();
  const { user, businesses, switchBusiness } = useAuth();
  const [switching, setSwitching] = useState(false);

  if (businesses.length <= 1) return null;

  const activeBusinessId = user?.businessId ?? businesses.find((b) => b.isDefault)?.businessId ?? businesses[0].businessId;
  const currentBusiness = businesses.find((b) => b.businessId === activeBusinessId) ?? businesses[0];

  const handleSwitch = async (businessId: string) => {
    const id = Number(businessId);
    if (id === activeBusinessId) return;
    setSwitching(true);
    try {
      const result = await switchBusiness(id);
      if (result.success) {
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="business-switcher">
      <Select
        value={String(activeBusinessId)}
        onValueChange={handleSwitch}
        disabled={switching}
      >
        <SelectTrigger
          style={{
            width: "160px",
            height: "32px",
            fontSize: "12px",
            fontWeight: 500,
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--card-border)",
          }}
        >
          <SelectValue placeholder={currentBusiness?.name ?? "Select business"} />
        </SelectTrigger>
        <SelectContent>
          {businesses.map((b) => (
            <SelectItem
              key={b.businessId}
              value={String(b.businessId)}
              style={{ fontSize: "13px" }}
            >
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
