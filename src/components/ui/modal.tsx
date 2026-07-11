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
  /** Rendered outside the scrollable body, pinned to the bottom (e.g. Cancelar/Guardar).
   *  Keeps actions reachable without scrolling when the body is taller than the viewport. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
} as const;

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
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
        // a UA-stylesheet rule. An unconditional `display` utility here (e.g. `block`) is an author style,
        // which always wins over UA styles regardless of specificity — that would keep it visible even
        // when closed. Gate the visible layout behind Tailwind's `open:` variant (targets `dialog[open]`).
        "hidden open:block",
        // Tailwind's preflight resets `margin` on every element, which breaks the browser's
        // default `margin: auto` centering for <dialog>. Center it explicitly instead.
        //
        // The dialog itself (not a nested div) is the only scroll container, sized by normal block
        // flow and clamped by max-height. A two-level flex layout (outer `h-fit` + inner `flex-1
        // overflow-y-auto`) is fragile in WebKit: Safari can fail to re-measure a `fit-content` dialog
        // whose content was already in the DOM (just `display:none`) right before `showModal()` runs,
        // leaving the dialog stuck at a too-small height with the rest of the form clipped. A single
        // auto-height, max-height-clamped scroll box sidesteps that entirely. The header/footer are
        // pinned with `sticky` instead of being separate flex items.
        "fixed inset-0 m-auto max-h-[85vh] w-full overflow-y-auto",
        "rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-zinc-900/80",
        "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
        SIZE_CLASSES[size]
      )}
    >
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
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
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="sticky bottom-0 z-10 border-t border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          {footer}
        </div>
      )}
    </dialog>
  );
}
