"use client";
import React, { useEffect, useState, useId } from "react";
import type { KeyboardEvent } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ToggleSwitchProps {
  checked: boolean;
  /**
   * Callback when toggled. Receives the new checked state.
   * For backward compatibility, callbacks that ignore the argument are still assignable.
   */
  onChange: (checked: boolean) => void;
  label?: string;
  showPopup?: boolean;
  disabled?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  popupDuration?: number; // ms, default 2000
  id?: string;
}
export const ToggleSwitch = React.forwardRef<HTMLButtonElement, ToggleSwitchProps>(
  ({
    checked,
    onChange,
    label,
    showPopup = true,
    disabled = false,
    activeLabel = "Active",
    inactiveLabel = "Inactive",
    popupDuration = 2000,
    id,
  }, ref) => {
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [popupText, setPopupText] = useState("");

  useEffect(() => {
    if (showStatusPopup && popupDuration > 0) {
      const timer = setTimeout(() => setShowStatusPopup(false), popupDuration);
      return () => clearTimeout(timer);
    }
  }, [showStatusPopup, popupDuration]);

  const handleToggle = () => {
    if (disabled) return;
    setPopupText(!checked ? activeLabel : inactiveLabel);
    if (showPopup) setShowStatusPopup(true);
    // Always call onChange with the new checked state; callbacks that ignore arguments remain compatible.
    onChange(!checked);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle();
    }
  };

  const state = checked ? "checked" : "unchecked";

  // Generate a stable unique id for the label if label is provided
  const reactId = useId();
  const labelId = label ? `toggle-switch-label-${reactId}` : undefined;
  return (
    <div className="flex items-center gap-3">
      {label && (
        <span id={labelId} className="text-sm font-medium text-gray-700">{label}</span>
      )}

      <div className="relative inline-flex items-center">
        {/* SWITCH TRACK */}
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={!label ? (checked ? activeLabel : inactiveLabel) : undefined}
          aria-labelledby={label ? labelId : undefined}
          data-state={state}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          id={id}
          ref={ref}
          className={`
            peer
            inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full
            border border-transparent
            transition-all outline-none
            data-[state=checked]:bg-blue-600
            focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
            text-gray-900
            bg-gray-200
            hover:bg-gray-300
            disabled:cursor-not-allowed
            disabled:opacity-50
          `}
          disabled={disabled}
        >
          {/* SWITCH THUMB */}
          <span
            data-state={state}
            className={`
              pointer-events-none block h-4 w-4 rounded-full bg-white shadow
              transition-transform

              data-[state=checked]:translate-x-[0.9rem]
              data-[state=unchecked]:translate-x-[0.1rem]
            `}
          />
        </button>

        {/* STATUS POPUP */}
        {showStatusPopup && (
          <div
            className={`
              absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
              px-3 py-1.5 rounded-md shadow-lg border text-xs font-bold
              ${
                popupText === activeLabel
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-gray-100 text-gray-600 border-gray-300"
              }
            `}
          >
            {popupText}
          </div>
        )}
      </div>
    </div>
  );
}
);

ToggleSwitch.displayName = "ToggleSwitch";

export interface FormStatusToggleProps {
  isEdit: boolean;
  isActive: boolean;
  onChange: (val: boolean) => void;
  isSubmitting?: boolean;
  statusLabel: string;
  description: string;
}

export function FormStatusToggle({
  isEdit,
  isActive,
  onChange,
  isSubmitting = false,
  statusLabel,
  description,
}: FormStatusToggleProps) {
  if (!isEdit) return null;

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
      <div
        className={cn(
          "rounded-xl p-3 flex items-center justify-between",
          isActive
            ? "border border-blue-200 bg-[#F0F6FF]"
            : "border border-gray-200 bg-gray-50"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-full",
              isActive
                ? "bg-green-100 text-green-600"
                : "bg-gray-200 text-gray-900"
            )}
          >
            {isActive ? <CheckCircle2 size={18} /> : <X size={18} />}
          </div>
          <div>
            <div className="font-medium text-gray-900">{statusLabel}</div>
            <div className="text-sm text-gray-500">
              {description}
            </div>
          </div>
        </div>

        <ToggleSwitch
          checked={Boolean(isActive)}
          onChange={onChange}
          showPopup={false}
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
}