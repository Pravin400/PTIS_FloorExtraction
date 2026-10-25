import { Column } from '@/components/common/MasterTable';
import { PropertyCombineDetails } from '@/types/combine-property.types';
import { Checkbox } from '@/components/common/checkbox';
import { PreviewButton } from '@/components/common/ActionButtons';
import { useState } from 'react';
import { Tooltip } from '@/components/common/Tooltip';

export type PropertyRow = PropertyCombineDetails & Record<string, unknown>;

function ExpandableText({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return <span className="text-gray-400">—</span>;

  const words = text.split(/\s+/);
  const hasManyWords = words.length > 5;
  const isSingleVeryLongWord = words.length === 1 && text.length > 25;

  if (!hasManyWords && !isSingleVeryLongWord) {
    return <span className="text-gray-700">{text}</span>;
  }

  let displayText = '';
  if (isExpanded) {
    displayText = text;
  } else {
    if (hasManyWords) {
      displayText = words.slice(0, 5).join(' ') + '...';
    } else {
      displayText = text.substring(0, 25) + '...';
    }
  }

  return (
    <Tooltip content={isExpanded ? 'Click to collapse' : 'Click to expand'}>
      <span
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors font-medium break-all"
      >
        {displayText}
      </span>
    </Tooltip>
  );
}

export interface CombinePropertyColumnAliasLabels {
  propertyNo?: string;
}

export const getCombinePropertyColumns = (
  t: (key: string) => string,
  reviewData: PropertyCombineDetails[],
  checkedPropertyIds?: Set<number>,
  onToggleCheck?: (propertyId: number) => void,
  onToggleAll?: () => void,
  selectedBasePropertyId?: string,
  aliasLabels?: CombinePropertyColumnAliasLabels
): Column<PropertyRow>[] => [
  // Checkbox column — uses '_checkbox' key to avoid duplicate with 'propertyId' SR.NO. column
  {
    key: '_checkbox' as keyof PropertyRow,
    label: (
      <Checkbox
        checked={!!checkedPropertyIds && checkedPropertyIds.size === reviewData.length && reviewData.length > 0}
        onCheckedChange={() => onToggleAll?.()}
        aria-label="Select all properties"
      />
    ),
    align: 'center',
    width: '45px',
    render: (_val, row) => {
      if (String(row.propertyId) === selectedBasePropertyId) {
        return null;
      }
      const propertyId = row.propertyId as number;
      return (
        <Checkbox
          checked={checkedPropertyIds?.has(propertyId) ?? false}
          onCheckedChange={() => onToggleCheck?.(propertyId)}
          aria-label={`Select property ${propertyId}`}
        />
      );
    },
  },
  {
    key: 'propertyId',
    label: t('srNo'),
    align: 'center',
    width: '60px',
    render: (_val, _row, idx) => (
      <span className="text-gray-600 font-semibold text-[12px]">{idx + 1}</span>
    ),
  },
  {
    key: 'propertyNo',
    label: aliasLabels?.propertyNo || t('propertyNo'),
    align: 'center',
    width: '180px',
    render: (_val, row) => {
      const ward = row.wardNo || '';
      const prop = row.propertyNo || '';
      const part = row.partitionNo || '';
      const displayValue = [ward, prop, part].filter(Boolean).join('-');

      const isBase = String(row.propertyId) === selectedBasePropertyId;
      const tooltipText = isBase
        ? t('basePropertyTooltip') || 'This is the base property'
        : t('combinePropertyTooltip') || 'This property we are combining in base property';

      return (
        <Tooltip content={tooltipText}>
          <span className="text-blue-600 font-semibold text-[12px] cursor-pointer inline-block w-full text-center">
            {displayValue}
          </span>
        </Tooltip>
      );
    },
  },
  {
    key: 'oldPropertyNo',
    label: `Old ${aliasLabels?.propertyNo || t('propertyNo')}`,
    align: 'center',
    width: '110px',
  },
  {
    key: 'propertyDescription',
    label: t('propertyType'),
    align: 'left',
    width: '120px',
  },
  {
    key: 'ownerName',
    label: t('ownerName'),
    align: 'left',
    render: (val, _row, idx) => {
      // Highlight only if NOT same as first row
      const firstOwner = reviewData[0]?.ownerName;
      const isMismatch = idx > 0 && val !== firstOwner;
      return (
        <span className={isMismatch ? 'text-red-500 font-semibold' : 'text-gray-800 font-medium'}>
          {String(val ?? '-')}
        </span>
      );
    },
  },
  {
    key: 'occupierName',
    label: t('occupierName'),
    align: 'left',
    render: (val) => (
      <span className="text-gray-700">{String(val ?? '') || '—'}</span>
    ),
  },
  {
    key: 'taxAmount',
    label: t('currentTax'),
    align: 'right',
    width: '110px',
    render: (val) => (
      /* eslint-disable-next-line i18next/no-literal-string */
      <span className="font-semibold text-gray-800">
        ₹{Number(val ?? 0).toLocaleString('en-IN')}
      </span>
    ),
  },
  {
    key: 'pendingAmount',
    label: t('pendingTax'),
    align: 'right',
    width: '110px',
    render: (val) => (
      /* eslint-disable-next-line i18next/no-literal-string */
      <span className="font-semibold text-gray-800">
        ₹{Number(val ?? 0).toLocaleString('en-IN')}
      </span>
    ),
  },
];

export const getCombinePropertyHistoryColumns = (
  t: (key: string) => string,
  onPreviewClick?: (row: PropertyRow) => void,
  aliasLabels?: CombinePropertyColumnAliasLabels
): Column<PropertyRow>[] => {
  const columns: Column<PropertyRow>[] = [
    {
      key: 'propertyNo',
      label: aliasLabels?.propertyNo || t('propertyNo'),
      align: 'center',
      width: '180px',
      render: (_val, row) => {
        const ward = row.wardNo || '';
        const prop = row.propertyNo || '';
        const part = row.partitionNo || '';
        const displayValue = [ward, prop, part].filter(Boolean).join('-');
        return (
          <span className="text-gray-800 font-semibold text-[12px]">
            {displayValue}
          </span>
        );
      },
    },
    { key: 'oldPropertyNo', label: `Old ${aliasLabels?.propertyNo || t('propertyNo')}`, align: 'center', width: '100px' },
    { key: 'propertyDescription', label: t('propertyType'), align: 'left' },
    { key: 'ownerName', label: t('ownerName'), align: 'left' },
    { key: 'occupierName', label: t('occupierName'), align: 'left' },
    {
      key: 'taxAmount',
      label: t('currentTax') || 'Tax Amount',
      align: 'right',
      width: '110px',
      render: (val) => (
        /* eslint-disable-next-line i18next/no-literal-string */
        <span className="font-semibold text-gray-800">
          ₹{Number(val ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'pendingAmount',
      label: t('pendingTax') || 'Pending Amount',
      align: 'right',
      width: '110px',
      render: (val) => (
        /* eslint-disable-next-line i18next/no-literal-string */
        <span className="font-semibold text-gray-800">
          ₹{Number(val ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'combineReason',
      label: t('remarkLabel') || 'Reason',
      align: 'left',
      render: (val) => <ExpandableText text={String(val ?? '')} />,
    },
  ];

  if (onPreviewClick) {
    columns.push({
      key: '_action' as keyof PropertyRow,
      label: t('action') || 'Action',
      align: 'center',
      width: '60px',
      render: (_val, row) => (
        <PreviewButton
          size="sm"
          aria-label="View Details"
          label={t('viewDetails')}
          onClick={() => onPreviewClick(row)}
        />
      ),
    });
  }

  return columns;
};

