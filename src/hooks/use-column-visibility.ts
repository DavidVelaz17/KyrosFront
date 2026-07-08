"use client";

import { useEffect, useState } from "react";

export function useColumnVisibility(storageKey: string, defaults: Record<string, boolean>) {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(visibility));
  }, [storageKey, visibility]);

  return [visibility, setVisibility] as const;
}
