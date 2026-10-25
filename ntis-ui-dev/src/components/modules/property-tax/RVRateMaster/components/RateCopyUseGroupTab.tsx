"use client";

import { Users, CheckCircle } from "lucide-react";
import { SearchSelect } from "@/components/common/SearchSelect";
import { Button } from "@/components/common/ActionButton";
import { Label } from "@/components/common/label";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import type { ISelectOption } from "@/types/RVRateMaster";

interface RateCopyUseGroupTabProps {
  sourceUseGroup: string;
  setSourceUseGroup: (value: string) => void;
  useGroupOptions: ISelectOption[];
  selectedUseGroup: string;
  onCopyRates: () => void;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

export function RateCopyUseGroupTab({
  sourceUseGroup,
  setSourceUseGroup,
  useGroupOptions,
  selectedUseGroup,
  onCopyRates,
  t,
}: RateCopyUseGroupTabProps) {
  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
          <Users size={16} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800">{t('sections.copyRatesUseGroupTitle', { use: useLabel })}</h4>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-auto">
          <Label htmlFor="source-use-group-select" className="text-xs font-medium text-gray-700 mb-1 block">
            {t('sections.selectSourceUseGroup', { use: useLabel })}
          </Label>
          <SearchSelect
            id="source-use-group-select"
            name="sourceUseGroup"
            label=""
            options={useGroupOptions.filter(
              (opt) => !selectedUseGroup || opt.value !== selectedUseGroup
            )}
            placeholder={t('placeholders.selectUseGroup', { use: useLabel, typeOfUse: typeOfUseLabel })}
            value={sourceUseGroup}
            onChange={(_name, value) => setSourceUseGroup(value)}
            className="text-black"
          />
        </div>

        <Button
          type="button"
          onClick={onCopyRates}
          disabled={!sourceUseGroup}
          className="h-8 px-2 text-xs font-semibold rounded-lg flex items-center gap-5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-all min-w-30 justify-center"
        >
          <CheckCircle size={13} className="inline-block" />
          <span className="inline-block leading-none">{t('buttons.copyRatesNow')}</span>
        </Button>
      </div>
    </div>
  );
}
