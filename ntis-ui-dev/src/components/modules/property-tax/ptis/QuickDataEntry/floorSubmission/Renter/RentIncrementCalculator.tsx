"use client";

import React, { useDeferredValue, useMemo, useState, useEffect, useCallback } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/common";
import { Label } from "@/components/common/label";
import { useTranslations } from "next-intl";

import { calculateRentProgression, RentPeriod } from "@/lib/utils/renter/renter-calculations";
import { RenterFormData } from "@/types/renter/renter.types";
import { RentCalculationErrorBoundary } from "./RentCalculationErrorBoundary";
import { ProgressionTable } from "./ProgressionTable";
import { SummaryCards } from "./SummaryCards";

interface RentIncrementCalculatorProps {
  formData: RenterFormData;
  setFormData: React.Dispatch<React.SetStateAction<RenterFormData>>;
  selectedFYFilter?: string | null;
  onClearFilter?: () => void;
}

const RentIncrementCalculatorInner = React.memo(({
  formData,
  setFormData,
  selectedFYFilter,
  onClearFilter,
}: RentIncrementCalculatorProps) => {
  const t = useTranslations('quickDataEntry');
  
  const renterDetails = formData?.renterDetails;
  
  // DEEP LOGIC: Use deferred value for heavy calculations to keep UI responsive while typing
  const deferredRenterDetails = useDeferredValue(renterDetails);
  const isCalculating = renterDetails !== deferredRenterDetails;

  // DEEP LOGIC: Use centralized utility for progression and summary
  const rentData = useMemo(() => {
    return calculateRentProgression(deferredRenterDetails);
  }, [deferredRenterDetails]);

  const monthlyRentProgression = useMemo(() => rentData?.progression || [], [rentData]);
  const baseProgression = useMemo(() => (rentData?.segmentProgression && rentData.segmentProgression.length > 0)
    ? rentData.segmentProgression
    : monthlyRentProgression, [rentData, monthlyRentProgression]);

  const isCompounding = renterDetails?.isCompounding || false;
  const viewMode = renterDetails?.viewMode || "monthly";
  const [isMonthlyProgressionOpen, setIsMonthlyProgressionOpen] = useState(true);

  // DEEP LOGIC: If a filter is applied from the summary table, ensure this section is open
  useEffect(() => {
    if (selectedFYFilter) {
      setIsMonthlyProgressionOpen(true);
    }
  }, [selectedFYFilter]);

  const filteredMonthlyProgression = useMemo(() => {
    if (!selectedFYFilter) return baseProgression;

    const [startYear, endYear] = String(selectedFYFilter).replace('FY ', '').split('-').map(y =>
      y.length === 2 ? `20${y}` : y
    );
    const fyStartDate = new Date(parseInt(startYear), 3, 1);
    const fyEndDate = new Date(parseInt(endYear), 2, 31);

    return baseProgression.filter((row: RentPeriod) => {
      const segStart = row.date;
      const segEnd = row.segmentTo ?? row.date;
      return segEnd >= fyStartDate && segStart <= fyEndDate;
    });
  }, [baseProgression, selectedFYFilter]);

  const tableProgression = useMemo(() => {
    return filteredMonthlyProgression.map((item: RentPeriod, index: number) => ({
      ...item,
      month: item.month || (index + 1),
      duration: item.duration || (item.date ? `${item.date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : '-'),
      rent: item.rent || 0,
      incrementApplied: item.incrementApplied || 0,
      isIncrementMonth: item.isIncrementMonth || false,
      segmentLabel: item.segmentLabel
    }));
  }, [filteredMonthlyProgression]);

  const yearlySummary = useMemo(() => {
    if (!rentData?.fyBreakdown) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rentData.fyBreakdown.map((item: any) => {
      const matchingProg = monthlyRentProgression.find(p => p.date.getFullYear() === parseInt(String(item.financialYear || "").split('-')[0] || "0"));
      return {
        year: item.financialYear || "-",
        baseRent: matchingProg?.rent || 0,
        finalRent: item.finalRent || 0,
        totalIncrement: Number(item.finalRent || 0) - Number(matchingProg?.rent || 0),
        totalRentCollected: item.totalRentCollected || item.finalRent || 0,
        incrementCount: item.incrementCount || 0,
        monthCount: item.monthCount || 12
      };
    });
  }, [rentData, monthlyRentProgression]);

  const handleModeChange = useCallback((newMode: boolean) => {
    setFormData(prev => {
      return {
        ...prev,
        renterDetails: {
          ...(prev?.renterDetails || {}),
          isCompounding: newMode,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      };
    });
  }, [setFormData]);

  return (
    <>
      {renterDetails?.incrementFrequency && renterDetails?.incrementFrequency !== "No Increment" && (
        <div className="animate-[slideIn_0.3s_ease-out] mb-[5px]">
          <Label className="text-[11px] font-semibold text-gray-700 mb-2 block flex items-center gap-1">
            {t('floor.table.status')} 
            <div className="group/tooltip relative">
              <Info className="w-3 h-3 text-blue-500 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 bg-gray-900 text-white text-[9px] rounded px-2 py-1 z-50 whitespace-normal shadow-xl">
                <strong>{t('floor.renterSection.baseValueLinear')}:</strong> {'Increment always calculated on original base rent. Linear growth.'}<br />
                <strong>{t('floor.renterSection.incrementedCompounding')}:</strong> {'Increment calculated on current rent. Exponential growth.'}
              </div>
            </div>
          </Label>

          <div className="relative bg-gray-100 rounded-lg p-0.5 flex items-center gap-0.5 shadow-inner">
            <div
              className={`absolute top-0.5 bottom-0.5 w-[calc(50%-0.25rem)] rounded-md shadow-md transition-all duration-300 ease-out ${isCompounding
                  ? "left-[calc(50%+0.125rem)] bg-gradient-to-br from-purple-500 to-purple-600"
                  : "left-0.5 bg-gradient-to-br from-blue-500 to-blue-600"
                }`}
            />

            <Button
              type="button"
              variant="ghost"
              className={`relative z-10 flex-1 h-auto px-2 py-1.5 rounded-md text-[10px] font-bold transition-all duration-300 ease-out inline-flex items-center justify-center focus:outline-none hover:bg-transparent ${!isCompounding
                  ? "text-white scale-100"
                  : "text-gray-600 hover:text-gray-800 scale-95"
                }`}
              onClick={() => handleModeChange(false)}
            >
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs">📊</span>
                  <span>{t('floor.renterSection.baseValueLinear')}</span>
                </div>
              </div>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className={`relative z-10 flex-1 h-auto px-2 py-1.5 rounded-md text-[10px] font-bold transition-all duration-300 ease-out inline-flex items-center justify-center focus:outline-none hover:bg-transparent ${isCompounding
                  ? "text-white scale-100"
                  : "text-gray-600 hover:text-gray-800 scale-95"
                }`}
              onClick={() => handleModeChange(true)}
            >
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs">📈</span>
                  <span>{t('floor.renterSection.incrementedCompounding')}</span>
                </div>
              </div>
            </Button>
          </div>
        </div>
      )}

      {renterDetails?.incrementFrequency &&
        renterDetails?.incrementFrequency !== "No Increment" &&
        renterDetails?.agreementDateFrom &&
        renterDetails?.agreementDateTo &&
        monthlyRentProgression.length > 0 &&
        viewMode === "monthly" && (
          <ProgressionTable 
            incrementFrequency={renterDetails.incrementFrequency}
            isCalculating={isCalculating}
            isMonthlyProgressionOpen={isMonthlyProgressionOpen}
            setIsMonthlyProgressionOpen={setIsMonthlyProgressionOpen}
            selectedFYFilter={selectedFYFilter}
            onClearFilter={onClearFilter}
            tableProgression={tableProgression}
            segmentProgressionLength={rentData?.segmentProgression?.length || 0}
            isCompounding={isCompounding}
          />
        )}

      {renterDetails?.incrementFrequency &&
        renterDetails?.incrementFrequency !== "No Increment" &&
        renterDetails?.agreementDateFrom &&
        renterDetails?.agreementDateTo &&
        yearlySummary.length > 0 &&
        viewMode === "annual" && (
          <SummaryCards 
            yearlySummary={yearlySummary}
            isCompounding={isCompounding}
          />
        )}
    </>
  );
});

RentIncrementCalculatorInner.displayName = 'RentIncrementCalculatorInner';

export const RentIncrementCalculator = React.memo((props: RentIncrementCalculatorProps) => {
  return (
    <RentCalculationErrorBoundary>
      <RentIncrementCalculatorInner {...props} />
    </RentCalculationErrorBoundary>
  );
});

RentIncrementCalculator.displayName = 'RentIncrementCalculator';
