import React from "react";
import { useTranslations } from "next-intl";
import { SaveButton, CancelButton } from "@/components/common";

interface RoomSubmissionFooterProps {
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
  canSave: boolean;
}

export const RoomSubmissionFooter: React.FC<RoomSubmissionFooterProps> = ({
  onSave, onClose, isSaving, canSave
}) => {
  const t = useTranslations("quickDataEntry");

  return (
    <div className="flex justify-center gap-3 p-4 border-t border-gray-200 bg-white rounded-b-2xl">
      <SaveButton
        id="btn-room-save-data"
        onClick={onSave}
        disabled={!canSave || isSaving}
        isLoading={isSaving}
        label={isSaving ? t("roomSubmission.updating") : t("roomSubmission.saveData")}
        className="px-10 h-10 font-bold"
        onKeyDown={(e) => {
          if (e.key === 'Tab' && e.shiftKey) {
            const allDeleteBtns = document.querySelectorAll('.room-delete-btn');
            if (allDeleteBtns.length > 0) {
              e.preventDefault();
              (allDeleteBtns[allDeleteBtns.length - 1] as HTMLElement).focus();
            }
          }
        }}
      />
      <CancelButton
        id="btn-room-close"
        onClick={onClose}
        label={t("roomSubmission.close")}
        className="px-8 h-10 font-semibold"
        onKeyDown={(e) => {
          if (e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            const roomNoInput = document.getElementById("room-no-input");
            if (roomNoInput) {
              (roomNoInput as HTMLElement).focus();
            }
          }
        }}
      />
    </div>
  );
};
