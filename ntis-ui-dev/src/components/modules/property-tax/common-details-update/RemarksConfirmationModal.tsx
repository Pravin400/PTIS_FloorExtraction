"use client";

import { Modal } from "@/components/common/Modal";
import { CancelButton, Input, SaveButton } from "@/components/common";
import { useState } from "react";

interface RemarksConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => void;
  title?: string;
  t: (key: string) => string;
}

export function RemarksConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  t,
}: RemarksConfirmationModalProps) {
  const [remarks, setRemarks] = useState("");

  const handleClose = () => {
    setRemarks("");
    onClose();
  };

  const handleConfirm = () => {
    if (!remarks.trim()) return;
    onConfirm(remarks.trim());
    setRemarks(""); // Reset for next time
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && remarks.trim()) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title || t("excelUpload.remarksModal.title")}
      footer={
        <>
          <CancelButton
            label={t("excelUpload.remarksModal.cancelBtn")}
            onClick={handleClose}
          />
          <SaveButton
            label={t("excelUpload.remarksModal.confirmBtn")}
            onClick={handleConfirm}
            disabled={!remarks.trim()}
          />
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Input
            required
            label={t("excelUpload.remarksModal.remarkLabel")}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("excelUpload.remarksModal.remarkPlaceholder")}
            className="w-full"
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
}

