'use client';

import { computeUnitGenerationDerived } from '@/lib/utils/asset-utils/new-add-new-asset/floor-details/unit-generation-form.utils';
import { UnitGenerationFloorRangeFields } from './UnitGenerationFloorRangeFields';
import { UnitGenerationConstructionFields } from './UnitGenerationConstructionFields';
import type { UnitGenerationFormProps } from '@/types/asset/floor-details.types';

export function UnitGenerationForm({
  dropdownOptions,
  genType,
  setGenType,
  genFromFloor,
  setGenFromFloor,
  genToFloor,
  setGenToFloor,
  genCountPerFloor,
  setGenCountPerFloor,
  genConYear,
  setGenConYear,
  genConType,
  setGenConType,
  genUseType,
  setGenUseType,
  genSubUseType,
  setGenSubUseType,
  dynamicSubUseTypes,
  isSubUseTypesLoading,
  isGenerating,
  handleGenerate,
  TYPE_OPTIONS,
  t,
}: UnitGenerationFormProps) {
  const { totalCount, isGenerateDisabled, toFloorOptions } = computeUnitGenerationDerived(
    dropdownOptions,
    genType,
    genFromFloor,
    genToFloor,
    genCountPerFloor,
    genConYear,
    genConType,
    genUseType,
    isGenerating
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Header row */}
      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-2 bg-white shrink-0">
        <div className="w-5 h-5 flex items-center justify-center text-blue-600">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth={2.5} />
          </svg>
        </div>
        <h3 className="text-[11.5px] font-black text-[#101b87] uppercase tracking-wide">
          {t('floorDetails.generateUnits')}
        </h3>
      </div>

      <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-end">
        <UnitGenerationFloorRangeFields
          dropdownOptions={dropdownOptions}
          genType={genType}
          setGenType={setGenType}
          genFromFloor={genFromFloor}
          setGenFromFloor={setGenFromFloor}
          genToFloor={genToFloor}
          setGenToFloor={setGenToFloor}
          toFloorOptions={toFloorOptions}
          genCountPerFloor={genCountPerFloor}
          setGenCountPerFloor={setGenCountPerFloor}
          totalCount={totalCount}
          TYPE_OPTIONS={TYPE_OPTIONS}
          t={t}
        />
        <UnitGenerationConstructionFields
          dropdownOptions={dropdownOptions}
          genConYear={genConYear}
          setGenConYear={setGenConYear}
          genConType={genConType}
          setGenConType={setGenConType}
          genUseType={genUseType}
          setGenUseType={setGenUseType}
          genSubUseType={genSubUseType}
          setGenSubUseType={setGenSubUseType}
          dynamicSubUseTypes={dynamicSubUseTypes}
          isSubUseTypesLoading={isSubUseTypesLoading}
          isGenerating={isGenerating}
          isGenerateDisabled={isGenerateDisabled}
          handleGenerate={handleGenerate}
          totalCount={totalCount}
          t={t}
        />
      </div>
    </div>
  );
}
