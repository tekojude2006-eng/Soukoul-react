"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Button({
  children,
  className,
  variant = "gold",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "gold" | "ghost" | "danger" }) {
  return (
    <button className={cn("btn", variant === "gold" ? "btn-gold" : variant === "danger" ? "btn-danger" : "btn-ghost", className)} {...props}>
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose?: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="overlay grid place-items-center px-4" onClick={onClose}>
      <div
        className={cn("modal max-h-[calc(100vh-32px)] overflow-y-auto")}
        style={wide ? { width: "min(760px, calc(100vw - 32px))" } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div>
            <p className="serif m-0 text-[22px] leading-tight">{title}</p>
            {subtitle ? <p className="mt-1 mb-0 text-sm text-[var(--muted)]">{subtitle}</p> : null}
          </div>
          {onClose ? (
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fermer" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 36,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  if (src) {
    return (
      <div
        className="shrink-0 overflow-hidden"
        style={{
          width: size,
          height: size,
          border: "1px solid var(--line-strong)",
          borderRadius: 2,
          background: "#f3e6e8",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="grid shrink-0 place-items-center font-medium"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        background: "#f3e6e8",
        color: "#7a2330",
        border: "1px solid #e3c6cb",
        borderRadius: 2,
      }}
    >
      {initials}
    </div>
  );
}

export function Toast({ message, type }: { message: string | null; type?: "ok" | "err" }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2">
      <div
        className="border px-4 py-2.5 text-sm"
        style={{
          background: "#fcf8f1",
          borderColor: type === "err" ? "#e3c4c4" : "#c5d9cd",
          color: type === "err" ? "#8f2d2d" : "#1c1915",
        }}
      >
        {message}
      </div>
    </div>
  );
}

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-dashed border-[var(--line-strong)] px-6 py-12 text-center">
      <p className="serif m-0 text-xl">{title}</p>
      <p className="mt-2 mb-0 max-w-md text-sm text-[var(--muted)]">{text}</p>
    </div>
  );
}
