"use client";

import { StatusToggleCard } from "./StatusToggleCard";

interface StatusToggleSectionProps {
  isEdit: boolean;
  isActive: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}

export function StatusToggleSection({
  isEdit,
  isActive,
  onToggle,
  t,
}: StatusToggleSectionProps) {
  if (!isEdit) return null;

  return (
    <StatusToggleCard
      isActive={isActive}
      onToggle={onToggle}
      activeLabel={t("form.status.active")}
      inactiveLabel={t("form.status.inactive")}
      statusLabel={t("form.status.label")}
    />
  );
}

