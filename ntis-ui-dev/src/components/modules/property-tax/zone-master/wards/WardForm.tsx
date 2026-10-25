"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Map } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton } from "@/components/common";
import { WardItem } from "@/types/wardMaster.types";
import { WardFormFields } from "./WardFormFields";
import { useWardFormLogic } from "@/hooks/zoneMaster/useWardFormLogic";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

// ============================================
// WardForm - Edit Mode Drawer
// ============================================
interface EditModeProps {
  mode: "edit";
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  wardId: string;
  wards?: WardItem[];
  /** SSR pre-fetched ward data - if provided, avoids client-side API call */
  initialData?: WardItem | null;
}

export default function WardForm({ open, onClose, onSuccess, wardId, wards = [], initialData }: EditModeProps) {
  const router = useRouter();
  const t = useTranslations("zoneMaster");
  const wardAlias = useAliasLabel("Ward", t("defaults.ward"));

  const {
    form,
    setForm,
    loading,
    fetching,
    errors,
    handleSave,
  } = useWardFormLogic({
    open,
    wardId,
    wards,
    initialData,
    onClose,
    onSuccess,
    wardAlias,
    t: (key: string, values?: Record<string, unknown>) => t(key, values as never),
  });

  const handleClose = () => {
    onClose();
  };

  const onSave = () => {
    handleSave(() => router.refresh());
  };

  return (
    <Drawer
      open={open}
      width="sm"
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Map size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {form.wardNo ? t("wardForm.editTitleWithWardNo", { wardNo: form.wardNo, ward: wardAlias }) : t("wardForm.editTitle", { ward: wardAlias })}
            </div>
            <div className="text-sm text-slate-500">{t("wardForm.editDescription", { ward: wardAlias })}</div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={t("actions.cancel")}
            onClick={handleClose}
            disabled={loading || fetching}
          />
          <SaveButton
            label={loading ? t("actions.updating") : t("actions.update")}
            onClick={onSave}
            disabled={loading || fetching}
          />
        </>
      }
    >
      <div className="space-y-6 bg-[#F8FAFF] p-5">
        <WardFormFields
          data={form}
          onChange={setForm}
          mode="edit"
          disabled={loading || fetching}
          errors={errors}
        />
      </div>
    </Drawer>
  );
}
