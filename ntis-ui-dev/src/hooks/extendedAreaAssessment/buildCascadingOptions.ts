import type { useTranslations } from "next-intl";
import type { WardDropdownOption, WardPropertyOptionDto } from "@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action";
import type { SelectOption } from "@/types/extended-area-assessment.types";

type Translator = ReturnType<typeof useTranslations>;

export function buildWardOptions(wards: WardDropdownOption[], isLoadingWards: boolean, t: Translator): SelectOption[] {
  return [
    { label: isLoadingWards ? t("dropdowns.loadingWards") : t("dropdowns.selectWard"), value: "" },
    ...wards.map((w) => ({
      label: w.wardNo || String(w.id),
      value: String(w.id),
    })),
  ];
}

/** Builds the combined "Property No" dropdown — one option per property/partition row, bound by
 *  `propertyId`, labeled "10" for a plain property or "10-A6" for one of its partitions — so
 *  there's no separate Partition No dropdown to pick afterward. */
export function buildWardPropertyOptions(
  items: WardPropertyOptionDto[],
  selectedWardId: string,
  isLoadingProperties: boolean,
  t: Translator
): SelectOption[] {
  return [
    {
      label: !selectedWardId
        ? t("dropdowns.selectWardFirst")
        : isLoadingProperties
        ? t("dropdowns.loadingProperties")
        : t("dropdowns.selectPropertyNo"),
      value: "",
    },
    ...items.map((item) => ({
      label: item.partitionNo ? `${item.propertyNo}-${item.partitionNo}` : item.propertyNo,
      value: String(item.propertyId),
    })),
  ];
}
