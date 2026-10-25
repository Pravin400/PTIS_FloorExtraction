import { CheckCircle2, X } from "lucide-react";
import { ToggleSwitch, ValidationMessage } from "@/components/common";
import { cn } from "@/lib/utils/cn";

interface OfficeStatusToggleProps {
  isActive: boolean;
  onToggle: () => void;
  error?: string;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function OfficeStatusToggle({ isActive, onToggle, error, t, tCommon }: OfficeStatusToggleProps) {
  return (
    <div className="rounded-xl border border-blue-100 bg-slate-50 p-4 transition-all duration-300">
      <div
        className={cn(
          "rounded-xl p-3 flex items-center justify-between transition-all duration-300",
          isActive
            ? "border border-blue-200 bg-blue-50/50 shadow-sm"
            : "border border-gray-200 bg-gray-50 shadow-none"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-full transition-colors duration-300",
              isActive
                ? "bg-blue-100 text-blue-600 shadow-inner"
                : "bg-gray-200 text-gray-500"
            )}
          >
            {isActive ? <CheckCircle2 size={20} /> : <X size={20} />}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{t("form.status.label")}</div>
            <div className="text-sm text-gray-500">
              {t("form.status.description")}
              <span className={cn(
                "ml-1 font-medium",
                isActive ? "text-blue-600" : "text-gray-600"
              )}>
                {isActive ? tCommon("status.active") : tCommon("status.inactive")}
              </span>
            </div>
          </div>
        </div>

        <ToggleSwitch
          checked={isActive}
          onChange={onToggle}
          showPopup={false}
        />
      </div>

      {error && (
        <ValidationMessage
          message={error}
          visible={!!error}
          className="mt-3"
        />
      )}
    </div>
  );
}
