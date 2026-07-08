"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
} as const;

export function Modal({ open, onClose, title, description, children, size = "md" }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className={cn(
        // Closed <dialog> elements are hidden by the browser via `dialog:not([open]) { display: none }`,
        // a UA-stylesheet rule. An unconditional `display` utility here (e.g. `flex`) is an author style,
        // which always wins over UA styles regardless of specificity — that would keep it visible even
        // when closed. Gate the visible layout behind Tailwind's `open:` variant (targets `dialog[open]`).
        "hidden open:flex",
        // Tailwind's preflight resets `margin` on every element, which breaks the browser's
        // default `margin: auto` centering for <dialog>. Center it explicitly instead.
        "fixed inset-0 m-auto h-fit max-h-[85vh] w-full flex-col overflow-hidden",
        "rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-zinc-900/80",
        "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
        SIZE_CLASSES[size]
      )}
    >
      <div className="flex shrink-0 items-start justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
    </dialog>
  );
}
