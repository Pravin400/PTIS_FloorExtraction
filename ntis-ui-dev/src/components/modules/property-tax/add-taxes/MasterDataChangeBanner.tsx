"use client";

import { AlertTriangle, Download, Play } from "lucide-react";
import { Button } from "@/components/common/ActionButton";
import type { MasterDataChangeSummary } from "@/types/addTaxes.types";

interface MasterDataChangeBannerProps {
  summary: MasterDataChangeSummary | null;
  t: (key: string, values?: Record<string, string | number>) => string;
  isProceedingMasterData: boolean;
  isManualScopeBusy: boolean;
  onProceed: () => void;
  isExportingMasterDataCsv: boolean;
  onExport: () => void;
}

/**
 * Banner shown on the Add Taxes screen when the SQL Server CDC pipeline has flagged already-taxed
 * properties as potentially needing recalculation because a related master data record (e.g. Rate
 * Master) changed. Renders nothing when there is no summary or nothing is flagged.
 *
 * Moved out of AddTaxesConsole.tsx verbatim (pure relocation, no logic change) as part of splitting
 * that file down in size — this replaces this file's own previous, simpler, unused content.
 */
export function MasterDataChangeBanner({
  summary,
  t,
  isProceedingMasterData,
  isManualScopeBusy,
  onProceed,
  isExportingMasterDataCsv,
  onExport,
}: MasterDataChangeBannerProps) {
  if (!summary || (summary.affectedCount ?? 0) <= 0) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all duration-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900">
            {t('masterDataChange.alertTitle')}
          </h4>
          <p className="text-xs text-amber-800 mt-0.5">
            <span className="font-bold text-amber-950">
              {t('masterDataChange.alertDescription', { count: (summary.affectedCount ?? 0).toLocaleString() })}
            </span>
            {summary.remarkSummary ? ` (${summary.remarkSummary})` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="primary"
          size="sm"
          icon={Play}
          onClick={onProceed}
          isLoading={isProceedingMasterData}
          disabled={isProceedingMasterData || isManualScopeBusy || Boolean(summary?.activeJobCode)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs border border-amber-700"
        >
          {summary?.activeJobCode ? t('masterDataChange.scheduled') : t('masterDataChange.proceedExecution')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={Download}
          onClick={onExport}
          disabled={isExportingMasterDataCsv}
          className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400 font-medium shadow-xs"
        >
          {isExportingMasterDataCsv ? t('masterDataChange.exporting') : t('masterDataChange.exportAffectedProperties')}
        </Button>
      </div>
    </div>
  );
}

export default MasterDataChangeBanner;
