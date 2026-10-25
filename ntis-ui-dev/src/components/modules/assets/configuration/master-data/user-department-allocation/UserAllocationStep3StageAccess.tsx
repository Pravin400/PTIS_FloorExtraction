"use client";

import { memo } from "react";
import { GitBranch, Check } from "lucide-react";
import { SearchInput, SelectAllButton, ClearButton, Card, Badge } from "@/components/common";
import { LoadingState } from "@/components/common/LoadingState";
import type { GrievanceWorkflowStageOption } from "@/types/asset-masters/user-department-allocation.types";

interface UserAllocationStep3StageAccessProps {
  stagesList: GrievanceWorkflowStageOption[];
  filteredStages: GrievanceWorkflowStageOption[];
  selectedStageIds: number[];
  stageSearch: string;
  setStageSearch: (val: string) => void;
  toggleStage: (stageId: number) => void;
  selectAllStages: () => void;
  clearAllStages: () => void;
  isLoadingStages?: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const UserAllocationStep3StageAccess = memo(function UserAllocationStep3StageAccess({
  stagesList,
  filteredStages,
  selectedStageIds,
  stageSearch,
  setStageSearch,
  toggleStage,
  selectAllStages,
  clearAllStages,
  isLoadingStages = false,
  t,
}: UserAllocationStep3StageAccessProps) {
  const selectedCount = selectedStageIds.length;

  return (
    <div className="space-y-3.5">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-blue-900" />
            <span className="inline-flex items-center gap-1.5">
              <span>{t("drawer.step3Title")}</span>
              <Badge
                variant="secondary"
                size="sm"
                className="!text-[10px] !py-0 !px-1.5 font-semibold"
              >
                {t("drawer.step3Badge")}
              </Badge>
            </span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("drawer.step3Description")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <SelectAllButton
            label={t("drawer.selectAll")}
            onClick={selectAllStages}
            size="xs"
            disabled={isLoadingStages || filteredStages.length === 0}
            className="w-fit"
          />
          <ClearButton
            label={t("drawer.clearAll")}
            onClick={clearAllStages}
            size="xs"
            disabled={selectedCount === 0}
            className="w-fit"
          />
        </div>
      </div>

      {/* Summary Banner when stages are selected */}
      {selectedCount > 0 && (
        <Card
          variant="default"
          padding="none"
          className="p-3 bg-white border border-blue-200/80 rounded-xl shadow-2xs flex items-center justify-between text-xs"
        >
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {t("drawer.totalStagesAllocatedSummary", { count: selectedCount })}
            </span>
          </span>
          <Badge variant="success" size="sm" className="!font-medium">
            {t("drawer.preservedAndReady")}
          </Badge>
        </Card>
      )}

      {/* Search Input for Stages */}
      {stagesList.length > 4 && (
        <SearchInput
          value={stageSearch}
          onChange={(val) => setStageSearch(val)}
          placeholder={t("drawer.searchStagesPlaceholder")}
          className="w-full text-slate-900 text-xs"
        />
      )}

      {/* Stages List Content */}
      {isLoadingStages ? (
        <LoadingState
          message={t("drawer.loadingStages")}
          size="md"
          minHeight="min-h-[220px]"
          className="bg-white rounded-xl border border-slate-200"
        />
      ) : stagesList.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs bg-white rounded-xl border border-dashed border-slate-300">
          {t("drawer.noStagesAvailable")}
        </div>
      ) : filteredStages.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs bg-white rounded-xl border border-dashed border-slate-200">
          {t("drawer.noStagesMatch")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredStages.map((stage) => {
            const isSelected = selectedStageIds.some((id) => Number(id) === Number(stage.id));
            return (
              <div
                key={stage.id}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => toggleStage(stage.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleStage(stage.id);
                  }
                }}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between group min-h-[72px] ${
                  isSelected
                    ? "border-blue-900 bg-blue-50/50 shadow-xs ring-1 ring-blue-900/20"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div
                    className={`p-1.5 rounded-lg transition-colors shrink-0 mt-0.5 ${
                      isSelected ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-slate-900 text-xs truncate leading-tight">
                        {stage.stageName}
                      </p>
                    </div>

                    {stage.stageCode && (
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="font-mono !text-[10px] !py-0 !px-1.5 mt-1"
                      >
                        {stage.stageCode}
                      </Badge>
                    )}

                    {stage.description ? (
                      <p className="text-[10.5px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                        {stage.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Checkbox circle indicator */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all mt-0.5 ${
                    isSelected
                      ? "border-blue-900 bg-blue-900 text-white shadow-xs"
                      : "border-slate-300 bg-white group-hover:border-slate-400"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
