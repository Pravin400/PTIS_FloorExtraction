import { Select, Input, Button, Label, Badge } from "@/components/common";
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, MapPin, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ExistingAssetEntry, ExistingAssetSectionProps } from "@/types/asset/municipal-Asset/new-add-new-asset/add-new-asset.types";

function StepBadge({ step, done, locked }: { step: number; done: boolean; locked?: boolean }) {
  const t = useTranslations("newAddNewAsset");
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className={`inline-flex size-5 items-center justify-center rounded-full text-[10px] font-black transition-colors ${
        done ? "bg-emerald-500 text-white" : locked ? "bg-slate-200 text-slate-400" : "bg-blue-600 text-white"
      }`}>
        {done ? "✓" : step}
      </span>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${
        done ? "text-emerald-600" : locked ? "text-slate-400" : "text-slate-500"
      }`}>
        {step === 1 ? t("steps.zone") : step === 2 ? t("steps.ward") : t("steps.search")}
      </span>
    </div>
  );
}

function AssetResultRow({
  asset, selected, onSelect,
}: {
  asset: ExistingAssetEntry; selected: boolean; onSelect: () => void;
}) {
  const badgeVariant = (() => {
    const cat = asset.categoryName.toLowerCase();
    if (cat.includes("build")) return "default";
    if (cat.includes("land") || cat.includes("plot")) return "success";
    if (cat.includes("vehicle")) return "warning";
    return "secondary";
  })();

  return (
    <Button
      variant="ghost"
      onClick={onSelect}
      className={`!w-full !p-0 !h-auto !rounded-xl !border !transition-all group [&>span]:w-full ${
        selected ? "!border-violet-400 !bg-violet-50 shadow-sm" : "!border-slate-200 !bg-white hover:!border-violet-300 hover:!bg-violet-50/40 hover:!text-slate-600"
      }`}
    >
      <div className="w-full flex items-start justify-between px-3.5 py-3 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-black tracking-wide font-mono ${selected ? "text-violet-700" : "text-slate-800"}`}>{asset.assetNo}</span>
            {asset.categoryName && <Badge variant={badgeVariant} size="sm" className="uppercase tracking-wide">{asset.categoryName}</Badge>}
          </div>
          <p className={`text-[11px] font-semibold mt-0.5 truncate ${selected ? "text-violet-600" : "text-slate-600"}`}>{asset.assetName}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {asset.typeName && <span className="text-[10px] text-slate-400 font-medium">{asset.typeName}</span>}
            {(asset.wardName || asset.zoneName) && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-[10px] text-slate-400">{[asset.wardName, asset.zoneName].filter(Boolean).join(", ")}</span>
              </>
            )}
          </div>
          {asset.address && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{asset.address}</p>}
        </div>
        <div className="ml-2 flex-shrink-0 mt-1">
          {selected ? <CheckCircle2 className="size-4 text-violet-500" /> : <ChevronRight className="size-4 text-slate-300 group-hover:text-violet-400 transition-colors" />}
        </div>
      </div>
    </Button>
  );
}

export function ExistingAssetSection({
  zones,
  wards,
  selectedZoneId,
  setSelectedZoneId,
  selectedWardId,
  setSelectedWardId,
  assetSearch,
  setAssetSearch: _setAssetSearch,
  handleAssetSearchChange,
  assetResults,
  setAssetResults,
  totalCount,
  setTotalCount,
  selectedAsset,
  setSelectedAsset,
  isAssetLoading,
  canSearch,
}: ExistingAssetSectionProps) {
  const t = useTranslations("newAddNewAsset");

  const zoneOptions = zones.map((z) => ({
    label: z.zoneName || z.ZoneName || `Zone ${z.zoneNo || z.ZoneNo}`,
    value: z.id.toString(),
  }));

  const wardOptions = wards
    .filter((w) => !selectedZoneId || w.zoneId == null || String(w.zoneId) === String(selectedZoneId))
    .map((w) => ({
      label: w.wardName || w.WardName || `Ward ${w.wardNo || w.WardNo}`,
      value: w.id.toString(),
    }));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-1">
        <StepBadge step={1} done={!!selectedZoneId} />
        <Select
          label={t("fields.zone.label")}
          name="zone"
          value={selectedZoneId?.toString() ?? ""}
          onChange={(e) => {
            setSelectedZoneId(e.target.value ? Number(e.target.value) : null);
            setSelectedWardId(null);
            handleAssetSearchChange("");
            setAssetResults([]);
            setTotalCount(0);
            setSelectedAsset(null);
          }}
          options={zoneOptions}
          placeholder={t("fields.zone.placeholder")}
          required
        />
      </div>

      <div className={`space-y-1 transition-opacity duration-200 ${selectedZoneId ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        <StepBadge step={2} done={!!selectedWardId} locked={!selectedZoneId} />
        <Select
          label={t("fields.ward.label")}
          name="ward"
          value={selectedWardId?.toString() ?? ""}
          onChange={(e) => {
            setSelectedWardId(e.target.value ? Number(e.target.value) : null);
            handleAssetSearchChange("");
            setAssetResults([]);
            setTotalCount(0);
            setSelectedAsset(null);
          }}
          options={wardOptions}
          placeholder={selectedZoneId ? t("fields.ward.placeholder") : t("fields.ward.disabledPlaceholder")}
          disabled={!selectedZoneId}
          required
        />
      </div>

      <div className={`space-y-1 transition-opacity duration-200 ${canSearch ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        <StepBadge step={3} done={!!selectedAsset} locked={!canSearch} />
        <div className="space-y-1.5">
          <Label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
            {t("fields.search.label")}
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              naked
              type="text"
              value={assetSearch}
              disabled={!canSearch}
              onChange={(e) => {
                handleAssetSearchChange(e.target.value);
                setSelectedAsset(null);
              }}
              placeholder={canSearch ? t("fields.search.placeholder") : t("fields.search.disabledPlaceholder")}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition disabled:bg-slate-50 disabled:text-slate-400"
            />
            {assetSearch && (
              <Button
                variant="ghost"
                onClick={() => { handleAssetSearchChange(""); setSelectedAsset(null); }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:bg-transparent p-1.5 h-auto"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {!canSearch && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="size-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-medium text-amber-700 leading-snug">
            {t("notifications.selectZoneAndWard")}
          </p>
        </div>
      )}

      {canSearch && !assetSearch.trim() && !isAssetLoading && (
        <div className="flex items-start gap-2.5 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
          <Search className="size-4 text-violet-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-medium text-violet-600 leading-snug">
            {t("notifications.typeSearchTerm")}
          </p>
        </div>
      )}

      {canSearch && !!assetSearch.trim() && isAssetLoading && (
        <div className="flex items-center justify-center py-6 text-slate-400">
          <Loader2 className="size-4 animate-spin mr-2" />
          <span className="text-sm">{t("loading.searching")}</span>
        </div>
      )}

      {canSearch && !!assetSearch.trim() && !isAssetLoading && assetResults.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {t("search.resultsSummary", { count: assetResults.length, total: totalCount, term: assetSearch })}
            </p>
            {totalCount > assetResults.length && (
              <span className="text-[10px] text-violet-500 font-semibold">{t("search.refinePrompt")}</span>
            )}
          </div>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {assetResults.map((asset) => (
              <AssetResultRow
                key={asset.id}
                asset={asset}
                selected={selectedAsset?.id === asset.id}
                onSelect={() => setSelectedAsset((prev: ExistingAssetEntry | null) => prev?.id === asset.id ? null : asset)}
              />
            ))}
          </div>
        </div>
      )}

      {canSearch && !!assetSearch.trim() && !isAssetLoading && assetResults.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
          <MapPin className="size-5 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500">{t("search.noAssetsTitle")}</p>
          <p className="mt-1 text-xs text-slate-400">{t("search.noAssetsSubtitle", { term: assetSearch })}</p>
        </div>
      )}

      {selectedAsset && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-800">{t("notifications.assetSelected")}</p>
            <p className="text-[11px] font-mono font-semibold text-emerald-700 mt-0.5">{selectedAsset.assetNo}</p>
            <p className="text-[10px] text-emerald-600 truncate">{selectedAsset.assetName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
