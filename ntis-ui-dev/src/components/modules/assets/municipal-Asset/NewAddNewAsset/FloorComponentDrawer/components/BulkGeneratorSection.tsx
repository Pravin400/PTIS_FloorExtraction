import { Sparkles, Plus } from "lucide-react";
import { SearchSelect, Input, Button } from "@/components/common";
import { useTranslations } from "next-intl";
import type { BulkGeneratorSectionProps } from "@/types/asset/floor-details.types";

export function BulkGeneratorSection({
  bulkType, setBulkType,
  bulkPrefix, setBulkPrefix,
  bulkStartNum, setBulkStartNum,
  bulkCount, setBulkCount,
  handleGenerateBulk
}: BulkGeneratorSectionProps) {
  const t = useTranslations("addAssetForm");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <Sparkles className="size-3.5 text-amber-500" />
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t("floorDetails.bulkGenerateUnits")}
        </h3>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <SearchSelect
          name="bulkType"
          label={t("floorDetails.type") || "Type"}
          options={[
            { label: t("floorDetails.flat") || "Flat", value: "Flat" },
            { label: t("floorDetails.shop") || "Shop", value: "Shop" },
            { label: t("floorDetails.room") || "Room", value: "Room" },
            { label: t("floorDetails.office") || "Office", value: "Office" },
          ]}
          value={bulkType}
          onChange={(_n, v) => {
            setBulkType(v);
            setBulkPrefix(v.toUpperCase() + "-");
          }}
          placeholder={t("floorDetails.selectType") || "Select Type"}
          className="h-8 text-xs"
        />
        <Input
          label={t("floorDetails.prefix") || "Prefix"}
          value={bulkPrefix}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkPrefix(e.target.value)}
          className="h-8 text-xs px-2"
        />
        <Input
          label={t("floorDetails.startNum") || "Start #"}
          type="number"
          min={1}
          value={bulkStartNum === 0 ? "" : bulkStartNum}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkStartNum(Math.max(1, Number(e.target.value)))}
          className="h-8 text-xs px-2"
        />
        <Input
          label={t("floorDetails.count") || "Count"}
          type="number"
          min={1}
          value={bulkCount === 0 ? "" : bulkCount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkCount(Math.max(1, Number(e.target.value)))}
          className="h-8 text-xs px-2 font-bold text-blue-600"
        />
      </div>
      <div className="flex justify-end pt-1">
        <Button onClick={handleGenerateBulk} size="sm" icon={Plus} 
          className="text-[10px] font-black uppercase tracking-wider">
          {t("floorDetails.generateUnitsCount", { count: bulkCount })}
        </Button>
      </div>
    </div>
  );
}
