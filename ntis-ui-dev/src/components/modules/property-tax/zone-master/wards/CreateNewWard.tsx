"use client";

import { useTranslations } from "next-intl";
import { Map } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { WardFormFields } from "./WardFormFields";
import { CancelButton, SaveButton, ToggleSwitch, Input, ValidationMessage } from "@/components/common";
import { ZoneItem } from "@/types/zoneMaster.types";
import { WardItem } from "@/types/wardMaster.types";
import { useCreateWard } from "@/hooks/zoneMaster/useCreateWard";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: (newWardNo: string) => void;
  currentZone?: ZoneItem | null;
  existingWards?: WardItem[];
}

export default function CreateNewWard({ open, onClose, onSuccess, currentZone, existingWards = [] }: Props) {
  const t = useTranslations("zoneMaster");
  const zoneAlias = useAliasLabel("Zone", t("defaults.zone"));
  const wardAlias = useAliasLabel("Ward", t("defaults.ward"));
  const wardsAlias = useAliasLabel("Wards", t("defaults.wards"));

  const {
    bulkMode,
    form,
    setForm,
    loading,
    errors,
    bulkErrors,
    setBulkErrors,
    bulkFrom,
    setBulkFrom,
    bulkTo,
    setBulkTo,
    bulkPrefix,
    setBulkPrefix,
    handleBulkToggle,
    handleClose,
    handleSave,
    setErrors,
  } = useCreateWard({
    currentZone,
    existingWards,
    onClose,
    onSuccess,
    zoneAlias,
    wardAlias,
    wardsAlias,
    t: (key: string, values?: Record<string, unknown>) => t(key, values as never),
  });

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Map size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">
              {t("wardList.createWard", { ward: wardAlias })}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {t("wardList.createWardSubtitle", { ward: wardAlias })}
            </div>
          </div>
        </div>
      }
      width="md"
      footer={
        <>
          <CancelButton onClick={handleClose} disabled={loading} />
          <SaveButton
            onClick={handleSave}
            isLoading={loading}
            label={loading ? t("actions.saving") : t("actions.save")}
          />
        </>
      }
    >
      <div className="space-y-6 bg-[#F8FAFF] p-5 h-full overflow-y-auto">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-sm font-semibold text-slate-800">
              {t("wardBulk.title")}
            </div>
            <div className="text-xs text-slate-500">
              {t("wardBulk.subtitle", { wards: wardsAlias })}
            </div>
          </div>
          <ToggleSwitch
            checked={bulkMode}
            onChange={handleBulkToggle}
            showPopup={false}
            activeLabel={t("wardBulk.toggleOn")}
            inactiveLabel={t("wardBulk.toggleOff")}
          />
        </div>

        {bulkMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="text-sm font-medium text-slate-700 mb-1">
                  {t("wardBulk.prefix")}
                </div>
                <Input
                  placeholder={t("wardBulk.placeholders.prefix")}
                  disabled={loading}
                  value={bulkPrefix}
                  required
                  onChange={(e) => {
                    setBulkPrefix(e.target.value);
                    if (bulkErrors.prefix) setBulkErrors((prev) => ({ ...prev, prefix: undefined }));
                  }}
                />
                {bulkErrors.prefix && (
                  <ValidationMessage message={bulkErrors.prefix} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-slate-700 mb-1">
                  {t("wardBulk.rangeFrom", { ward: wardAlias })}
                </div>
                <Input
                  placeholder={t("wardBulk.placeholders.rangeFrom")}
                  disabled={loading}
                  value={bulkFrom}
                  onChange={(e) => {
                    setBulkFrom(e.target.value);
                    if (bulkErrors.rangeFrom) setBulkErrors((prev) => ({ ...prev, rangeFrom: undefined }));
                  }}
                />
                {bulkErrors.rangeFrom && (
                  <ValidationMessage message={bulkErrors.rangeFrom} />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700 mb-1">
                  {t("wardBulk.rangeTo", { ward: wardAlias })}
                </div>
                <Input
                  placeholder={t("wardBulk.placeholders.rangeTo")}
                  disabled={loading}
                  value={bulkTo}
                  onChange={(e) => {
                    setBulkTo(e.target.value);
                    if (bulkErrors.rangeTo) setBulkErrors((prev) => ({ ...prev, rangeTo: undefined }));
                  }}
                />
                {bulkErrors.rangeTo && (
                  <ValidationMessage message={bulkErrors.rangeTo} />
                )}
              </div>
            </div>

            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
              {t("wardBulk.helperRangeInfo", {
                wards: wardsAlias,
                example: `${bulkPrefix || "prefix"}${bulkFrom || "40"} to ${bulkPrefix || "prefix"}${bulkTo || "44"}`
              })}
            </div>

            <WardFormFields
              data={form}
              onChange={setForm}
              mode="add"
              disabled={loading}
              errors={errors}
              showSequence={false}
              showBasicFields={false}
              showActiveStatus={false}
            />
          </div>
        ) : (
          <WardFormFields
            data={form}
            onChange={(v) => {
              setForm(v);
              const newErrors = { ...errors };
              if (v.wardNo !== form.wardNo) delete newErrors.wardNo;
              if (v.description !== form.description) delete newErrors.description;
              setErrors(newErrors);
            }}
            mode="add"
            disabled={loading}
            errors={errors}
            showSequence={false}
            showActiveStatus={false}
          />
        )}
      </div>
    </Drawer>
  );
}
