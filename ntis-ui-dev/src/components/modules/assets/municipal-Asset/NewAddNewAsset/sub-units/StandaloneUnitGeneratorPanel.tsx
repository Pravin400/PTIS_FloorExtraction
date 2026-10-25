'use client';

import { Plus, CheckCircle2, Loader2 } from "lucide-react";
import { Select, Card, CardContent } from "@/components/common";
import { AnimatedDigitInput } from '@/components/common/AnimatedDigitInput';
import { StandaloneUnitGeneratorPanelProps } from "@/types/asset/sub-units.types";

export function StandaloneUnitGeneratorPanel({
  t,
  fromNo,
  setFromNo,
  toNo,
  setToNo,
  parentFloors,
  selectedFloorId,
  setSelectedFloorId,
  isGenerating,
  onGenerate,
  unitsCount,
}: StandaloneUnitGeneratorPanelProps) {
  return (
    <Card variant="bordered" className="border-blue-200 shadow-sm">
      <CardContent className="p-4 flex flex-wrap items-end gap-4">
        <div className="w-32">
          <AnimatedDigitInput
            label={t("standaloneSubUnit.fromUnitNo")}
            value={String(fromNo)}
            onChange={(val) => setFromNo(Number(val))}
            className="h-10 text-sm font-bold"
          />
        </div>
        <div className="w-32">
          <AnimatedDigitInput
            label={t("standaloneSubUnit.toUnitNo")}
            value={String(toNo)}
            onChange={(val) => setToNo(Number(val))}
            className="h-10 text-sm font-bold"
          />
        </div>

        {parentFloors.length > 0 && (
          <div className="w-48">
            <Select
              label={t("standaloneSubUnit.targetFloor")}
              name="selectedFloorId"
              value={selectedFloorId.toString()}
              onChange={e => setSelectedFloorId(Number(e.target.value))}
              options={parentFloors.map((f: { id?: string | number; name?: string; floorNumber?: string; [key: string]: unknown }) => ({
                label: `${f.floor} (${f.conType})`,
                value: String(f.id ?? "")
              }))}
              className="h-10 text-sm font-bold"
            />
          </div>
        )}

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black uppercase tracking-wider text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {t("standaloneSubUnit.addGenerate")}
        </button>

        {unitsCount > 0 && (
          <div className="ml-auto h-10 px-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2 font-bold text-xs uppercase">
            <CheckCircle2 className="size-4 text-emerald-500" />
            {t("standaloneSubUnit.unitsGenerated", { count: unitsCount })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
