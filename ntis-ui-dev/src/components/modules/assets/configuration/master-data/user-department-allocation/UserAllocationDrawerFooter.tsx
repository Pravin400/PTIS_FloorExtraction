"use client";

import { memo } from "react";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import { Button, CancelButton, SaveButton } from "@/components/common";

interface UserAllocationDrawerFooterProps {
  currentStep: number;
  isSubmitting: boolean;
  isUpdateMode: boolean;
  onCancel?: () => void;
  onClose: () => void;
  handleBackToDepartments: () => void;
  handleProceedToZones: () => void;
  handleBackToZones?: () => void;
  handleProceedToStages?: () => void;
  handleSave: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const UserAllocationDrawerFooter = memo(function UserAllocationDrawerFooter({
  currentStep,
  isSubmitting,
  isUpdateMode,
  onCancel,
  onClose,
  handleBackToDepartments,
  handleProceedToZones,
  handleBackToZones,
  handleProceedToStages,
  handleSave,
  t,
}: UserAllocationDrawerFooterProps) {
  const renderSaveButton = () => {
    if (isUpdateMode) {
      return (
        <Button
          variant="primary"
          size="sm"
          icon={Pencil}
          onClick={handleSave}
          disabled={isSubmitting}
          isLoading={isSubmitting}
          className="flex-1 sm:flex-initial !bg-blue-900 hover:!bg-blue-950 !text-white font-semibold shadow-xs disabled:!opacity-40 disabled:!cursor-not-allowed"
        >
          {isSubmitting ? t("drawer.updating") : t("drawer.update")}
        </Button>
      );
    }
    return (
      <SaveButton
        label={isSubmitting ? t("drawer.saving") : t("drawer.save")}
        onClick={handleSave}
        disabled={isSubmitting}
        isLoading={isSubmitting}
        className="flex-1 sm:flex-initial !bg-blue-900 hover:!bg-blue-950 !text-white font-semibold shadow-xs disabled:!opacity-40 disabled:!cursor-not-allowed"
      />
    );
  };

  return (
    <div className="flex items-center justify-end gap-2.5 w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border-t border-slate-200">
      {/* Back or Cancel button on the left */}
      {currentStep === 1 ? (
        <CancelButton
          label={t("drawer.cancel")}
          onClick={onCancel || onClose}
          disabled={isSubmitting}
          className="flex-1 sm:flex-initial"
        />
      ) : currentStep === 2 ? (
        <Button
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          onClick={handleBackToDepartments}
          disabled={isSubmitting}
          className="flex-1 sm:flex-initial"
        >
          {t("drawer.back")}
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          onClick={handleBackToZones || handleBackToDepartments}
          disabled={isSubmitting}
          className="flex-1 sm:flex-initial"
        >
          {t("drawer.backToZones")}
        </Button>
      )}

      {/* Action buttons on the right */}
      {currentStep === 1 ? (
        <Button
          variant="primary"
          size="sm"
          icon={ArrowRight}
          iconPosition="right"
          onClick={handleProceedToZones}
          disabled={isSubmitting}
          className="flex-1 sm:flex-initial !bg-blue-900 hover:!bg-blue-950 !text-white font-semibold disabled:!opacity-40 disabled:!cursor-not-allowed"
        >
          {t("drawer.next")}
        </Button>
      ) : currentStep === 2 ? (
        <Button
          variant="primary"
          size="sm"
          icon={ArrowRight}
          iconPosition="right"
          onClick={handleProceedToStages}
          disabled={isSubmitting}
          className="flex-1 sm:flex-initial !bg-blue-900 hover:!bg-blue-950 !text-white font-semibold disabled:!opacity-40 disabled:!cursor-not-allowed"
        >
          {t("drawer.nextToStages")}
        </Button>
      ) : (
        renderSaveButton()
      )}
    </div>
  );
});
