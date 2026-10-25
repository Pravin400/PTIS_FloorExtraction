import { useTranslations } from "next-intl";
import { CheckSquare, CheckCircle2, X } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton, Input, ToggleSwitch, ValidationMessage, MandatoryNote } from "@/components/common";
import { MeterTestStatus } from "@/types/water-bill/meter-test-status-master.types";
import { useMeterTestStatusForm } from "@/hooks/water-bill/meter-test-status-master/useMeterTestStatusForm";
import { cn } from "@/lib/utils/cn";

export interface MeterTestStatusFormProps {
  id: number | null;
  initialData?: MeterTestStatus;
}

export function MeterTestStatusForm(props: MeterTestStatusFormProps) {
  const t = useTranslations("meterTestStatusMaster");

  const {
    isEdit,
    formData,
    errors,
    touched,
    isSubmitting,
    open,
    handleCodeChange,
    handleStatusNameChange,
    handleToggleStatus,
    handleBlur,
    handleSubmit,
    handleCancel,
  } = useMeterTestStatusForm({
    id: props.id,
    initialData: props.initialData,
    onSuccess: () => {},
    onCancel: () => {},
  });

  return (
    <Drawer
      open={open}
      onClose={handleCancel}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white shadow-md">
            <CheckSquare size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">
              {isEdit ? t("drawer.editTitle") : t("drawer.addTitle")}
            </div>
            <div className="text-xs text-slate-500">
              {isEdit ? t("drawer.editSubtitle") : t("drawer.addSubtitle")}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <CancelButton label={t("drawer.buttons.cancel")} onClick={handleCancel} disabled={isSubmitting} />
          <SaveButton
            label={isEdit ? t("drawer.buttons.update") : t("drawer.buttons.save")}
            type="submit"
            form="meter-test-status-form"
            isLoading={isSubmitting}
          />
        </div>
      }
    >
      <form id="meter-test-status-form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5 rounded-2xl border border-slate-200/80">
        {/* Status Toggle Section */}
        {isEdit && (
          <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
            <div
              className={cn(
                "rounded-xl p-3 flex items-center justify-between transition-colors",
                formData.isActive
                  ? "border border-blue-200 bg-[#F0F6FF]"
                  : "border border-gray-200 bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-9 w-9 flex items-center justify-center rounded-full shrink-0",
                    formData.isActive
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-700"
                  )}
                >
                  {formData.isActive ? <CheckCircle2 size={18} /> : <X size={18} />}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{t("drawer.statusToggle.title")}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t("drawer.statusToggle.description", {
                      status: formData.isActive
                        ? t("drawer.statusToggle.active")
                        : t("drawer.statusToggle.inactive"),
                    })}
                  </div>
                </div>
              </div>

              <ToggleSwitch
                checked={formData.isActive}
                onChange={handleToggleStatus}
                showPopup={false}
              />
            </div>
          </div>
        )}

        {/* Form Fields Section */}
        <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
          <div>
            <Input
              name="code"
              label={t("drawer.labels.code")}
              required
              maxLength={15}
              placeholder={t("drawer.placeholders.code")}
              value={formData.code || ""}
              onChange={(e) => handleCodeChange(e.target.value)}
              onBlur={() => handleBlur("code")}
              error={touched.code ? errors.code : undefined}
              disabled={!formData.isActive}
              fullWidth
              className="text-gray-900 font-mono uppercase"
            />
            <ValidationMessage
              message={errors.code}
              visible={Boolean(touched.code && errors.code)}
            />
          </div>

          <div>
            <Input
              name="meterTestStatus"
              label={t("drawer.labels.name")}
              required
              maxLength={30}
              placeholder={t("drawer.placeholders.name")}
              value={formData.meterTestStatus || ""}
              onChange={(e) => handleStatusNameChange(e.target.value)}
              onBlur={() => handleBlur("meterTestStatus")}
              error={touched.meterTestStatus ? errors.meterTestStatus : undefined}
              disabled={!formData.isActive}
              fullWidth
              className="text-gray-900 font-medium"
            />
            <ValidationMessage
              message={errors.meterTestStatus}
              visible={Boolean(touched.meterTestStatus && errors.meterTestStatus)}
            />
          </div>
        </div>

        <MandatoryNote text={t("drawer.mandatoryNote")} />
      </form>
    </Drawer>
  );
}
