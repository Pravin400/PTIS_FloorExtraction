import React from "react";
import { cn } from "@/lib/utils/cn";
import { AlertCircle, CheckCircle } from "lucide-react";
 
/* =======================
   TYPES
======================= */
 
interface CommonStatusBadgeProps {
  className?: string;
}
 
/* ----- STATUS VARIANT (default) ----- */
interface StatusVariantProps extends CommonStatusBadgeProps {
  variant?: "status"; // default
  value: string | number | boolean | null;
  activeLabel?: string;
  inactiveLabel?: string;
  icon?: never;
  label?: never;
}

/* ----- INFO VARIANT ----- */
interface InfoVariantProps extends CommonStatusBadgeProps {
  variant: "info";
  icon?: React.ReactNode;
  label?: string;
  value?: never;
  activeLabel?: never;
  inactiveLabel?: never;
}

/* ----- PENDING VARIANT ----- */
interface PendingVariantProps extends CommonStatusBadgeProps {
  variant: "pending";
  label?: string;
  icon?: React.ReactNode;
  value?: never;
  activeLabel?: never;
  inactiveLabel?: never;
}
 
export type StatusBadgeProps = StatusVariantProps | InfoVariantProps | PendingVariantProps;
 
/* =======================
   COMPONENT
======================= */
 
export function StatusBadge(props: StatusBadgeProps) {
  const { className } = props;
 
  /* ================= INFO VARIANT ================= */
  if (props.variant === "info") {
    const { icon, label } = props;
 
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1 rounded shadow text-sm font-semibold border whitespace-nowrap",
          "bg-[#e3f0fd] text-blue-700 border-[#e0e7ef]",
          className
        )}
      >
        {icon && <span className="shrink-0 w-4 h-4">{icon}</span>}
        {label && <span>{label}</span>}
      </span>
    );
  }

  /* ================= PENDING VARIANT ================= */
  if (props.variant === "pending") {
    const { icon, label = "Pending", className } = props;
 
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border whitespace-nowrap",
          "bg-amber-50 text-amber-700 border-amber-300",
          className
        )}
      >
        {icon ? (
          <span className="shrink-0 w-3 h-3">{icon}</span>
        ) : (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        )}
        <span>{label}</span>
      </span>
    );
  }
 
  /* ================= STATUS VARIANT ================= */
  const {
    value,
    activeLabel = "Active",
    inactiveLabel = "Inactive",
  } = props;
 
  const isActive =
    value !== null &&
    (String(value).toLowerCase() === "active" ||
      String(value) === "1" ||
      String(value).toLowerCase() === "true");
 
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold border whitespace-nowrap",
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
          : "bg-rose-50 text-rose-700 border-rose-300",
        className
      )}
    >
      {isActive ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <AlertCircle className="w-3 h-3" />
      )}
      {isActive ? activeLabel : inactiveLabel}
    </span>
  );
}