"use client";

import { Droplets } from "lucide-react";
import { CancelButton, SaveButton } from "@/components/common";
import { Drawer } from "@/components/common/Drawer";
import { useTranslations } from "next-intl";
import type {
  WaterConnection,
  WaterConnectionTypeLookup,
  WaterConnectionSizeLookup,
  WaterConnectionStatusLookup,
  WaterRateMasterLookup,
  WaterConnectionFormModel,
} from "@/types/water-connection.types";
import { StatusToggleCard } from "../taxzonemaster/StatusToggleCard";
import { MandatoryFieldsNotice } from "../taxzonemaster/MandatoryFieldsNotice";
import { ConnectionFormFields } from "./ConnectionFormFields";
import { useConnectionForm } from "./hooks/useConnectionForm";

interface AddConnectionDrawerProps {
  open: boolean;
  propertyId: number;
  editingConnection: WaterConnection | null;
  typeOptions: WaterConnectionTypeLookup[];
  sizeOptions: WaterConnectionSizeLookup[];
  statusOptions: WaterConnectionStatusLookup[];
  rateMasters: WaterRateMasterLookup[];
  onClose: () => void;
  onSaved: () => void;
  saveWaterConnectionAction: (data: WaterConnectionFormModel) => Promise<{ ok: boolean; error?: string }>;
}

export function AddConnectionDrawer({
  open,
  propertyId,
  editingConnection,
  typeOptions: initialTypeOptions,
  sizeOptions: initialSizeOptions,
  statusOptions: initialStatusOptions,
  rateMasters: initialRateMasters,
  onClose,
  onSaved,
  saveWaterConnectionAction,
}: AddConnectionDrawerProps) {
  const t = useTranslations("waterConnection");
  const tCommon = useTranslations("common");

  const {
    isEdit,
    formData,
    errors,
    isSubmitting,
    typeOptions,
    sizeOptions,
    statusOptions,
    applicableRate,
    rateError,
    showError,
    handleChange,
    handleSelectChange,
    handleBlur,
    handleToggleStatus,
    handleSubmit,
  } = useConnectionForm({
    open,
    propertyId,
    editingConnection,
    initialTypeOptions,
    initialSizeOptions,
    initialStatusOptions,
    initialRateMasters,
    t,
    onSaved,
    onClose,
    saveWaterConnectionAction,
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      className="border-l-4 border-[#4F6A94]"
      width="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white">
            <Droplets size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("form.editTitle") : t("form.addTitle")}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("form.editSubtitle") : t("form.subtitle")}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton label={t("form.actions.cancel")} onClick={onClose} />
          <SaveButton
            label={isEdit ? t("form.actions.update") : t("form.actions.add")}
            type="submit"
            form="wc-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="wc-form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
        {isEdit && (
          <StatusToggleCard
            isActive={formData.isActive}
            onToggle={handleToggleStatus}
            activeLabel={t("form.status.active")}
            inactiveLabel={t("form.status.inactive")}
            statusLabel={t("form.status.label")}
          />
        )}

        <ConnectionFormFields
          formData={formData}
          errors={errors}
          showError={showError}
          onChange={handleChange}
          onSelectChange={handleSelectChange}
          onBlur={handleBlur}
          typeOptions={typeOptions}
          sizeOptions={sizeOptions}
          statusOptions={statusOptions}
          applicableRate={applicableRate}
          rateError={rateError}
          t={t}
        />

        <MandatoryFieldsNotice message={tCommon("note.mandatory")} />
      </form>
    </Drawer>
  );
}
