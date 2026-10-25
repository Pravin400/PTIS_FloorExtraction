"use client";

import { StatusToggleCard, ValidationMessage } from "@/components/common";

interface StatusToggleSectionProps {
  isEdit?: boolean;
  isActive: boolean;
  handleToggleStatus: () => void;
  error?: string;
  label?: string;
  description?: string;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  tCommon: (key: string) => string;
}

export const StatusToggleSection = ({
  isEdit = true,
  isActive,
  handleToggleStatus,
  error,
  label,
  description,
  t,
  tCommon,
}: StatusToggleSectionProps) => {
  if (!isEdit) return null;

  return (
    <div className="space-y-1">
      <StatusToggleCard
        isActive={isActive}
        onToggle={handleToggleStatus}
        statusLabel={label || t("form.status.label")}
        activeLabel={tCommon("status.active")}
        inactiveLabel={tCommon("status.inactive")}
        description={
          description
            ? description
            : `${t("form.status.description")}${isActive ? ` ${tCommon("status.active")}` : ` ${tCommon("status.inactive")}`}`
        }
      />
      <ValidationMessage message={error} visible={!!error} />
    </div>
  );
};
