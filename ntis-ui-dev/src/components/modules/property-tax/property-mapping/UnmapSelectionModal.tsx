/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Trash2, X, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/common";
import { MappingLink } from "@/types/property-mapping";

interface UnmapSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapping: MappingLink | null;
  onConfirmUnmap: (selectedPropNos: string[]) => void;
  isSubmitting?: boolean;
}

export function UnmapSelectionModal({
  isOpen,
  onClose,
  mapping,
  onConfirmUnmap,
  isSubmitting = false,
}: UnmapSelectionModalProps) {
  const t = useTranslations("propertyMapping");
  const [deselectedProps, setDeselectedProps] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDeselectedProps([]);
    }
  }, [isOpen, mapping]);

  if (!isOpen || !mapping) return null;

  const oldPropNos = mapping.oldPropNos || [];
  const isMultiple = oldPropNos.length > 1;

  const selectedProps = oldPropNos.filter((p) => !deselectedProps.includes(p));

  const handleToggle = (propNo: string) => {
    setDeselectedProps((prev) =>
      prev.includes(propNo)
        ? prev.filter((p) => p !== propNo)
        : [...prev, propNo]
    );
  };

  const handleSelectAll = () => {
    if (selectedProps.length === oldPropNos.length) {
      setDeselectedProps([...oldPropNos]);
    } else {
      setDeselectedProps([]);
    }
  };

  const handleConfirm = () => {
    if (selectedProps.length === 0) return;
    onConfirmUnmap(selectedProps);
  };

  const isAllSelected = selectedProps.length === oldPropNos.length && oldPropNos.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-scale-up">
        {/* Header with Red Icon */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {isMultiple
                  ? t("dialogs.unmapSelection.title")
                  : t("dialogs.unmapProperty.title")}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t("dialogs.unmapSelection.surveyProperty")}{" "}
                <span className="font-bold text-blue-700 font-mono">
                  {mapping.newPropNo}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            {isMultiple
              ? t("dialogs.unmapSelection.multipleDesc", {
                  count: oldPropNos.length,
                })
              : t("dialogs.unmapSelection.singleDesc", {
                  mId: mapping.id,
                  newPropNo: mapping.newPropNo,
                })}
          </p>

          {/* Properties Selection Checklist */}
          {isMultiple && (
            <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-700">
                <span>
                  {t("dialogs.unmapSelection.recordsHeader", {
                    selected: selectedProps.length,
                    total: oldPropNos.length,
                  })}
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:text-blue-800 text-[11px] underline cursor-pointer"
                >
                  {isAllSelected
                    ? t("dialogs.unmapSelection.deselectAll")
                    : t("dialogs.unmapSelection.selectAll")}
                </button>
              </div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {oldPropNos.map((propNo) => {
                  const isChecked = selectedProps.includes(propNo);
                  return (
                    <div
                      key={propNo}
                      onClick={() => handleToggle(propNo)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all duration-150 ${
                        isChecked
                          ? "bg-rose-50/80 border-rose-200 text-rose-900 font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-xs font-mono font-bold">
                        {isChecked ? (
                          <CheckSquare
                            size={16}
                            className="text-rose-600 shrink-0"
                          />
                        ) : (
                          <Square
                            size={16}
                            className="text-slate-400 shrink-0"
                          />
                        )}
                        <span>{propNo}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold bg-white/70 border border-slate-200">
                        {isChecked
                          ? t("dialogs.unmapSelection.toUnmap")
                          : t("dialogs.unmapSelection.keep")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold rounded-xl"
          >
            {t("dialogs.unmapSelection.cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            disabled={selectedProps.length === 0 || isSubmitting}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
          >
            {isSubmitting
              ? t("dialogs.unmapSelection.unmapping")
              : isMultiple
              ? t("dialogs.unmapSelection.unmapSelected", {
                  count: selectedProps.length,
                })
              : t("dialogs.unmapProperty.confirmText")}
          </Button>
        </div>
      </div>
    </div>
  );
}
