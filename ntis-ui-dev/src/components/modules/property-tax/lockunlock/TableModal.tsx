import React from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { Drawer, Checkbox, CancelButton, SaveButton } from "@/components/common";
import { LockedScreen, LockUnlockPropertyItem } from "@/types/lockunlock.types";
import { cn } from "@/lib/utils/cn";
import { useTranslations } from "next-intl";

interface TableModalProps {
  editModal: {
    isOpen: boolean;
    property: LockUnlockPropertyItem | null;
    selectedScreenIds: number[];
  };
  setEditModal: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    property: LockUnlockPropertyItem | null;
    selectedScreenIds: number[];
  }>>;
  screens: LockedScreen[];
  handleSaveIndividualLock: () => Promise<void> | void;
  isPending: boolean;
}

export interface TableModalRef {
  focusFirstCheckbox: () => void;
}

export const TableModal = React.forwardRef<TableModalRef, TableModalProps>(
  ({
    editModal,
    setEditModal,
    screens = [],
    handleSaveIndividualLock,
    isPending,
  }, ref) => {
    const t = useTranslations("lockUnlock");
    const firstDivRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => ({
      focusFirstCheckbox: () => {
        firstDivRef.current?.focus();
      },
    }));

    const handleToggleScreen = (screenId: number) => {
      setEditModal((prev) => ({
        ...prev,
        selectedScreenIds: prev.selectedScreenIds.includes(screenId)
          ? prev.selectedScreenIds.filter((id) => id !== screenId)
          : [...prev.selectedScreenIds, screenId],
      }));
    };

    if (!editModal.isOpen || !editModal.property) return null;

    return (
      <Drawer
        open={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, property: null, selectedScreenIds: [] })}
        title={
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">
              {t("manageModal.title", {
                propertyNo: `${editModal.property.propertyNo}${editModal.property.partitionNo ? ` - ${editModal.property.partitionNo}` : ""
                  }`
              })}
            </h2>
          </div>
        }
        width="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <CancelButton
            label={t("manageModal.cancel")}
              size="sm"
              onClick={() => setEditModal({ isOpen: false, property: null, selectedScreenIds: [] })}
            />
          
            <SaveButton
              label={t("manageModal.saveChanges")}
              size="sm"
              onClick={handleSaveIndividualLock}
              isLoading={isPending}
            />
              
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            {t("manageModal.description")}
          </p>
          <div className="space-y-3 pt-2">
            {screens.map((screen, index) => {
              const isChecked = editModal.selectedScreenIds.includes(screen.id);
              return (
                <div
                  key={screen.id}
                  ref={index === 0 ? firstDivRef : undefined}
                  tabIndex={0}
                  role="checkbox"
                  aria-checked={isChecked}
                  onClick={() => handleToggleScreen(screen.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggleScreen(screen.id);
                    }
                  }}
                  className={cn(
                    "text-slate-500 flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    isChecked ? "border-red-200 bg-red-50/10" : "border-slate-200/90 bg-white"
                  )}
                >
                  <div className="flex-1">
                    <Checkbox
                      id={`modal-screen-${screen.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        setEditModal((prev) => ({
                          ...prev,
                          selectedScreenIds: checked
                            ? [...prev.selectedScreenIds, screen.id]
                            : prev.selectedScreenIds.filter((id) => id !== screen.id),
                        }));
                      }}
                      label={screen.screenName}
                    />
                  </div>
                  {isChecked && <Lock className="w-4 h-4 text-red-500 mr-1" />}
                </div>
              );
            })}
          </div>
        </div>
      </Drawer>
    );
  }
);

TableModal.displayName = "TableModal";