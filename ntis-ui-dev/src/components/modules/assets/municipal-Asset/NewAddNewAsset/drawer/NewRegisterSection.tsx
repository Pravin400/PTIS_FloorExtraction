import React from "react";
import { SearchSelect } from "@/components/common";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { NewRegisterSectionProps } from "@/types/asset/municipal-Asset/new-add-new-asset/add-new-asset.types";
import { withSelectPlaceholder } from "@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils";
import { isEntityActive } from "@/lib/utils/asset-utils/new-add-new-asset/active-filter.utils";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">{children}</h3>;
}

export function NewRegisterSection({
  categories,
  types,
  newData,
  setNewData,
  canSubmitNew,
  onCategoryChange,
}: NewRegisterSectionProps) {
  const t = useTranslations("newAddNewAsset");

  const activeCategories = React.useMemo(() => {
    return (categories || []).filter(isEntityActive);
  }, [categories]);

  const activeTypes = React.useMemo(() => {
    return (types || []).filter(isEntityActive);
  }, [types]);

  const categoryOptions = activeCategories.length > 0
    ? withSelectPlaceholder(
        activeCategories.map((c) => {
          const label = c.categoryName || "Unknown Category";
          return { label, value: label };
        })
      )
    : [];

  const typeOptions = activeTypes.length > 0
    ? withSelectPlaceholder(
        activeTypes.map((t) => {
          const label = t.assetTypeName || t.typeName || "Unknown Type";
          return { label, value: label };
        })
      )
    : [];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
      <SectionLabel>{t("sections.newAsset.title")}</SectionLabel>

      <div className="space-y-4">
        <SearchSelect
          label={t("fields.category.label")}
          name="category"
          value={newData.category}
          onChange={(_name, value) => {
            const cat = activeCategories.find((c) => {
              const cName = c.categoryName;
              return cName === value;
            });
            const nextCategoryId = cat?.id ?? null;
            setNewData({ category: value, assetType: "", categoryId: nextCategoryId, typeId: null });
            onCategoryChange?.(nextCategoryId);
          }}
          required
          options={categoryOptions}
          placeholder={t("fields.category.placeholder")}
        />
        <SearchSelect
          label={t("fields.type.label")}
          name="assetType"
          value={newData.assetType}
          onChange={(_name, value) => {
            const typ = activeTypes.find((t) => {
              const label = t.assetTypeName || t.typeName || "";
              return label === value;
            });
            setNewData((prev) => ({ ...prev, assetType: value, typeId: typ?.id ?? null }));
          }}
          required
          options={typeOptions}
          placeholder={typeOptions.length ? t("fields.type.placeholder") : t("fields.type.disabledPlaceholder")}
          disabled={!typeOptions.length}
        />
      </div>

      {canSubmitNew && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 animate-in fade-in duration-300">
          <CheckCircle2 className="size-4 flex-shrink-0 text-emerald-500" />
          <span>{t("notifications.readyToRegister", { category: newData.category, type: newData.assetType })}</span>
        </div>
      )}
    </div>
  );
}
