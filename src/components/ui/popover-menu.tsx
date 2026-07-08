"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PopoverMenuProps {
  trigger: (props: { open: boolean }) => ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
  closeOnSelect?: boolean;
}

export function PopoverMenu({
  trigger,
  children,
  align = "right",
  className,
  closeOnSelect = true,
}: PopoverMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={() => setOpen((value) => !value)}>{trigger({ open })}</div>
      {open && (
        <div
          className={cn(
            "absolute z-20 mt-2 min-w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg",
            "dark:border-zinc-700 dark:bg-zinc-900",
            align === "right" ? "right-0" : "left-0",
            className
          )}
          onClick={closeOnSelect ? () => setOpen(false) : undefined}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function PopoverMenuItem({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100",
        "dark:text-zinc-200 dark:hover:bg-zinc-800",
        className
      )}
    >
      {children}
    </button>
  );
}
