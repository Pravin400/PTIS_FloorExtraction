"use client";

import React from "react";
import { Drawer, Button } from "@/components/common";
import { useTranslations } from "next-intl";
import type { Ward, Zone, AssetCategory, AssetType } from "@/types/asset/municipal-Asset/new-add-new-asset";
import { ChevronRight, ClipboardList, Plus } from "lucide-react";
import { useAddAssetDrawer } from "@/hooks/asset/municipal-Asset/new-add-new-asset/useAddAssetDrawer";
import { NewRegisterSection } from "./NewRegisterSection";
import { ExistingAssetSection } from "./ExistingAssetSection";
import { AddAssetDrawerProps } from "@/types/asset/municipal-Asset/new-add-new-asset/add-new-asset.types";

function ModeTab({
  active,
  icon,
  title,
  subtitle,
  onClick,
  color,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  color: "blue" | "violet";
}) {
  const activeClasses =
    color === "blue"
      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100"
      : "border-violet-500 bg-violet-50 text-violet-700 shadow-sm shadow-violet-100";
  const iconActive = color === "blue" ? "bg-blue-600 text-white" : "bg-violet-600 text-white";

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`!flex-1 !p-0 !h-auto !rounded-xl !border-2 !transition-all !whitespace-normal [&>span]:w-full ${
        active ? activeClasses : "!border-slate-200 !bg-white !text-slate-500 hover:!border-slate-300 hover:!bg-slate-50 hover:!text-slate-500"
      }`}
    >
      <div className="flex w-full items-start gap-3 p-3.5 text-left">
        <div className={`mt-0.5 flex-shrink-0 rounded-lg p-1.5 transition-colors ${active ? iconActive : "bg-slate-100 text-slate-400"}`}>
          {icon}
        </div>
        <div>
          <p className={`text-sm font-bold leading-tight ${active ? "" : "text-slate-600"}`}>{title}</p>
          <p className={`text-[11px] mt-0.5 leading-tight ${active ? "opacity-80" : "text-slate-400"}`}>{subtitle}</p>
        </div>
      </div>
    </Button>
  );
}

const DEFAULT_CATEGORIES: AssetCategory[] = [];
const DEFAULT_ZONES: Zone[] = [];
const DEFAULT_WARDS: Ward[] = [];
const DEFAULT_TYPES: AssetType[] = [];

export function AddAssetDrawer({
  open,
  onClose,
  initialCategories = DEFAULT_CATEGORIES,
  initialZones = DEFAULT_ZONES,
  initialWards = DEFAULT_WARDS,
  initialTypes = DEFAULT_TYPES,
}: AddAssetDrawerProps) {
  const t = useTranslations("newAddNewAsset");
  const drawerState = useAddAssetDrawer(open, initialCategories, initialTypes, onClose);

  const zones = initialZones;
  const wards = initialWards;

  const {
    mode, setMode,
    categories, types, newData, setNewData, handleCategorySelection,
    selectedZoneId, setSelectedZoneId,
    selectedWardId, setSelectedWardId,
    assetSearch, setAssetSearch,
    assetResults, setAssetResults,
    totalCount, setTotalCount,
    selectedAsset, setSelectedAsset,
    isAssetLoading,
    canSearch,
    handleAssetSearchChange,
    handleNewRegisterSubmit, handleExistingAssetSubmit,
    isSubmitting
  } = drawerState;

  const canSubmitNew = !!(newData.category && newData.assetType) && !isSubmitting;
  const canSubmitExisting = !!selectedAsset && !isSubmitting;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="md"
      title={
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 shadow">
            <Plus className="size-4 text-white" />
          </div>
          <div>
            <span className="block text-sm font-bold tracking-wide text-slate-800">{t("drawer.title")}</span>
            <span className="block text-[10px] font-medium text-slate-400 leading-none mt-0.5">{t("drawer.subtitle")}</span>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="!px-4 !py-2 !h-auto !min-w-0 !text-sm !font-semibold !text-slate-500 transition-colors hover:!text-slate-700 !rounded-lg hover:!bg-slate-100 disabled:opacity-50"
          >
            {t("buttons.cancel")}
          </Button>
          <Button
            variant="ghost"
            onClick={mode === "new" ? handleNewRegisterSubmit : handleExistingAssetSubmit}
            disabled={mode === "new" ? !canSubmitNew : !canSubmitExisting}
            className={`!p-0 !h-auto !min-w-0 !rounded-lg !transition-all !shadow-md ml-auto ${((mode === "new" ? canSubmitNew : canSubmitExisting) && !isSubmitting)
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-blue-200"
              : "cursor-not-allowed bg-slate-100 text-slate-400 shadow-none hover:!bg-slate-100 hover:!text-slate-400"
              }`}
          >
            <div className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold">
              {mode === "new" ? (isSubmitting ? "Starting..." : t("buttons.startRegistration")) : t("buttons.continue")}
              <ChevronRight className="size-4" />
            </div>
          </Button>
        </div>
      }
    >
      <div className="p-5 space-y-5 [&_label]:!font-bold [&_label]:!text-[13px] [&_span[id$=-label]]:!font-bold [&_span[id$=-label]]:!text-[13px] [&_th]:!text-xs [&_th_span]:!text-xs [&_th]:!font-black [&_th_span]:!font-black [&_th]:!tracking-widest [&_th_span]:!tracking-widest">
        {/* ── Mode Tabs ── */}
        <div className="flex gap-3">
          <ModeTab
            active={mode === "new"}
            icon={<ClipboardList className="size-4" />}
            title={t("modes.new.title")}
            subtitle={t("modes.new.subtitle")}
            onClick={() => setMode("new")}
            color="blue"
          />
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* ── Sections ── */}
        {mode === "new" && (
          <NewRegisterSection
            categories={categories}
            types={types}
            newData={newData}
            setNewData={setNewData}
            isCatLoading={false}
            canSubmitNew={canSubmitNew}
            onCategoryChange={handleCategorySelection}
          />
        )}

        {mode === "existing" && (
          <ExistingAssetSection
            zones={zones}
            wards={wards}
            selectedZoneId={selectedZoneId}
            setSelectedZoneId={setSelectedZoneId}
            selectedWardId={selectedWardId}
            setSelectedWardId={setSelectedWardId}
            assetSearch={assetSearch}
            setAssetSearch={setAssetSearch}
            handleAssetSearchChange={handleAssetSearchChange}
            assetResults={assetResults}
            setAssetResults={setAssetResults}
            totalCount={totalCount}
            setTotalCount={setTotalCount}
            selectedAsset={selectedAsset}
            setSelectedAsset={setSelectedAsset}
            isAssetLoading={isAssetLoading}
            canSearch={canSearch}
          />
        )}
      </div>
    </Drawer>
  );
}
