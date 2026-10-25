'use client';

import React from 'react';
import { AssessmentUnit, PtisTaxMode } from '@/types/property-tax/apartment';
import { ChevronRight, ChevronDown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { rowTintStyle, ROW_TINT_TEXT_CLASS } from '@/lib/utils/apartment-row-tint';
import { UnitMediaIconButton } from './UnitMediaIconButton';
import { MappedOldPropertiesExpandedRow } from './MappedOldPropertiesExpandedRow';

interface ExistingAssessmentTableRowProps {
  unit: AssessmentUnit;
  idx: number;
  isHovered: boolean;
  /** Faint background by the type / BHK of the unit (the type of its new survey row). */
  tintColor?: string;
  isExpanded: boolean;
  onHoverUnit: (id: string | null) => void;
  onToggleExpandRow: (id: string) => void;
  onViewDocument?: (guid: string, title?: string) => void;
  onViewRules?: (unit: AssessmentUnit) => void;
  taxMode?: PtisTaxMode;
}

import { useTranslations } from 'next-intl';

export const ExistingAssessmentTableRow: React.FC<ExistingAssessmentTableRowProps> = ({
  unit,
  idx,
  isHovered,
  tintColor,
  isExpanded,
  onHoverUnit,
  onToggleExpandRow,
  onViewRules,
  taxMode,
}) => {
  const t = useTranslations('ptisRedesign.subTables');
  const showRv = taxMode !== 'capital';
  const showCv = taxMode !== 'rateable';
  const raw = unit.rawSurvey;
  const photoOfType = (...codes: string[]) => raw?.photos?.find((p) => codes.includes(p.photoTypeCode ?? ''))?.documentGuid || null;
  const propPhotoGuid = raw?.propertyPhotoDocumentGuid || photoOfType('PROPERTY_PHOTO', 'PROPERTY_FRONT');
  const planPhotoGuid = raw?.planPhotoDocumentGuid || photoOfType('PLAN_PHOTO', 'PROPERTY_PLAN');
  const rawAny = raw as Record<string, unknown> | undefined;

  // propertyId = the old property record's own ID (from the old survey DTO).
  // unit.propertyId is set by the mapper to oldSurvey.id (via resolvedPropertyId = pdnId ?? id).
  // rawAny?.propertyId and raw?.id are fallbacks for the same value.
  const propertyId =
    unit.propertyId ??
    (rawAny?.propertyId ? Number(rawAny.propertyId) : null) ??
    (raw?.id ? Number(raw.id) : null);
  const hasMappedProperties = Boolean((unit.oldPropertyId && unit.oldPropertyId > 0) || (propertyId && propertyId > 0));

  return (
    <React.Fragment key={unit.id ? `${unit.id}-${idx}` : idx}>
      <tr
        onMouseEnter={() => onHoverUnit(unit.id)}
        onMouseLeave={() => onHoverUnit(null)}
        onClick={() => {
          if (hasMappedProperties) {
            onToggleExpandRow(unit.id);
          }
        }}
        style={rowTintStyle(tintColor)}
        className={cn(tintColor && ROW_TINT_TEXT_CLASS, 'h-11 transition-colors cursor-pointer hover:bg-slate-100/60', isHovered && 'bg-slate-100/80', isExpanded && 'bg-slate-100/90')}
      >
        <td className={cn('w-12 px-1 py-1 text-center font-semibold text-zinc-500 sticky left-0 z-10 border-r border-zinc-200 shadow-2xs h-11', 'bg-white')}>
          <div className="flex items-center justify-center gap-1 text-zinc-400">
            {hasMappedProperties ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpandRow(unit.id);
                }}
                className="p-0.5 rounded-sm hover:bg-zinc-200 text-zinc-600 cursor-pointer"
                title={t('expandMapped') || 'Expand mapped properties'}
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-700" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : null}
            <span className="font-semibold text-zinc-600 text-[13px] min-w-[14px] text-center">{idx + 1}</span>
          </div>
        </td>
        <td className="px-2.5 py-1.5 font-semibold text-zinc-900 whitespace-nowrap border-r border-zinc-200" title={`Property No: ${unit.propertyNo || unit.oldPropertyNo || '-'} | Partition: ${unit.partitionNo || '-'} | Flat No: ${unit.flatNo || '-'} | Owner: ${unit.owner || '-'}`}>{unit.prop}</td>
        <td className="px-2 py-1.5 font-semibold text-zinc-800 whitespace-nowrap border-r border-zinc-200">{unit.wgFl}</td>
        <td className="px-2 py-1.5 whitespace-nowrap border-r border-zinc-200" title={unit.typeFull || unit.type}>{unit.type}</td>
        <td className="px-2 py-1.5 whitespace-nowrap border-r border-zinc-200" title={unit.bhk}>{unit.bhk || '-'}</td>
        <td className="px-2 py-1.5 whitespace-nowrap border-r border-zinc-200">{unit.cty}</td>
        <td className="px-2 py-1.5 text-center whitespace-nowrap border-r border-zinc-200">{unit.ayr}</td>
        <td className="px-2 py-1.5 text-center whitespace-nowrap border-r border-zinc-200">{unit.cyr}</td>
        <td className="px-2 py-1.5 whitespace-nowrap border-r border-zinc-200" title={unit.use}>{unit.use}</td>
        <td className="px-2.5 py-1.5 text-right font-mono whitespace-nowrap border-r border-zinc-200">{unit.cptDisplay}</td>
        <td className="px-2.5 py-1.5 text-right font-mono whitespace-nowrap border-r border-zinc-200">{unit.buaDisplay}</td>
        <td className="px-2 py-1.5 whitespace-nowrap border-r border-zinc-200">{unit.ocNo}</td>
        <td className="px-2 py-1.5 text-center whitespace-nowrap border-r border-zinc-200">{unit.occdt}</td>
        <td className="px-2.5 py-1.5 whitespace-nowrap border-r border-zinc-200">{unit.rntr}</td>
        <td className="px-2.5 py-1.5 text-right font-mono whitespace-nowrap border-r border-zinc-200">{unit.rentDisplay}</td>
        <td className="px-2 py-1.5 text-right font-mono whitespace-nowrap border-r border-zinc-200">{unit.alv}</td>
        {showRv && <td className="px-2 py-1.5 text-right font-mono font-semibold text-zinc-900 whitespace-nowrap border-r border-zinc-200">{unit.rvDisplay}</td>}
        {showCv && <td className="px-2 py-1.5 text-right font-mono font-semibold text-zinc-900 whitespace-nowrap border-r border-zinc-200">{unit.cvDisplay || '-'}</td>}
        <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-zinc-900 whitespace-nowrap border-r border-zinc-200">{unit.taxDisplay}</td>
        <td className="px-1.5 py-1.5 text-center whitespace-nowrap border-r border-zinc-200">
          <UnitMediaIconButton
            documentGuid={propPhotoGuid}
            kind="photo"
            title={`Unit ${unit.prop} - Property Photo`}
            tooltip={t('viewPropPhoto') || 'Click to view Property Photo'}
          />
        </td>
        <td className="px-1.5 py-1.5 text-center whitespace-nowrap border-r border-zinc-200">
          <UnitMediaIconButton
            documentGuid={planPhotoGuid}
            kind="plan"
            title={`Unit ${unit.prop} - Floor Plan`}
            tooltip={t('viewFloorPlan') || 'Click to view Floor Plan'}
          />
        </td>
        <td className="px-1.5 py-1.5 text-center whitespace-nowrap border-r border-zinc-200">
          <div className="flex items-center justify-center">
            <button type="button" onClick={(e) => { e.stopPropagation(); onViewRules?.(unit); }} className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all border border-blue-200 cursor-pointer shadow-2xs" title={t('viewRules') || 'View Applied Rules for this Unit'}>
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-slate-50/40 border-b border-zinc-200 transition-all">
          <td colSpan={showRv && showCv ? 22 : (showRv || showCv ? 21 : 20)} className="p-1.5 text-zinc-700 font-sans align-middle">
            <MappedOldPropertiesExpandedRow
              propertyId={propertyId}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};
