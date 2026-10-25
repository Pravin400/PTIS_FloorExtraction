"use client";

import React, { createContext, JSX, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Info, Pencil, Plus, Trash2, X } from "lucide-react";
import { Tooltip } from "@/components/common/Tooltip";

/* ================= Types ================= */

export type ConfirmVariant = "delete" | "add" | "update" | "info" | "warning";

export type ConfirmSize = "sm" | "md" | "lg" | "xl";

export type ConfirmMeta = {
  id?: string | number;
  name?: string;
  [key: string]: unknown;
};

export interface ConfirmOptions {
  variant?: ConfirmVariant;
  size?: ConfirmSize;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  meta?: ConfirmMeta;
  onConfirm: (meta?: ConfirmMeta) => Promise<void> | void;
  onCancel?: () => void;
  closeOnConfirm?: boolean;
}

export type ConfirmPayload = ConfirmOptions;

export interface ConfirmContextType {
  confirm: (payload: ConfirmPayload) => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm(): ConfirmContextType {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx;
}

function renderRecordMeta(meta?: ConfirmMeta): React.ReactNode {
  if (!meta) return null;
  const name = meta.name ? String(meta.name).trim() : "";
  const id = meta.id !== undefined && meta.id !== null ? String(meta.id).trim() : "";

  if (!name && !id) return null;

  const TRUNCATION_LIMIT = 30;
  const TRUNCATED_LENGTH = TRUNCATION_LIMIT - 4;

  const isTruncated = name.length > TRUNCATION_LIMIT;
  const truncatedName = isTruncated
    ? `${name.slice(0, TRUNCATED_LENGTH)}....`
    : name;

  const recordNameElement = isTruncated ? (
    <Tooltip content={name} placement="bottom">
      <span className="cursor-help">{truncatedName}</span>
    </Tooltip>
  ) : (
    <span>{name}</span>
  );

  return (
    <>
      {name && id && (
        <>
          {" (Record: "}
          {recordNameElement}
          {`, ID: ${id})`}
        </>
      )}
      {name && !id && (
        <>
          {" (Record: "}
          {recordNameElement}
          {")"}
        </>
      )}
      {!name && id && ` (ID: ${id})`}
    </>
  );
}

/* ================= DialogButton Component ================= */
interface DialogButtonProps {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
  variant: "confirm" | "cancel";
  autoFocus?: boolean;
}
function DialogButton({
  label,
  onClick,
  icon: BtnIcon,
  variant,
  autoFocus,
}: DialogButtonProps): JSX.Element {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 h-10 text-sm font-semibold " +
    "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const cancelBtn = "bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300 focus:ring-gray-300";

   const confirmBtn =
    variant === "confirm"
      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300"
      : "bg-red-600 text-white hover:bg-red-700 focus:ring-red-300";

  const cls = variant === "cancel" ? cancelBtn : confirmBtn;
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (autoFocus && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <button type="button" ref={buttonRef} onClick={onClick} className={`${base} ${cls}`}>
      {BtnIcon ? <BtnIcon className="h-4 w-4" /> : null}
      <span>{label}</span>
    </button>
  );
}

/* ================= Provider ================= */
export function ConfirmProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const t = useTranslations("common.confirm");

  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<ConfirmPayload | null>(null);
  const [mounted, setMounted] = useState(false);

  const modalRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      if (!modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  const confirm = useCallback((p: ConfirmPayload) => {
    setPayload(p);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setPayload(null);
  }, []);

  const computed = useMemo(() => {
    const variant: ConfirmVariant = payload?.variant ?? "info";

    const defaults: Record<ConfirmVariant, { title: string; description: string; confirmText: string }> = {
      delete: { title: t("delete.title"), description: t("delete.description"), confirmText: t("delete.confirm") },
      add: { title: t("add.title"), description: t("add.description"), confirmText: t("add.confirm") },
      update: { title: t("update.title"), description: t("update.description"), confirmText: t("update.confirm") },
      info: { title: t("info.title"), description: t("info.description"), confirmText: t("info.confirm") },
      warning: { title: t("warning.title"), description: t("warning.description"), confirmText: t("warning.confirm") },
    };

    const d = defaults[variant];
    const baseDesc = payload?.description ?? d.description;

    return {
      variant,
      size: payload?.size ?? "md",
      title: payload?.title ?? d.title,
      description: baseDesc,
      confirmText: payload?.confirmText ?? d.confirmText,
      cancelText: payload?.cancelText ?? t("cancel"),
      closeOnConfirm: payload?.closeOnConfirm ?? true,
      meta: payload?.meta,
      onConfirm: payload?.onConfirm,
      onCancel: payload?.onCancel,
    };
  }, [payload, t]);

  const handleCancel = useCallback(() => {
    computed.onCancel?.();
    close();
  }, [computed, close]);

  const handleConfirm = useCallback(async () => {
    if (!computed.onConfirm) return;
    try {
      if (computed.closeOnConfirm) close();
      await computed.onConfirm(computed.meta);
    } catch (error) {
      console.error("Error during confirmation:", error);
      // Optionally, you can add user feedback here, e.g.,
      // setErrorMessage("An error occurred. Please try again.");
    }
  }, [computed, close]);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleCancel]);

  // SSR safe
  if (!mounted || typeof document === "undefined") {
    return <ConfirmContext.Provider value={{ confirm }}>{children}</ConfirmContext.Provider>;
  }

  const isDelete = computed.variant === "delete";
  const isAdd = computed.variant === "add";
  const isUpdate = computed.variant === "update";
  const isWarning = computed.variant === "warning";

  const isDanger = isDelete || isWarning;

  // top bar color
  const headerBar = isDanger ? "from-red-600 to-rose-500" : "from-blue-600 to-blue-500";

  // icon
  const Icon = isDelete ? Trash2 : isAdd ? Plus : isUpdate ? Pencil : isWarning ? AlertTriangle : Info;

  const iconWrap = isDanger
    ? "bg-red-50 border-red-200 text-red-600"
    : "bg-blue-50 border-blue-200 text-blue-700";

  const confirmIcon = isDelete ? Trash2 : isAdd ? Plus : isUpdate ? Pencil : isWarning ? AlertTriangle : CheckCircle2;

  // Size mapping
  const sizeClassMap: Record<ConfirmSize, string> = {
    sm: "max-w-[420px]",
    md: "max-w-[500px]",
    lg: "max-w-[560px]",
    xl: "max-w-[640px]",
  };
  const sizeClass = sizeClassMap[computed.size] || sizeClassMap.md;

  // Parse structured description details if present
  const isStringDesc = typeof computed.description === "string";
  const descParts: string[] = isStringDesc ? (computed.description as string).split("\n\n") : [];
  const hasBulletDetails = descParts.length > 1 && descParts.slice(1).some((p: string) => p.includes("•"));
  const introText = descParts[0] || "";
  const detailItems: string[] = hasBulletDetails
    ? descParts.slice(1).join("\n\n").split("\n").filter((l: string) => l.trim().length > 0)
    : [];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {open && payload
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={handleCancel} />

              {/* Sized Modal Box */}
              <div
                ref={modalRef}
                onKeyDown={handleKeyDown}
                role="dialog"
                aria-modal="true"
                className={`relative w-full ${sizeClass} min-h-[380px] max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.25)] border border-gray-200 flex flex-col`}
              >
                {/* Top gradient bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${headerBar}`} />

                {/* Close */}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="absolute right-3 top-3 rounded-full p-2 hover:bg-gray-100 text-gray-600 cursor-pointer transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Center content */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col items-center justify-center text-center">
                  <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center shrink-0 ${iconWrap}`}>
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{computed.title}</h3>

                  <div className="mt-3 flex-1 overflow-y-auto w-full max-h-[260px] px-2 text-center scrollbar-thin">
                    {!isStringDesc ? (
                      <div className="w-full text-center max-w-[460px] mx-auto">
                        {computed.description}
                        {renderRecordMeta(computed.meta)}
                      </div>
                    ) : hasBulletDetails ? (
                      <div className="w-full text-center space-y-2.5">
                        <p className="text-sm font-semibold text-gray-800">{introText}</p>
                        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-left space-y-1.5 shadow-2xs font-medium">
                          {detailItems.map((line, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                              <span>{line.replace(/^•\s*/, "")}</span>
                            </div>
                          ))}
                        </div>
                        {renderRecordMeta(computed.meta)}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap inline-block text-center max-w-[460px]">
                        {computed.description}
                        {renderRecordMeta(computed.meta)}
                      </p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="mt-5 flex items-center justify-center gap-3 shrink-0">
                    <DialogButton
                      variant="confirm"
                      label={computed.confirmText}
                      onClick={handleConfirm}
                      icon={confirmIcon}
                      autoFocus
                    />

                    <DialogButton
                      variant="cancel"
                      label={computed.cancelText}
                      onClick={handleCancel}
                      icon={X}
                    />
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </ConfirmContext.Provider>
  );
}
