"use client";

import { DeleteButton } from "./ActionButtons";
import { cn } from "@/lib/utils/cn";

export interface MatrixDeleteButtonProps {
  rowIndex: number;
  onRowDelete?: (index: number) => void;
  ariaLabel?: string;
}

export const MatrixDeleteButton = ({
  rowIndex,
  onRowDelete,
  ariaLabel,
}: MatrixDeleteButtonProps): React.ReactElement => {
  return (
    <DeleteButton
      onClick={() => onRowDelete?.(rowIndex)}
      className={cn(
        "p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors h-8 w-8",
        "border-none shadow-none"
      )}
      aria-label={ariaLabel}
    />
  );
};
