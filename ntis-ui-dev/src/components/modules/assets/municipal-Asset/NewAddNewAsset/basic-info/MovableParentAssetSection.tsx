"use client";

import { Card, CardContent, CardHeader, CardTitle, SearchSelect, Input, Button } from "@/components/common";
import { Building, MapPin, X, Search, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMovableParentAsset } from "@/hooks/asset/municipal-Asset/new-add-new-asset/useMovableParentAsset";
import { MovableParentAssetSectionProps, MovableParentAssetSearchProps } from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";
import type { AssetFloorDetailItem } from "@/types/asset/municipal-Asset/new-add-new-asset/detail-tabs.types";
import type { ParentSubunitLookupItem } from "@/types/asset/municipal-Asset/new-add-new-asset/form-orchestrator.types";
import { withSelectPlaceholder } from "@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils";

export function MovableParentAssetSearch({
  searchTerm,
  setSearchTerm,
  isSearching,
  searchResults,
  handleSelectAsset,
  t,
}: MovableParentAssetSearchProps) {
  return (
    <div className="relative">
      <span className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
        {t("basicInfo.parentSelection.searchParentTitle")}
      </span>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          placeholder={t("basicInfo.parentSelection.parentSearchPlaceholder")}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium h-9 shadow-inner"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="xs"
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 !w-6 !h-6"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {isSearching && (
        <div className="absolute right-9 top-1/2 -translate-y-1/2">
          <Loader2 className="size-4 animate-spin text-slate-400" />
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 z-30 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100 custom-scrollbar animate-in fade-in duration-100">
          {searchResults.map((asset) => (
            <Button
              variant="ghost"
              key={asset.id}
              type="button"
              onClick={() => handleSelectAsset(asset)}
              className="w-full px-3 py-2 flex items-start justify-start text-left hover:bg-slate-50 transition h-auto"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                    {asset.assetNo || `ID: ${asset.id}`}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    {asset.assetTypeName || asset.typeName}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-700 mt-1 truncate">
                  {asset.assetName}
                </h5>
                {asset.address && (
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 whitespace-normal">
                    {asset.address}
                  </p>
                )}
              </div>
            </Button>
          ))}
        </div>
      )}

      {!searchTerm.trim() && (
        <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-none">
          {t("basicInfo.parentSelection.movableSearchPrompt")}
        </p>
      )}
    </div>
  );
}

export function MovableParentAssetSection({
  formData,
  updateFormData,
  initialParentAsset = null,
  initialParentFloors = [],
  initialParentSubunits = [],
}: MovableParentAssetSectionProps) {
  const t = useTranslations("newAddNewAsset");
  const {
    searchTerm,
    handleSearchTermChange,
    searchResults,
    selectedParentAsset,
    isSearching,
    floors,
    subunits,
    isLoadingFloors,
    isLoadingSubunits,
    handleSelectAsset,
    handleClearSelected,
  } = useMovableParentAsset(formData, updateFormData, t, initialParentAsset, initialParentFloors, initialParentSubunits);

  const floorOptions = floors.map((f: AssetFloorDetailItem) => {
    const name = f.floorName || `Floor ${f.floorId || f.id}`;
    const details = f.subFloorName ? ` (${f.subFloorName})` : "";
    return { label: `${name}${details}`, value: String(f.id) };
  });

  const subunitOptions = subunits.map((s: ParentSubunitLookupItem) => {
    const name = s.subunitName || s.name || `Unit ${s.code || s.id}`;
    return { label: name, value: String(s.id) };
  });

  return (
    <Card variant="bordered" className="shadow-sm border-slate-200 bg-white rounded-2xl">
      <CardHeader className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-2 bg-[#F8FAFC]">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-500 p-1.5 rounded-lg text-white shadow-sm flex items-center justify-center">
          <Building className="size-3.5 text-white" />
        </div>
        <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-widest">
          {t("basicInfo.parentSelection.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedParentAsset ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-inner">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black tracking-wide font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {selectedParentAsset.assetNo || `ID: ${selectedParentAsset.id}`}
                  </span>
                  <span className="inline-block rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-600">
                    {selectedParentAsset.assetCategoryName || selectedParentAsset.categoryName || t("basicInfo.parentSelection.parentAsset")}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-1.5 truncate">
                  {selectedParentAsset.assetName}
                </h4>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                  <MapPin className="size-3.5 text-slate-400 shrink-0" />
                  {selectedParentAsset.address || t("basicInfo.parentSelection.noAddress")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="xs"
                type="button"
                onClick={handleClearSelected}
                className="ml-3 p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                title={t("basicInfo.parentSelection.deselectParent")}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SearchSelect
                label={t("basicInfo.parentSelection.floorLevel")}
                name="parentFloorId"
                value={String(formData.attributes?.parentFloorId ?? "")}
                onChange={(_name, value) =>
                  updateFormData({
                    attributes: { ...formData.attributes, parentFloorId: value },
                  })
                }
                options={withSelectPlaceholder(floorOptions)}
                placeholder={isLoadingFloors ? "Loading levels..." : floors.length === 0 ? "Not Exist" : "--Select--"}
                disabled={isLoadingFloors || floors.length === 0}
                className="font-semibold text-sm"
              />

              <SearchSelect
                label={t("basicInfo.parentSelection.subUnitFlatOffice")}
                name="subunitId"
                value={String(formData.attributes?.subunitId ?? "")}
                onChange={(_name, value) =>
                  updateFormData({
                    attributes: { ...formData.attributes, subunitId: value },
                  })
                }
                options={withSelectPlaceholder(subunitOptions)}
                placeholder={isLoadingSubunits ? "Loading units..." : subunits.length === 0 ? "Not Exist" : "--Select--"}
                disabled={isLoadingSubunits || subunits.length === 0}
                className="font-semibold text-sm"
              />

              <Input
                label={t("basicInfo.parentSelection.specificRoom")}
                name="roomNumber"
                value={String(formData.attributes?.roomNumber ?? "")}
                onChange={(e) =>
                  updateFormData({
                    attributes: { ...formData.attributes, roomNumber: e.target.value },
                  })
                }
                placeholder="e.g. Server Room, Room 102"
                className="h-8 text-[13px]"
              />
            </div>
          </div>
        ) : (
          <MovableParentAssetSearch
            searchTerm={searchTerm}
            setSearchTerm={handleSearchTermChange}
            isSearching={isSearching}
            searchResults={searchResults}
            handleSelectAsset={handleSelectAsset}
            t={t}
          />
        )}
      </CardContent>
    </Card>
  );
}
