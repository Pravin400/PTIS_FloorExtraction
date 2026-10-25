"use client";

import { memo } from "react";
import { MapPin, Check, ChevronRight } from "lucide-react";
import { Badge, Card, SearchInput, SelectAllButton, ClearButton, Button } from "@/components/common";
import { LoadingState } from "@/components/common/LoadingState";
import type { ZoneOption, WardOption } from "@/types/asset-masters/user-department-allocation.types";

interface UserAllocationStep2ZoneWardProps {
  zonesList: ZoneOption[];
  filteredZones: ZoneOption[];
  selectedZoneWards: Record<number, number[]>;
  activeWardZoneId: number | null;
  setActiveWardZoneId: (id: number) => void;
  activeWardZone: ZoneOption | null;
  activeZoneWards: WardOption[];
  filteredActiveZoneWards: WardOption[];
  wardSearch: string;
  setWardSearch: (val: string) => void;
  toggleWardSelection: (zoneId: number, wardId: number) => void;
  selectAllWardsForZone: (zoneId: number) => void;
  clearWardsForZone: (zoneId: number) => void;
  isLoadingWards: boolean;
  totalSelectedWardsCount: number;
  configuredZoneCount: number;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const UserAllocationStep2ZoneWard = memo(function UserAllocationStep2ZoneWard({
  zonesList,
  filteredZones,
  selectedZoneWards,
  activeWardZoneId,
  setActiveWardZoneId,
  activeWardZone,
  activeZoneWards,
  filteredActiveZoneWards,
  wardSearch,
  setWardSearch,
  toggleWardSelection,
  selectAllWardsForZone,
  clearWardsForZone,
  isLoadingWards,
  totalSelectedWardsCount,
  configuredZoneCount,
  t,
}: UserAllocationStep2ZoneWardProps) {
  return (
    <div className="space-y-3.5">
      <div>
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-blue-900" />
          {t("drawer.step2Title")}
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">{t("drawer.wardWiseDescription")}</p>
      </div>

      {/* Summary bar of preserved ward selections across all zones */}
      {totalSelectedWardsCount > 0 && (
        <Card
          variant="default"
          padding="none"
          className="p-3 bg-white border border-blue-200/80 rounded-xl shadow-2xs space-y-2"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 text-xs">
            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {t("drawer.totalWardsAllocatedSummary", {
                  count: totalSelectedWardsCount,
                  zoneCount: configuredZoneCount,
                })}
              </span>
            </span>
            <Badge variant="success" size="sm" className="!font-medium w-fit">
              {t("drawer.preservedAndReady")}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {zonesList
              .filter((z) => (selectedZoneWards[z.id] || []).length > 0)
              .map((z) => {
                const count = (selectedZoneWards[z.id] || []).length;
                const isActive = Number(activeWardZoneId) === Number(z.id);
                return (
                  <Button
                    key={z.id}
                    type="button"
                    size="xs"
                    variant={isActive ? "primary" : "secondary"}
                    onClick={() => setActiveWardZoneId(z.id)}
                    className={`!px-2.5 !py-1 !rounded-lg !text-xs !font-semibold !flex !items-center !gap-1.5 transition-all cursor-pointer !h-auto focus:!ring-0 focus:!ring-offset-0 focus:!outline-none [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5 ${
                      isActive
                        ? "!bg-[#0f3d8a] hover:!bg-[#0f3d8a] !text-white !border-transparent shadow-2xs ring-1 ring-[#0f3d8a]"
                        : "!bg-slate-100 !text-slate-700 !border-transparent hover:!bg-slate-200/80"
                    }`}
                  >
                    <span>{z.zoneNo}</span>
                    <Badge
                      variant={isActive ? "secondary" : "default"}
                      size="sm"
                      className={`!px-1.5 !py-0 !text-[10px] !font-bold ${
                        isActive ? "!bg-white/20 !text-white !border-transparent" : "!bg-blue-100 !text-[#0f3d8a] !border-transparent"
                      }`}
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
          </div>
        </Card>
      )}

      {/* TWO-COLUMN LAYOUT: Left Zone Switcher, Right Ward Multi-Checkboxes */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
        {/* LEFT: Zone Selection List */}
        <Card
          variant="default"
          padding="none"
          className="md:col-span-5 bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 space-y-3 shadow-2xs flex flex-col h-[480px] md:h-[520px]"
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
            <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-900" />
              <span>{t("drawer.selectZone")}</span>
            </span>
            {activeWardZoneId && (
              <Badge variant="default" size="sm" className="!text-[10px]">
                {t("drawer.selectedCount", { count: (selectedZoneWards[activeWardZoneId] || []).length })}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
            {filteredZones.map((z) => {
              const isActive = Number(activeWardZoneId) === Number(z.id);
              const selectedCount = (selectedZoneWards[z.id] || []).length;
              return (
                <div
                  key={z.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveWardZoneId(z.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveWardZoneId(z.id);
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? "border-blue-900 bg-blue-50/70 shadow-2xs ring-1 ring-blue-900/20"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p
                      className={`text-xs font-semibold truncate ${
                        isActive ? "text-blue-900" : "text-slate-800"
                      }`}
                    >
                      {z.zoneNo}
                    </p>
                    {z.description ? (
                      <p className="text-[11px] text-slate-500 truncate">{z.description}</p>
                    ) : null}
                  </div>
                  {selectedCount > 0 ? (
                    <Badge
                      variant="default"
                      size="sm"
                      className="!bg-blue-900 !text-white !text-[10px] !font-bold shrink-0 !border-transparent"
                    >
                      {t("drawer.wardsCount", { count: selectedCount })}
                    </Badge>
                  ) : (
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-blue-900" : "text-slate-400"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* RIGHT: Ward Multi-Select Checkboxes */}
        <Card
          variant="default"
          padding="none"
          className="md:col-span-7 bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 space-y-3 shadow-2xs flex flex-col h-[480px] md:h-[520px]"
        >
          {!activeWardZone ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-300 flex-1 flex items-center justify-center">
              {t("drawer.noZoneSelectedPrompt")}
            </div>
          ) : (
            <>
              {/* Selected Zone Header & Quick Select/Clear */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {t("drawer.zoneWardsTitle", { zone: activeWardZone.zoneNo })}
                    </h5>
                    <Badge variant="default" size="sm" className="!text-[10px]">
                      {t("drawer.selectedCount", { count: (selectedZoneWards[activeWardZone.id] || []).length })}
                    </Badge>
                  </div>
                  {activeWardZone.description && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {activeWardZone.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <SelectAllButton
                    label={t("drawer.selectAll")}
                    onClick={() => selectAllWardsForZone(activeWardZone.id)}
                    size="xs"
                    disabled={isLoadingWards || filteredActiveZoneWards.length === 0}
                    className="w-fit"
                  />
                  <ClearButton
                    label={t("drawer.clearAll")}
                    onClick={() => clearWardsForZone(activeWardZone.id)}
                    size="xs"
                    disabled={(selectedZoneWards[activeWardZone.id] || []).length === 0}
                    className="w-fit"
                  />
                </div>
              </div>

              {/* Search inside this Zone's Wards */}
              {activeZoneWards.length > 6 && (
                <div className="shrink-0">
                  <SearchInput
                    value={wardSearch}
                    onChange={(val) => setWardSearch(val)}
                    placeholder={t("drawer.searchWardsPlaceholder")}
                    className="w-full text-slate-900 text-xs"
                  />
                </div>
              )}

              {/* Wards Checkbox Grid */}
              {isLoadingWards ? (
                <LoadingState
                  message={t("drawer.loadingWards")}
                  size="md"
                  minHeight="min-h-[220px]"
                  className="flex-1"
                />
              ) : activeZoneWards.length === 0 ? (
                <div className="p-8 text-center text-amber-700 text-xs bg-amber-50/60 rounded-lg border border-dashed border-amber-200 flex-1 flex items-center justify-center">
                  {t("drawer.noWardsForZone")}
                </div>
              ) : filteredActiveZoneWards.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200 flex-1 flex items-center justify-center">
                  {t("drawer.noWardsMatch")}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 content-start flex-1 min-h-0 overflow-y-auto pr-1">
                  {filteredActiveZoneWards.map((ward) => {
                    const isChecked = (selectedZoneWards[activeWardZone.id] || []).includes(ward.id);
                    return (
                      <div
                        key={ward.id}
                        onClick={() => toggleWardSelection(activeWardZone.id, ward.id)}
                        title={
                          ward.description && ward.description !== ward.wardNo
                            ? `${ward.wardNo} - ${ward.description}`
                            : ward.wardNo
                        }
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                          isChecked
                            ? "border-blue-300 bg-blue-50/70 text-blue-900 ring-1 ring-blue-200/50"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isChecked
                              ? "bg-blue-900 border-blue-900 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs truncate leading-tight">
                            {ward.wardNo}
                          </p>
                          {ward.description ? (
                            <p
                              className={`text-[11px] truncate mt-0.5 ${
                                isChecked ? "text-blue-800/80 font-medium" : "text-slate-500"
                              }`}
                            >
                              {ward.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
});
