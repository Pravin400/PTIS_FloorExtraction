'use client';

import type { Column } from '@/components/common';
import { Tooltip } from '@/components/common';
import type { SearchResult, ZoneOption, WardOption } from '@/types/property-search';
import {
  COLUMN_WIDTHS,
  formatDisplayText,
  formatInr,
  NUMERIC_CELL,
  WRAP_CELL,
  WRAP_HEADER,
} from './result-styles';
import { UpicLinkCell } from './UpicLinkCell';
import { CopyCell } from './CopyCell';
import { RvCvCell } from './RvCvCell';

type Translator = (key: string, values?: Record<string, string | number | Date>) => string;

function withFixedWidth(
  column: Column<SearchResult> & { tooltip?: string },
  width: string
): Column<SearchResult> {
  const { tooltip, ...rest } = column;
  const label = tooltip ? (
    <Tooltip content={tooltip} placement="top">
      <span className="cursor-default">{column.label}</span>
    </Tooltip>
  ) : (
    column.label
  );

  return {
    ...rest,
    label,
    width,
    headerClassName: column.headerClassName ?? WRAP_HEADER,
    cellClassName: column.cellClassName ?? WRAP_CELL,
    render:
      column.render ??
      ((value) => {
        const displayVal = formatDisplayText(String(value ?? ''));
        if (displayVal === '-') return <span>-</span>;
        return <span title={displayVal}>{displayVal}</span>;
      }),
  };
}

function ZoneWardCell({
  row,
  zoneOptions,
  allWardOptions,
}: {
  row: SearchResult;
  zoneOptions: ZoneOption[];
  allWardOptions: WardOption[];
}) {
  const displayZone = row.zone?.trim() || '';
  const displayWard = row.ward?.trim() || '';

  const zoneOpt = zoneOptions.find(
    (opt) => opt.label.startsWith(`${displayZone} - `) || opt.label === displayZone
  );
  const zoneLabel = zoneOpt ? zoneOpt.label : displayZone;

  const wardOpt = allWardOptions.find(
    (opt) => opt.label.startsWith(`${displayWard} - `) || opt.label === displayWard
  );
  const wardLabel = wardOpt ? wardOpt.label : displayWard;

  const tooltipText = [zoneLabel, wardLabel].filter(Boolean).join(' / ');

  return (
    <div
      className="flex flex-col gap-0.5 break-words whitespace-normal text-center items-center justify-center w-full"
      title={tooltipText}
    >
      <span className="font-semibold text-gray-800 text-[11px]">
        {zoneLabel ? formatDisplayText(zoneLabel) : '-'}
      </span>
      <span className="text-[11px] text-gray-700 font-semibold leading-tight block">
        {wardLabel ? wardLabel : '-'}
      </span>
    </div>
  );
}

function PropertyNoPartitionCell({ row, t }: { row: SearchResult; t: Translator }) {
  const propNo = row.propertyNo?.trim() || '';
  const partNo = row.partitionNo?.trim() || '';
  const oldProp = row.oldPropertyNo?.trim() || '';

  const primary = partNo ? `${propNo}-${partNo}` : propNo;

  return (
    <div className="flex flex-col gap-0.5 break-words whitespace-normal text-center items-center justify-center w-full">
      {primary ? (
        <CopyCell value={primary} label={t('columns.propertyNo')} />
      ) : (
        <span className="text-xs text-gray-400">-</span>
      )}
      {oldProp ? (
        <Tooltip content={oldProp} placement="top">
          <span className="text-xs font-medium text-slate-700 cursor-default border-b border-dashed border-slate-400 max-w-full truncate block px-1">
            {oldProp}
          </span>
        </Tooltip>
      ) : (
        <span className="text-xs text-gray-400">-</span>
      )}
    </div>
  );
}

export function OwnerOccupierCell({ row }: { row: SearchResult }) {
  const rawHolder = row.holderName?.trim() || '';
  const isPlaceholderHolder = rawHolder.toLowerCase() === 'the holder';
  const holder = isPlaceholderHolder ? '' : rawHolder;
  const holderMr = isPlaceholderHolder ? '' : row.holderNameMarathi?.trim() || '';
  const occupier = row.occupierName?.trim() || '';
  const occupierMr = row.occupierNameMarathi?.trim() || '';

  const tooltipParts: string[] = [];
  if (holder) {
    tooltipParts.push(holderMr ? `${holder} (${holderMr})` : holder);
  }
  if (occupier || occupierMr) {
    tooltipParts.push(occupierMr ? `${occupier} (${occupierMr})` : occupier);
  }
  const tooltipText = tooltipParts.join(' / ');

  return (
    <div
      className="flex flex-col gap-1.5 break-words whitespace-normal text-center items-center justify-center w-full"
      title={tooltipText}
    >
      <div className="flex flex-col gap-0.5 items-center justify-center w-full">
        {holder ? (
          <>
            <span className="font-bold text-gray-900">{holder}</span>
            {holderMr ? (
              <span className="text-xs text-gray-500 font-normal">{holderMr}</span>
            ) : null}
          </>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 pt-1 border-t border-slate-100 items-center justify-center w-full">
        {occupier || occupierMr ? (
          <>
            <span className="text-xs font-medium text-slate-700">
              {formatDisplayText(occupier)}
            </span>
            {occupierMr ? (
              <span className="text-[10px] text-gray-400 font-normal">{occupierMr}</span>
            ) : null}
          </>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </div>
    </div>
  );
}

function MobileAlternateCell({ row, t }: { row: SearchResult; t: Translator }) {
  const primary = row.mobile?.trim() || '';
  const alt = row.alternateMobile?.trim() || '';
  const occ = row.occupierMobile?.trim() || '';
  
  let tooltipText = primary;
  if (alt) tooltipText += ` (${t("columns.alt")}: ${alt})`;
  if (occ) tooltipText += ` (Occupier: ${occ})`;

  return (
    <div
      className="flex flex-col gap-0.5 break-words whitespace-normal text-center items-center justify-center w-full"
      title={tooltipText}
    >
      {primary ? (
        <CopyCell value={primary} label={t('columns.mobile')} />
      ) : (
        <span className="text-xs text-gray-400">-</span>
      )}
      <span className="text-xs text-slate-700">
        {alt ? `${t("columns.alt")}: ${alt}` : occ ? `Occupier: ${occ}` : "-"}
      </span>
    </div>
  );
}

export function buildPropertySearchColumns(
  t: Translator,
  locale: string,
  zoneOptions: ZoneOption[],
  allWardOptions: WardOption[],
  viewMode?: 'properties' | 'units'
): Column<SearchResult>[] {
  return [
    withFixedWidth(
      {
        key: 'upicId',
        label: t('columns.upicId'),
        tooltip: t('columns.upicId'),
        render: (value, row) => {
          const displayWard = row.ward?.trim() || '';
          const wardOpt = allWardOptions.find(
            (opt) => opt.label.startsWith(`${displayWard} - `) || opt.label === displayWard
          );
          return (
            <UpicLinkCell
              upicId={String(value ?? '')}
              propertyId={row.propertyId}
              wardNo={row.ward}
              wardId={row.wardId ? Number(row.wardId) : wardOpt?.id}
              propertyNo={row.propertyNo}
              partitionNo={row.partitionNo}
              societyDetailId={row.societyDetailId || row.societyId}
              wingDetailId={row.wingDetailId || row.wingId}
              locale={locale}
              copyLabel={t('columns.upicId')}
            />
          );
        },
      },
      COLUMN_WIDTHS.upicId
    ),
    withFixedWidth(
      {
        key: 'zoneWard',
        label: t('columns.zoneWard'),
        tooltip: t('columns.zoneWard'),
        align: 'center',
        render: (_, row) => (
          <ZoneWardCell row={row} zoneOptions={zoneOptions} allWardOptions={allWardOptions} />
        ),
      },
      COLUMN_WIDTHS.zoneWard
    ),
    withFixedWidth(
      {
        key: 'propertyPartition',
        label: (
          <div className="flex flex-col items-center justify-center text-center leading-tight gap-0.5">
            <span className="block">{t('columns.propertyPartition')}</span>
            <span className="block">{t('columns.oldPropertyNoShort')}</span>
          </div>
        ),
        tooltip: t('columns.propertyPartitionTooltip'),
        align: 'center',
        render: (_, row) => <PropertyNoPartitionCell row={row} t={t} />,
      },
      COLUMN_WIDTHS.propertyPartition
    ),
    withFixedWidth(
      {
        key: 'category',
        label: t('columns.category'),
        tooltip: t('columns.category'),
        align: 'center',
        render: (value, row) => {
          const displayVal = formatDisplayText(String(value ?? ''));
          const categoryLower = displayVal.toLowerCase();

          // 1. Apartment category: show Unit count
          if (categoryLower === 'apartment' && viewMode !== 'units') {
            const unitCount = row.childUnitCount ?? row.propertyCount ?? 0;
            return (
              <div
                className="flex flex-col items-center justify-center text-center leading-tight gap-0.5"
                title={t('apartmentUnits', { count: unitCount })}
              >
                <span className="font-semibold text-gray-800 text-xs">{displayVal}</span>
                <span className="text-[11px] text-gray-700 font-semibold block">
                  {t('unit')}: {unitCount}
                </span>
              </div>
            );
          }

          // 2. Individual category: do NOT display Flat No or Wing sub-labels
          if (categoryLower === 'individual') {
            return <span className="font-semibold text-gray-800 text-xs">{displayVal}</span>;
          }

          // 3. Other categories: parse and display Wing / Flat No if present
          let wing = row.wing ? String(row.wing).trim() : '';
          let flatNo = row.flatNo ? String(row.flatNo).trim() : '';
          const wingFlatNo = row.wingFlatNo ? String(row.wingFlatNo).trim() : '';

          if (!wing && !flatNo && wingFlatNo) {
            if (wingFlatNo.includes('-')) {
              const parts = wingFlatNo.split('-');
              if (parts.length === 2) {
                wing = parts[0].trim();
                flatNo = parts[1].trim();
              } else {
                flatNo = wingFlatNo;
              }
            } else if (wingFlatNo.includes('/')) {
              const parts = wingFlatNo.split('/');
              if (parts.length === 2) {
                wing = parts[0].trim();
                flatNo = parts[1].trim();
              } else {
                flatNo = wingFlatNo;
              }
            } else {
              flatNo = wingFlatNo;
            }
          }

          if (wing || flatNo) {
            return (
              <div className="flex flex-col items-center justify-center text-center leading-tight gap-0.5">
                <span className="text-gray-800 text-xs font-semibold">{displayVal}</span>
                {wing && (
                  <span className="text-[11px] text-[#004c8c] font-semibold block">
                    {t('columns.wing', { wing })}
                  </span>
                )}
                {flatNo && (
                  <span className="text-[11px] text-[#047857] font-semibold block">
                    {t('columns.flatNo', { flatNo })}
                  </span>
                )}
              </div>
            );
          }

          return <span className="font-semibold text-gray-800 text-xs">{displayVal}</span>;
        },
      },
      COLUMN_WIDTHS.category
    ),
    withFixedWidth(
      {
        key: 'societyName',
        label: t('columns.societyNameShort'),
        tooltip: t('columns.societyName'),
        align: 'center',
      },
      COLUMN_WIDTHS.societyName
    ),
    withFixedWidth(
      {
        key: 'description',
        label: t('columns.descriptionShort'),
        tooltip: t('columns.description'),
        align: 'center',
      },
      COLUMN_WIDTHS.description
    ),
    withFixedWidth(
      {
        key: 'ownerOccupier',
        label: t('columns.ownerOccupier'),
        tooltip: t('columns.ownerOccupier'),
        align: 'center',
        render: (_, row) => <OwnerOccupierCell row={row} />,
      },
      COLUMN_WIDTHS.ownerOccupier
    ),
    withFixedWidth(
      {
        key: 'mobileAlternate',
        label: t('columns.mobileAlternate'),
        tooltip: t('columns.mobileAlternateTooltip'),
        align: 'center',
        headerClassName: WRAP_HEADER,
        render: (_, row) => <MobileAlternateCell row={row} t={t} />,
      },
      COLUMN_WIDTHS.mobileAlternate
    ),
    withFixedWidth(
      {
        key: 'rvCv',
        label: t('columns.rvCv'),
        tooltip: t('columns.rvCvTooltip') ?? t('columns.rvCv'),
        align: 'center',
        cellClassName: NUMERIC_CELL,
        render: (_, row) => <RvCvCell rv={row.rv} cv={row.cv} />,
      },
      COLUMN_WIDTHS.rvCv
    ),
    withFixedWidth(
      {
        key: 'totalTax',
        label: t('columns.totalTax'),
        tooltip: t('columns.totalTax'),
        align: 'center',
        render: (value) => (
          <span className="font-medium text-gray-800 whitespace-nowrap tabular-nums">
            {formatInr(Number(value ?? 0))}
          </span>
        ),
      },
      COLUMN_WIDTHS.totalTax
    ),
    withFixedWidth(
      {
        key: 'address',
        label: t('columns.address'),
        tooltip: t('columns.address'),
        align: 'center',
      },
      COLUMN_WIDTHS.address
    ),
    withFixedWidth(
      {
        key: 'scrollbarSpacer',
        label: '',
        render: () => null,
      },
      COLUMN_WIDTHS.scrollbarSpacer
    ),
  ];
}
