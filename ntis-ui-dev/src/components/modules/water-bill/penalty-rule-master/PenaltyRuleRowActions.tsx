"use client";

import React from "react";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import type { WaterPenaltyRuleDto } from "@/types/water-bill/penalty-rule-master.types";

export interface PenaltyRuleRowActionsProps {
  row: WaterPenaltyRuleDto;
  onEdit: (row: WaterPenaltyRuleDto) => void;
  onDelete: (row: WaterPenaltyRuleDto) => void;
}

export function PenaltyRuleRowActions({
  row,
  onEdit,
  onDelete,
}: PenaltyRuleRowActionsProps): React.ReactElement {
  return (
    <div className="flex items-center gap-1">
      <EditButton aria-label="Edit Penalty Rule" onClick={() => onEdit(row)} />
      <DeleteButton aria-label="Delete Penalty Rule" onClick={() => onDelete(row)} />
    </div>
  );
}
