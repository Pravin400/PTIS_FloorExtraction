/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { DeleteButton, Tooltip } from '@/components/common';
import { FloorData } from '@/types/room-details.types';
import {
  getFloorDescription,
  getSubFloorDescription,
  getConstructionDescription,
  getUseDescription,
  getSubTypeDescription,
  formatCodeAndDescription,
  LookupData,
} from '@/lib/utils/floorSubmission/floor-mappers';

import { FloorCompleteSequenceValidationResult, FloorSequenceValidationResult } from '@/lib/validations/validateFloorSequence';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface UseFloorTableColumnsProps {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  floorLookup: LookupData[];
  subFloorLookup: LookupData[];
  constructionLookup: LookupData[];
  useLookup: LookupData[];
  subTypeData: LookupData[];
  sequenceValidationResult?: FloorSequenceValidationResult;
  completeSequenceValidationResult?: FloorCompleteSequenceValidationResult;
}

export const useFloorTableColumns = ({
  t,
  floorLookup,
  subFloorLookup,
  constructionLookup,
  useLookup,
  subTypeData,
  sequenceValidationResult,
  completeSequenceValidationResult,
}: UseFloorTableColumnsProps) => {
  const floorLabel = useAliasLabel('Floor', t('aliasFallback.floor'));
  const conYrLabel = useAliasLabel('Construction_Year', t('aliasFallback.constructionYear'));
  const asstYrLabel = useAliasLabel('Assessment', t('aliasFallback.assessment'));
  const conTypLabel = useAliasLabel('Construction_Type', t('aliasFallback.constructionType'));
  const useLabel = useAliasLabel('Use', t('aliasFallback.use'));
  const ocDateLabel = useAliasLabel('OC', t('aliasFallback.oc'));
  const subTypLabel = useAliasLabel('Sub_Type_Of_Use', t('aliasFallback.subTypeOfUse'));
  const roomsLabel = useAliasLabel('Rooms', t('aliasFallback.rooms'));
  const carpetAreaLabel = useAliasLabel('Carpet_Area', t('aliasFallback.carpetArea'));
  const builtupAreaLabel = useAliasLabel('Builtup_Area', t('aliasFallback.builtupArea'));

  return React.useMemo(() => {
    const formatArea = (val: unknown) => {
      if (val === undefined || val === null || val === '') return '0.00';
      const num = Number(val);
      return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    const formatDateCell = (row: FloorData, val: unknown, certCode: string, certTypeId: number) => {
      const rowRecord = row as unknown as Record<string, unknown>;
      const keyPrefix = certCode.toLowerCase();
      let raw = (rowRecord[`${keyPrefix}Date`] as string) || (rowRecord[`${keyPrefix}IssueDate`] as string) || val;
      if (!raw && Array.isArray(rowRecord.propertyCertificates)) {
        const certs = rowRecord.propertyCertificates as Record<string, unknown>[];
        const cert = certs.find(c => String(c.certificateTypeCode).toUpperCase() === certCode || Number(c.certificateTypeId) === certTypeId);
        if (cert && cert.issueDate) raw = String(cert.issueDate);
      }
      const str = raw ? String(raw).trim() : '';
      if (!str || str === '-' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') {
        return '-';
      }
      const dateOnly = str.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        const [yyyy, mm, dd] = dateOnly.split('-');
        return `${dd}-${mm}-${yyyy}`;
      }
      return str;
    };

    return [
      {
        key: 'isTaxable',
        label: t('floor.taxable'),
        tooltip: t('floor.taxable'),
        cellClassName: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (value: unknown) => {
          const isYes = value === 'Yes' || value === true || value === 'true';
          const isNo = value === 'No' || value === false || value === 'false';
          const titleText = isYes ? (t('floor.yes') || 'Yes') : isNo ? (t('floor.no') || 'No') : String(value ?? '-');
          return (
            <div className="flex items-center justify-center font-bold text-[11px]" title={titleText}>
              {isYes && <span className="text-emerald-600 font-bold">{t('floor.yes') || 'Yes'}</span>}
              {isNo && <span className="text-rose-600 font-bold">{t('floor.no') || 'No'}</span>}
              {!isYes && !isNo && <span className="text-slate-400 font-bold">-</span>}
            </div>
          );
        },
      },
      {
        key: 'floor',
        label: floorLabel,
        tooltip: floorLabel,
        cellClassName: 'max-w-[100px]',
        headerClassName: 'whitespace-nowrap',
        render: (val: unknown, row: FloorData) => {
          const rowRecord = row as unknown as Record<string, unknown>;
          const code = (rowRecord.floorCode as string) || (row.floorCode as string) ||
            floorLookup?.find((f) => String(f.floorId || f.id || f.ID) === String(row.floorId || row.floorID || val))?.floorCode ||
            floorLookup?.find((f) => String(f.floorId || f.id || f.ID) === String(row.floorId || row.floorID || val))?.code ||
            (typeof val === 'string' && val.includes(' - ') ? val.split(' - ')[0].trim() : '');
          const rawDesc = (rowRecord.floorDescription as string) ||
            (row.floorDescription as string) ||
            getFloorDescription(String((row.floorId || row.floorID || val) ?? ''), floorLookup) ||
            String(val ?? '');

          const fullText = formatCodeAndDescription(code, rawDesc) || String(val ?? '');
          const displayText = code ? String(code) : fullText;

          const numMismatch = completeSequenceValidationResult?.numberMismatches?.find(
            (m) => String(m.floorId) === String(row.id || row.floorId || row.floorID)
          );

          if (numMismatch) {
            return (
              <Tooltip placement="bottom" content={numMismatch.message}>
                <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-[12px] cursor-help">
                  ⚠️ {displayText}
                </span>
              </Tooltip>
            );
          }

          return (
            <Tooltip placement="bottom" content={fullText || displayText}>
              <span className="block truncate cursor-default font-semibold text-slate-800 text-[12px]">{displayText}</span>
            </Tooltip>
          );
        },
      },
      {
        key: 'subFloor',
        label: t('floor.subFloor'),
        tooltip: t('floor.subFloor'),
        cellClassName: 'max-w-[150px]',
        headerClassName: 'whitespace-nowrap',
        render: (val: unknown, row: FloorData) => {
          const rowRecord = row as unknown as Record<string, unknown>;
          const foundSubFloor = subFloorLookup?.find(
            (s) => String(s.subFloorId || s.id || s.ID) === String(row.subFloorId || row.subFloorID || val)
          );
          const code = (rowRecord.subFloorCode as string) || (row.subFloorCode as string) ||
            (foundSubFloor ? ((foundSubFloor as Record<string, unknown>).subFloorCode as string || foundSubFloor.code as string || foundSubFloor.floorCode as string) : '') ||
            (typeof val === 'string' && val.includes(' - ') ? val.split(' - ')[0].trim() : '');
          const rawDesc = (rowRecord.subFloorDescription as string) ||
            (row.subFloorDescription as string) ||
            getSubFloorDescription(String((row.subFloorId || row.subFloorID || val) ?? ''), subFloorLookup) ||
            (val && val !== '-' ? String(val) : '');

          const fullText = formatCodeAndDescription(code, rawDesc);
          const displayText = (code ? String(code) : fullText) || '-';
          return (
            <Tooltip placement="bottom" content={fullText || displayText}>
              <span className="block truncate cursor-default font-semibold text-slate-800 text-[12px]">{displayText}</span>
            </Tooltip>
          );
        },
      },
      {
        key: 'conYr',
        label: conYrLabel,
        tooltip: conYrLabel,
        cellClassName: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (val: unknown, row: FloorData) => {
          const rowRecord = row as unknown as Record<string, unknown>;
          const text = String((rowRecord.constructionYear as string) || val || '-');
          const mismatch = (completeSequenceValidationResult?.yearMismatches || sequenceValidationResult?.mismatches)?.find(
            (m) => String(m.floorId) === String(row.id || row.floorId || row.floorID)
          );

          if (mismatch) {
            return (
              <Tooltip placement="bottom" content={mismatch.message}>
                <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-[12px] cursor-help">
                  ⚠️ {text}
                </span>
              </Tooltip>
            );
          }

          return <span className="font-semibold text-slate-800 text-[12px]">{text}</span>;
        },
      },
      {
        key: 'asstYr',
        label: asstYrLabel,
        tooltip: asstYrLabel,
        cellClassName: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (val: unknown, row: FloorData) => {
          const rowRecord = row as unknown as Record<string, unknown>;
          const text = String((rowRecord.assessmentYear as string) || val || '-');
          return <span className="font-semibold text-slate-800 text-[12px]">{text}</span>;
        },
      },
      {
        key: 'conTyp',
        label: conTypLabel,
        tooltip: conTypLabel,
        cellClassName: 'max-w-[150px]',
        headerClassName: 'whitespace-nowrap',
        render: (val: unknown, row: FloorData) => {
          const rowRecord = row as unknown as Record<string, unknown>;
          const foundCon = constructionLookup?.find(
            (c) => String(c.constructionTypeId || c.id || c.ID) === String(row.constructionTypeId || row.constructionId || val)
          );
          const code = (rowRecord.constructionCode as string) || (row.constructionCode as string) ||
            (foundCon ? ((foundCon as Record<string, unknown>).constructionCode as string || foundCon.code as string) : '') ||
            (typeof val === 'string' && val.includes(' - ') ? val.split(' - ')[0].trim() : '');
          const rawDesc = (rowRecord.constructionTypeDescription as string) ||
            (row.constructionTypeDescription as string) ||
            getConstructionDescription(String((row.constructionTypeId || row.constructionId || val) ?? ''), constructionLookup) ||
            String(val ?? '');

          const fullText = formatCodeAndDescription(code, rawDesc) || String(val ?? '');
          const displayText = code ? String(code) : fullText;
          return (
            <Tooltip placement="bottom" content={fullText || displayText}>
              <span className="block truncate cursor-default font-semibold text-slate-800 text-[12px]">{displayText}</span>
            </Tooltip>
          );
        },
      },
      {
        key: 'use',
        label: useLabel,
        tooltip: useLabel,
        cellClassName: 'max-w-[100px]',
        headerClassName: 'whitespace-nowrap',
        render: (val: unknown, row: FloorData) => {
          const rowRecord = row as unknown as Record<string, unknown>;
          const foundUse = useLookup?.find(
            (u) => String(u.typeOfUseId || u.id || u.ID) === String(row.typeOfUseId || row.useId || val)
          );
          const code = (rowRecord.typeOfUseCode as string) || (row.typeOfUseCode as string) ||
            (foundUse ? ((foundUse as Record<string, unknown>).typeOfUseCode as string || foundUse.code as string) : '') ||
            (typeof val === 'string' && val.includes(' - ') ? val.split(' - ')[0].trim() : '');
          const rawDesc = (rowRecord.typeOfUseDescription as string) ||
            (row.typeOfUseDescription as string) ||
            getUseDescription(String((row.typeOfUseId || row.useId || val) ?? ''), useLookup) ||
            String(val ?? '');

          const fullText = formatCodeAndDescription(code, rawDesc) || String(val ?? '');
          const displayText = code ? String(code) : fullText;
          return (
            <Tooltip placement="bottom" content={fullText || displayText}>
              <span className="block truncate cursor-default font-semibold text-slate-800 text-[12px]">{displayText}</span>
            </Tooltip>
          );
        },
      },
      {
        key: 'ccDate',
        label: (() => { try { return t('building.ccDate') || 'CC Date'; } catch (_e) { return 'CC Date'; } })(),
        tooltip: (() => { try { return t('building.ccDate') || 'CC Date'; } catch (_e) { return 'CC Date'; } })(),
        cellClassName: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (val: unknown, row: FloorData) => {
          const text = formatDateCell(row, val, 'CC', 1);
          return <span className="font-semibold text-slate-800 text-[12px]">{text}</span>;
        },
      },
      {
        key: 'ocDate',
        label: ocDateLabel,
        tooltip: ocDateLabel,
        cellClassName: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (val: unknown, row: FloorData) => {
          const text = formatDateCell(row, val, 'OC', 2);
          return <span className="font-semibold text-slate-800 text-[12px]">{text}</span>;
        },
      },
      {
        key: 'subTyp',
        label: subTypLabel,
        tooltip: subTypLabel,
        cellClassName: 'max-w-[100px]',
        headerClassName: 'whitespace-nowrap',
        render: (val: unknown) => {
          const text = getSubTypeDescription(String(val ?? ''), subTypeData) || String(val ?? '');
          return (
            <Tooltip placement="bottom" content={text}>
              <span className="block truncate cursor-default">{text}</span>
            </Tooltip>
          );
        },
      },
      {
        key: 'renter',
        label: t('floor.renter'),
        tooltip: t('floor.renter'),
        cellClassName: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
        render: (value: unknown) => (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${value === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
          >
            {value === 'Yes' ? t('floor.yes') : t('floor.no')}
          </span>
        ),
      },
      {
        key: 'rooms',
        label: roomsLabel,
        tooltip: roomsLabel,
        cellClassName: 'whitespace-nowrap',
        headerClassName: 'whitespace-nowrap',
      },
      {
        key: 'areaSqFt',
        label: `${carpetAreaLabel} ${t('floor.sqFtSqM')}`,
        tooltip: `${carpetAreaLabel} ${t('floor.sqFtSqM')}`,
        cellClassName: 'whitespace-nowrap font-medium',
        headerClassName: 'whitespace-normal min-w-[120px] max-w-[150px] leading-tight',
        render: (_value: unknown, row: FloorData) => {
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-blue-700 font-semibold">{formatArea(row.areaSqFt)}</span>
              <span className="text-[10px] text-black font-bold">
                ({formatArea(row.areaSqM)} {t('floor.sqM')})
              </span>
            </div>
          );
        },
      },
      {
        key: 'builtupAreaSqFt',
        label: `${builtupAreaLabel} ${t('floor.sqFtSqM')}`,
        tooltip: `${builtupAreaLabel} ${t('floor.sqFtSqM')}`,
        cellClassName: 'whitespace-nowrap font-medium',
        headerClassName: 'whitespace-normal min-w-[120px] max-w-[150px] leading-tight',
        render: (_value: unknown, row: FloorData) => {
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-700 font-semibold">{formatArea(row.builtupAreaSqFt)}</span>
              <span className="text-[10px] text-black font-bold">
                ({formatArea(row.builtupAreaSqM)} {t('floor.sqM')})
              </span>
            </div>
          );
        },
      },
    ];
  }, [asstYrLabel, builtupAreaLabel, carpetAreaLabel, completeSequenceValidationResult, conTypLabel, conYrLabel, constructionLookup, floorLookup, floorLabel, ocDateLabel, roomsLabel, sequenceValidationResult, subFloorLookup, subTypLabel, subTypeData, t, useLabel, useLookup]);
};

export const renderFloorActions = (t: (key: string) => string, handleDeleteFloor: (floor: FloorData) => void) => {
  const FloorActionsCell = (row: FloorData) => {
    return (
      <DeleteButton
        aria-label={t('common.delete')}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          handleDeleteFloor(row);
        }}
      />
    );
  };

  FloorActionsCell.displayName = 'FloorActionsCell';

  return FloorActionsCell;
};
