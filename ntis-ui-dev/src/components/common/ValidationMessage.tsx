import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ValidationType = "error" | "warning" | "info";

interface ValidationMessageProps {
  message?: string;
  visible?: boolean;
  type?: ValidationType;
  className?: string;
  id?: string;
}

/**
 * Common Validation Message
 * Usage: errors, warnings, info hints
 */
export function ValidationMessage({
  message,
  visible = true,
  type = "error",
  className,
  id,
}: ValidationMessageProps) {
  if (!visible || !message) return null;

  const config = {
    error: {
      icon: AlertCircle,
      text: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    warning: {
      icon: AlertTriangle,
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    info: {
      icon: Info,
      text: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
    id={id}
    className={cn(
        "mt-1 flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs",
        config.text,
        config.bg,
        config.border,
        className
       )}
    >
      <Icon size={14} />
      <span>{message}</span>
    </div>
  );
}
