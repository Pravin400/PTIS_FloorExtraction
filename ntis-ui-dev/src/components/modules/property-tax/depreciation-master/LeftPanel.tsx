"use client";

import { AddButton, DeleteButton, Input } from "@/components/common";
import type { LeftPanelProps } from "@/types/depreciation.types";

export function LeftPanel({
  minValue,
  maxValue,
  minError,
  maxError,
  ranges,
  selectedRangeId,
  saving,
  onMinChange,
  onMaxChange,
  onAddRange,
  onSelectRange,
  onDeleteRange,
  t,
  values,
}: Readonly<LeftPanelProps>) {
  return (
    <div className="col-span-12 lg:col-span-2">
      <div className="bg-white rounded-2xl border shadow-sm h-155 flex flex-col p-2 space-y-6">
        <div className="grid grid-cols-2 gap-1.5 [&_label]:text-xs [&_label]:min-h-[32px]">
          <Input
            label={t("min", values)}
            required
            type="text"
            placeholder={t("minPlaceholder", values)}
            value={minValue}
            onChange={(e) => onMinChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            error={minError || undefined}
            inputMode="numeric"
            className="text-xs"
          />
          <Input
            label={t("max", values)}
            required
            type="text"
            placeholder={t("maxPlaceholder", values)}
            value={maxValue}
            onChange={(e) => onMaxChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            error={maxError || undefined}
            inputMode="numeric"
            className="text-xs"
          />
        </div>

        <AddButton
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddRange();
          }}
          disabled={saving}
          className="w-full text-xs py-1.5"
          label={t("addRange", values)}
        />

        <div className="flex-1 overflow-y-auto space-y-1.5 border-t pt-3">
          {ranges.length === 0 ? (
            <div className="text-center text-gray-400 py-6 text-xs">
              {t("noRanges", values) || "No ranges available"}
            </div>
          ) : (
            ranges.map((r) => {
              const now = new Date();
              // Financial year starts in April (month index 3)
              const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
              const yearFrom = currentYear - r.min;
              const yearTo = currentYear - r.max;
              return (
                <button
                  key={r.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectRange(r.id);
                  }}
                  className={`w-full p-2 text-center rounded-lg border transition-all text-xs flex flex-col items-center justify-center ${
                    selectedRangeId === r.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-semibold">{r.min} - {r.max}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">({yearFrom}-{yearTo})</div>
                </button>
              );
            })
          )}
        </div>

        <DeleteButton
          onClick={(e) =>  {
            e.preventDefault();
            e.stopPropagation();
            onDeleteRange();
          }}
          disabled={saving || !selectedRangeId}
          className="w-full text-xs py-1.5"
          aria-label={t("deleteRange", values)}
        />
      </div>
    </div>
  );
}
