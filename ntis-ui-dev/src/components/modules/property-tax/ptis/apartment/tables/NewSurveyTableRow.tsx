'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { AssessmentUnit, PtisTaxMode } from '@/types/property-tax/apartment';
import { ChevronRight, ChevronDown, Eye, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { rowTintStyle, ROW_TINT_TEXT_CLASS } from '@/lib/utils/apartment-row-tint';
import { UnitMediaIconButton } from './UnitMediaIconButton';
import { partitionKindOf } from '@/lib/utils/apartment-partition';
import { MappedPropertiesExpandedRow } from './MappedPropertiesExpandedRow';

import { useTranslations } from 'next-intl';

interface NewSurveyTableRowProps {
  unit: AssessmentUnit;
  idx: number;
  isHovered: boolean;
  /** Faint background by the type / BHK of the unit. */
  tintColor?: string;
  isExpanded: boolean;
  onHoverUnit: (id: string | null) => void;
  onToggleExpandRow: (id: string) => void;
  onEditUnit?: (unit: AssessmentUnit) => void;
  onViewDocument?: (guid: string, title?: string) => void;
  onViewRules?: (unit: AssessmentUnit) => void;
  taxMode?: PtisTaxMode;
}

export const NewSurveyTableRow: React.FC<NewSurveyTableRowProps> = ({
  unit,
  idx,
  isHovered,
  tintColor,
  isExpanded,
  onHoverUnit,
  onToggleExpandRow,
  onEditUnit,
  onViewDocument,
  onViewRules,
  taxMode,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('ptisRedesign.subTables');
  const tc = useTranslations('ptisRedesign.columns');

  const raw = unit.rawSurvey;
  // Hover text of PROP NO: "Wing: A" on the wing row, "Partition No: A1" on the partition of a unit.
  const partitionKind = partitionKindOf(unit);
  const propTitle = partitionKind
    ? `${partitionKind === 'wing' ? tc('wingLabel') : tc('partitionLabel')}: ${unit.partitionNo}`
    : `${tc('propNo')}: ${unit.propertyNo || '-'}`;
  const photoOfType = (...codes: string[]) => raw?.photos?.find((p) => codes.includes(p.photoTypeCode ?? ''))?.documentGuid || null;
  const propPhotoGuid = raw?.propertyPhotoDocumentGuid || photoOfType('PROPERTY_PHOTO', 'PROPERTY_FRONT');
  const planPhotoGuid = raw?.planPhotoDocumentGuid || photoOfType('PLAN_PHOTO', 'PROPERTY_PLAN');
  const rawAny = raw as Record<string, unknown> | undefined;
  const taxDetailOldId = raw?.oldTaxDetails?.find((t) => t.propertyMastOldId)?.propertyMastOldId;
  const oldPropertyId =
    unit.oldPropertyId ??
    (rawAny?.propertyMastOldId ? Number(rawAny.propertyMastOldId) : null) ??
    (taxDetailOldId ? Number(taxDetailOldId) : null) ??
    (rawAny?.oldPropertyId ? Number(rawAny.oldPropertyId) : null);
  const hasMappedProperties = Boolean(oldPropertyId && oldPropertyId > 0);
  const wingDetailsId =
    (rawAny?.wingDetailsId ? Number(rawAny.wingDetailsId) : null) ??
    (rawAny?.wingDetailId ? Number(rawAny.wingDetailId) : null) ??
    (rawAny?.WingDetailsId ? Number(rawAny.WingDetailsId) : null) ??
    (rawAny?.WingDetailId ? Number(rawAny.WingDetailId) : null) ??
    null;
  const showRv = taxMode !== 'capital';
  const showCv = taxMode !== 'rateable';

  const handleEditUnit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditUnit) {
      onEditUnit(unit);
      return;
    }
    const propId = raw?.id || raw?.pdnId || unit.propertyId || unit.id;
    if (!propId) return;

    const params = new URLSearchParams();
    const parentPropId = searchParams.get('parentPropertyId') || searchParams.get('propertyId');
    if (parentPropId) params.set('parentPropertyId', String(parentPropId));
    params.set('propertyId', String(propId));
    const wardNo = raw?.wardNo || searchParams.get('wardNo');
    if (wardNo) params.set('wardNo', String(wardNo));
    const wardId = raw?.wardId || searchParams.get('wardId');
    if (wardId) params.set('wardId', String(wardId));
    const propertyNo = unit.propertyNo || raw?.propertyNo || searchParams.get('propertyNo');
    if (propertyNo) params.set('propertyNo', String(propertyNo));
    const partitionNo = unit.partitionNo || raw?.partitionNo || searchParams.get('partitionNo');
    if (partitionNo && partitionNo !== '-') params.set('partitionNo', String(partitionNo));

    const socId = searchParams.get('societyDetailId') || searchParams.get('societydetailid') || searchParams.get('societyId');
    if (socId) {
      params.set('societyDetailId', String(socId));
      params.set('societydetailid', String(socId));
      params.set('societyId', String(socId));
    }

    const resolvedWingId = wingDetailsId || searchParams.get('wingDetailId') || searchParams.get('wingdetailid') || searchParams.get('wingId');
    if (resolvedWingId) {
      params.set('wingDetailId', String(resolvedWingId));
      params.set('wingdetailid', String(resolvedWingId));
      params.set('wingId', String(resolvedWingId));
    }
    const wName = searchParams.get('wingName') || searchParams.get('wingname');
    if (wName) params.set('wingName', String(wName));

    params.set('returnTab', 'apartment');
    params.set('from', 'apartment');
    params.set('hideWing', 'true');
    params.set('hideSociety', 'true');
    params.set('fromFooterEdit', 'true');

    router.push(`/${locale}/property-tax/ptis/QuickDataEntry/${propId}/Property?${params.toString()}`);
  };

  const getSignedColorClass = (_val: string | number | null | undefined, defaultClass = '') => {
    return defaultClass || 'font-mono font-semibold text-zinc-900';
  };

  return (
    <React.Fragment key={unit.id ? `${unit.id}-${idx}` : idx}>
      <tr
        onMouseEnter={() => onHoverUnit(unit.id)}
        onMouseLeave={() => onHoverUnit(null)}
        style={rowTintStyle(tintColor)}
        className={cn(tintColor && ROW_TINT_TEXT_CLASS, 'h-11 transition-colors cursor-pointer hover:bg-sky-50/60', isHovered && 'bg-sky-100/80', isExpanded && 'bg-sky-100/90')}
        onClick={() => {
          if (hasMappedProperties) {
            onToggleExpandRow(unit.id);
          }
        }}
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
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-sky-700" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEditUnit}
                className="p-1 rounded-md transition-all border cursor-pointer bg-sky-100 text-sky-700 hover:bg-sky-200 border-sky-300 shadow-2xs"
                title={t('editInQuickEntry') || 'Edit in Quick Data Entry'}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
            <span className="font-semibold text-zinc-600 text-[13px] min-w-[14px] text-center">{idx + 1}</span>
          </div>
        </td>
        <td className="px-2 py-1.5 font-semibold text-zinc-900 whitespace-nowrap border-r border-zinc-200" title={propTitle}>{unit.prop}</td>
        <td className="px-2 py-1.5 font-semibold text-zinc-900 whitespace-nowrap border-r border-zinc-200" title={unit.flatNo ? `${tc('flatNo')}: ${unit.flatNo}` : undefined}>{unit.flatNo || '-'}</td>
        <td className="px-2 py-1.5 text-blue-700 font-semibold whitespace-nowrap border-r border-zinc-200" title={unit.wgFl}>{unit.wgFl}</td>
        <td className="px-2 py-1.5 whitespace-nowrap border-r border-zinc-200" title={unit.typeFull || unit.type}>{unit.type}</td>
        <td className="px-2 py-1.5 whitespace-nowrap border-r border-zinc-200" title={unit.bhk}>{unit.bhk || '-'}</td>
        <td className="px-2 py-1.5 whitespace-nowrap border-r border-zinc-200" title={unit.cty}>{unit.cty}</td>
        <td className="px-2 py-1.5 text-center whitespace-nowrap border-r border-zinc-200">{unit.ayr}</td>
        <td className="px-2 py-1.5 text-center whitespace-nowrap border-r border-zinc-200">{unit.cyr}</td>
        <td className="px-2 py-1.5 whitespace-nowrap border-r border-zinc-200" title={unit.use}>{unit.use}</td>
        <td className="px-2.5 py-1.5 text-right font-semibold font-mono whitespace-nowrap border-r border-zinc-200">{unit.cptDisplay}</td>
        <td className="px-2.5 py-1.5 text-right font-semibold font-mono whitespace-nowrap border-r border-zinc-200">{unit.buaDisplay}</td>
        <td className="px-2 py-1.5 whitespace-nowrap border-r border-zinc-200">{unit.ocNo}</td>
        <td className="px-2 py-1.5 text-center whitespace-nowrap border-r border-zinc-200">{unit.occdt}</td>
        <td className="px-2.5 py-1.5 whitespace-nowrap border-r border-zinc-200" title={unit.rntr}>{unit.rntr}</td>
        <td className="px-2.5 py-1.5 text-right font-mono whitespace-nowrap border-r border-zinc-200">{unit.rentDisplay}</td>
        <td className="px-2 py-1.5 text-right font-semibold font-mono whitespace-nowrap border-r border-zinc-200">{unit.alv}</td>
        {showRv && (
          <td className={cn("px-2 py-1.5 text-right font-semibold font-mono whitespace-nowrap border-r border-zinc-200", getSignedColorClass(unit.rvDisplay))}>{unit.rvDisplay || '-'}</td>
        )}
        {showCv && (
          <td className={cn("px-2 py-1.5 text-right font-semibold font-mono whitespace-nowrap border-r border-zinc-200", getSignedColorClass(unit.cvDisplay || unit.cv))} title={`Capital Value: ${unit.cvDisplay || unit.cv || '-'}`}>
            {unit.cvDisplay || (unit.cv ? `₹${unit.cv.toLocaleString()}` : '-')}
          </td>
        )}
        <td className={cn("px-2.5 py-1.5 text-right font-semibold font-mono whitespace-nowrap border-r border-zinc-200", getSignedColorClass(unit.taxDisplay, "text-blue-900"))}>{unit.taxDisplay || '-'}</td>

        <td className="px-1.5 py-1.5 text-center whitespace-nowrap border-r border-zinc-200">
          <UnitMediaIconButton
            documentGuid={propPhotoGuid}
            kind="photo"
            title={`Unit ${unit.propFull ?? unit.prop} - Property Photo`}
            tooltip={t('viewPropPhoto') || 'Click to view Property Photo'}
          />
        </td>
        <td className="px-1.5 py-1.5 text-center whitespace-nowrap border-r border-zinc-200">
          <UnitMediaIconButton
            documentGuid={planPhotoGuid}
            kind="plan"
            title={`Unit ${unit.propFull ?? unit.prop} - Floor Plan`}
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

      {isExpanded && hasMappedProperties && (
        <tr className="bg-sky-50/40 border-b border-sky-200 transition-all">
          <td colSpan={showRv && showCv ? 23 : (showRv || showCv ? 22 : 21)} className="p-1.5 text-zinc-700 font-sans align-middle">
            <MappedPropertiesExpandedRow
              oldPropertyId={oldPropertyId}
              propertyId={unit.propertyId ?? (raw?.id ? Number(raw.id) : null)}
              wingDetailsId={wingDetailsId}
              societyDetailId={
                (rawAny?.societyDetailId ? Number(rawAny.societyDetailId) : null) ??
                (rawAny?.societydetailid ? Number(rawAny.societydetailid) : null) ??
                (rawAny?.societyId ? Number(rawAny.societyId) : null)
              }
              variant="survey"
              onViewDocument={onViewDocument}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};
