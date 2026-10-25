'use client';

import { AssetDocumentsPanel } from './AssetDocumentsPanel';
import type { LocationOwnershipContentProps } from "@/types/asset/municipal-Asset/new-add-new-asset/ownership.types";

export function LocationOwnershipContent({
  onPrevious,
  onSaveAsDraft,
  onSaveAndNext,
}: LocationOwnershipContentProps) {
  // Navigation action handlers passed from parent step orchestrator
  void onPrevious;
  void onSaveAsDraft;
  void onSaveAndNext;

  return (
    <div className="min-h-full">
      <AssetDocumentsPanel />
    </div>
  );
}
