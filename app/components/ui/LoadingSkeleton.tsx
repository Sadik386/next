import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type LoadingSkeletonProps = {
  rows?: number;
  cols?: number;
};

export function TableSkeleton({ rows = 5, cols = 6 }: LoadingSkeletonProps) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: "8px",
            padding: "14px 12px",
            borderBottom: "1px solid var(--card-border)",
          }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} style={{ height: "14px", borderRadius: "4px" }} />
          ))}
        </div>
      ))}
    </div>
  );
}
