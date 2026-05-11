"use client";
import { useCallback, useState } from "react";

export interface UseBulkSelectionOptions<T> {
  items: T[];
  idKey?: keyof T;
}

export function useBulkSelection<T extends Record<string, unknown>>({ items, idKey = "id" as keyof T }: UseBulkSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());

  const toggle = useCallback((id: T[keyof T]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((item) => String(item[idKey]))));
  }, [items, idKey]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: T[keyof T]) => {
    return selectedIds.has(String(id));
  }, [selectedIds]);

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;

  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  return {
    selectedIds,
    selectedCount,
    hasSelection,
    isAllSelected,
    toggle,
    selectAll,
    clearSelection,
    isSelected,
  };
}