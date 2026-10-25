import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Tooltip } from '@/components/common/Tooltip';

export type Column<T = Record<string, unknown>> = {
  key: string;
  label: string;
  headerTooltip?: boolean | string;
  cellClassName?: string;
  headerClassName?: string;
  groupRowSpan?: boolean;
  render?: (value: unknown, row?: T, rowIndex?: number) => React.ReactNode;
};

export const COLUMN_ORDER = {
  amenities: [
    'propertyNo',
    'floor',
    'constructionYear',
    'assessmentYear',
    'apartmentType',
    'typeOfUse',
    'carpetArea',
    'builtupArea',
    'ocDate',
    'oldRV',
    'newRV',
    'totalTax',
  ],

  commercial: [
    'propertyNo',
    'flatOrShopNo',
    'flatOrShopName',
    'wing',
    'ownerName',
    'occupierName',
    'rentMonthly',
    'renterName',
    'propertyTypeName',
    'floor',
    'constructionYear',
    'ocDate',
    'carpetArea',
    'builtupArea',
    'typeOfUse',
    'constructionType',
    'oldRV',
    'rateableValue',
    'newTaxTotalRV',
    'capitalValue',
    'newTaxTotalCV',
    'oldTotalTax',
    'totalTax',
    'apartmentType',
  ],

  residential: [
    'propertyNo',
    'flatOrShopNo',
    'wing',
    'floor',
    'ownerName',
    'occupierName',
    'rentMonthly',
    'renterName',
    'propertyTypeName',
    'typeOfUse',
    'bhk',
    'apartmentType',
    'carpetArea',
    'builtupArea',
    'oldRV',
    'rateableValue',
    'newTaxTotalRV',
    'capitalValue',
    'newTaxTotalCV',
    'totalTax',
    'ocDate',
    'assessmentYear',
    'constructionYear',
    'mobileNo',
    'emailId',
    'toiletCount',
  ],
};

const COLUMN_FULL_NAME_KEYS: Record<string, string> = {
  propertyNo: 'tooltips.propertyNo',
  wing: 'tooltips.wing',
  flatOrShopNo: 'tooltips.flatOrShopNo',
  flatOrShopName: 'tooltips.flatOrShopName',
  ownerName: 'tooltips.ownerName',
  occupierName: 'tooltips.occupierName',
  ocDate: 'tooltips.ocDate',
  oldRV: 'tooltips.oldRV',
  rateableValue: 'tooltips.rateableValue',
  rentMonthly: 'tooltips.rentMonthly',
  renterName: 'tooltips.renterName',
  typeOfUse: 'tooltips.typeOfUse',
  propertyTypeName: 'tooltips.propertyTypeName',
  apartmentType: 'tooltips.apartmentType',
  assessmentYear: 'tooltips.assessmentYear',
  constructionYear: 'tooltips.constructionYear',
  constructionType: 'tooltips.constructionType',
  toiletCount: 'tooltips.toiletCount',
  bhk: 'tooltips.bhk',
  carpetArea: 'tooltips.carpetArea',
  builtupArea: 'tooltips.builtupArea',
  capitalValue: 'tooltips.capitalValue',
  oldTotalTax: 'tooltips.oldTotalTax',
  newTaxTotalRV: 'tooltips.newTaxTotalRV',
  newTaxTotalCV: 'tooltips.newTaxTotalCV',
  mobileNo: 'tooltips.mobileNo',
  emailId: 'tooltips.emailId',
  cv: 'tooltips.cv',
  newRV: 'tooltips.newRV',
  totalTax: 'tooltips.totalTax',
};

// Wrapper to add header tooltips with full names from translations
const withHeaderTooltips = <T,>(columns: Column<T>[], t: (key: string) => string): Column<T>[] =>
  columns.map((col) => {
    let tooltip: string | undefined;

    // 1. If headerTooltip is a STRING → use it directly
    if (typeof col.headerTooltip === 'string') {
      tooltip = col.headerTooltip;
    }

    // 2. If headerTooltip is TRUE → use translation mapping
    else if (col.headerTooltip === true) {
      tooltip = COLUMN_FULL_NAME_KEYS[col.key] ? t(COLUMN_FULL_NAME_KEYS[col.key]) : col.label;
    }

    // 3. If undefined → fallback to mapping or label
    else {
      tooltip = COLUMN_FULL_NAME_KEYS[col.key] ? t(COLUMN_FULL_NAME_KEYS[col.key]) : col.label;
    }

    return {
      ...col,
      headerTooltip: tooltip,
    };
  });
// Helper function to render comma-separated values with count & tooltip
const renderMultiRecord = (value: unknown): React.ReactNode => {
  if (value === null || typeof value === 'undefined') return '-';
  const str = String(value).trim();
  if (!str) return '-';

  const parts = str
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return <span>{str}</span>;
  }

  const firstRecord = parts[0];
  const count = parts.length - 1;
  const displayText = `${firstRecord} +${count}`;

  return (
    <Tooltip
      content={
        <div className="text-xs max-w-sm whitespace-normal break-words leading-relaxed">{str}</div>
      }
      placement="top"
    >
      <span className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
        {displayText}
      </span>
    </Tooltip>
  );
};

// Helper function to render comma-separated values with count & tooltip if length > 2
const renderMultiRecordMax2 = (value: unknown): React.ReactNode => {
  if (value === null || typeof value === 'undefined') return '-';
  const str = String(value).trim();
  if (!str) return '-';

  const parts = str
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 2) {
    return <span>{str}</span>;
  }

  const firstTwo = parts.slice(0, 2).join(', ');
  const count = parts.length - 2;
  const displayText = `${firstTwo} +${count}`;

  return (
    <Tooltip
      content={
        <div className="text-xs max-w-sm whitespace-normal break-words leading-relaxed">{str}</div>
      }
      placement="top"
    >
      <span className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
        {displayText}
      </span>
    </Tooltip>
  );
};
const renderTruncatedText = (value: unknown): React.ReactNode => {
  if (!value) return '-';

  const text = String(value);

  const shortText = text.length > 20 ? `${text.substring(0, 20)}...` : text;

  return (
    <Tooltip content={<div className="max-w-sm break-words text-xs">{text}</div>} placement="top">
      <span className="text-left block">{shortText}</span>
    </Tooltip>
  );
};

const renderTypeBadge = (value: unknown): React.ReactNode => {
  const type = String(value ?? '').toLowerCase() === 'old' ? 'OLD' : 'NEW';
  const isOld = type === 'OLD';

  return (
    <span
      className={cn(
        'py-0.5 text-[11px] font-bold rounded-md border transition-all inline-block min-w-[65px] text-center',
        isOld
          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
      )}
    >
      {type}
    </span>
  );
};

const renderAreaPair = (value: unknown, row?: Record<string, unknown>, prefix?: string): React.ReactNode => {
  if (!row || !prefix) return value === null || value === undefined || value === '' ? '-' : String(value);
  const ft = row[`${prefix}ASqFt`];
  const mtr = row[`${prefix}ASqMtr`];
  const safeFt = ft === null || ft === undefined || ft === '' ? '-' : ft;
  const safeMtr = mtr === null || mtr === undefined || mtr === '' ? '-' : mtr;
  return safeFt === '-' && safeMtr === '-' ? '-' : `${safeFt} / ${safeMtr}`;
};

export const getApartmentQCColumns = (
  activeMainTab: string,
  activeSubTab: string,
  t: (key: string) => string,
  _pageNumber: number = 1,
  _pageSize: number = 10
): Column<Record<string, unknown>>[] => {
  // Helper to conditionally add Capital Value column
  const getCapitalValueColumn = (labelKey: string): Column<Record<string, unknown>> => ({
    key: 'capitalValue',
    label: t(labelKey),
    headerTooltip: true,
  });

  // Helper to conditionally add Total Tax (CV) column
  const getTotalTaxCVColumn = (): Column<Record<string, unknown>> => ({
    key: 'newTaxTotalCV',
    label: t('columns.totalTaxCV'),
    headerTooltip: true,
  });

  if (activeMainTab === 'commercial') {
    const columns: Column<Record<string, unknown>>[] = [
      {
        key: 'Sr.No',
        label: t('columns.srNo'),
        groupRowSpan: true,
        headerClassName: 'w-[80px]',
        cellClassName: 'text-center',
      },
      {
        key: 'Records',
        label: t('columns.records'),
        render: renderTypeBadge,
        headerClassName: 'w-[100px]',
        cellClassName: 'text-center border-r',
      },
      { key: 'propertyNo', label: t('columns.propertyNo') },
      { key: 'constructionYear', label: t('columns.conYear'), render: renderMultiRecord },
      { key: 'assessmentYear', label: t('columns.asstYear'), render: renderMultiRecord },
      { key: 'ocDate', label: t('columns.ocDate') },
      {
        key: 'ownerName',
        label: t('columns.ownerName'),
        render: renderTruncatedText,
        cellClassName: ' text-left min-w-[170px] max-w-[170px]',
      },
      { key: 'occupierName', label: t('columns.occupierName') },
      { key: 'carpetArea', label: t('columns.carpetAreaSqFtMtr'), headerClassName: 'whitespace-pre-line text-center', render: (val, row) => renderAreaPair(val, row, 'carpet') },
      { key: 'builtupArea', label: t('columns.builtupAreaSqFtMtr'), headerClassName: 'whitespace-pre-line text-center', render: (val, row) => renderAreaPair(val, row, 'builtup') },
      { key: 'typeOfUse', label: t('columns.use'), render: renderMultiRecord },
      { key: 'constructionType', label: t('columns.constructionType'),
         render: renderTruncatedText,
          cellClassName: 'text-left min-w-[150px] max-w-[150px]' },
      { key: 'rateableValue', label: t('columns.rv') },
      { key: 'totalTax', label: t('columns.tax') },
      { key: 'wing', label: t('columns.wingName') },
      { key: 'flatOrShopNo', label: t('columns.shopNo') },
      { 
        key: 'flatOrShopName', 
        label: t('columns.shopName'),
        render: renderTruncatedText,
        cellClassName: 'text-left min-w-[170px] max-w-[170px]'
      },
      { key: 'rentMonthly', label: t('columns.rent') },
      { key: 'renterName', label: t('columns.renterName') },
      { key: 'propertyTypeName', label: t('columns.description'), render: renderMultiRecordMax2 },
      { key: 'apartmentType', label: t('columns.type'), render: renderMultiRecord },
      { key: 'floor', label: t('columns.floor'), render: renderMultiRecord },
      { key: 'toiletCount', label: t('columns.toiletCount') },
      { key: 'mobileNo', label: t('columns.mobileNo') },
      { key: 'emailId', label: t('columns.emailId') },
    ];

    // Add Capital Value column for capital and dual-method sub-tabs
    if (activeSubTab === 'capital') {
      columns.push(getCapitalValueColumn('columns.newCV'));
    } else if (activeSubTab === 'dual-method') {
      columns.push(getCapitalValueColumn('columns.capitalValue'));
      columns.push(getTotalTaxCVColumn());
    }

    return withHeaderTooltips(columns, t);
  }

  if (activeMainTab === 'residential') {
    const columns: Column<Record<string, unknown>>[] = [
      {
        key: 'Sr.No',
        label: t('columns.srNo'),
        groupRowSpan: true,
        headerClassName: 'w-[80px]',
        cellClassName: 'text-center',
      },
      {
        key: 'Records',
        label: t('columns.records'),
        render: renderTypeBadge,
        headerClassName: 'w-[100px]',
        cellClassName: 'text-center border-r',
      },
      { key: 'propertyNo', label: t('columns.propertyNo') },
      { key: 'constructionYear', label: t('columns.conYear'), render: renderMultiRecord },
      { key: 'assessmentYear', label: t('columns.asstYear'), render: renderMultiRecord },
      { key: 'ocDate', label: t('columns.ocDate') },
      {
        key: 'ownerName',
        label: t('columns.ownerName'),
        render: renderTruncatedText,
        cellClassName: 'text-left min-w-[170px] max-w-[170px]',
      },
      { key: 'occupierName', label: t('columns.occupierName') },
      { key: 'bhk', label: t('columns.bhk') },
      { key: 'carpetArea', label: t('columns.carpetAreaSqFtMtr'), headerClassName: 'whitespace-pre-line text-center', render: (val, row) => renderAreaPair(val, row, 'carpet') },
      { key: 'builtupArea', label: t('columns.builtupAreaSqFtMtr'), headerClassName: 'whitespace-pre-line text-center', render: (val, row) => renderAreaPair(val, row, 'builtup') },
      { key: 'typeOfUse', label: t('columns.use'), render: renderMultiRecord },
      { key: 'constructionType', label: t('columns.constructionType'),
         render: renderTruncatedText,
          cellClassName: 'text-left min-w-[150px] max-w-[150px]' },
      { key: 'rateableValue', label: t('columns.rv') },
      { key: 'totalTax', label: t('columns.tax') },
      { key: 'wing', label: t('columns.wingName') },
      { key: 'flatOrShopNo', label: t('columns.flatNo') },
      { key: 'rentMonthly', label: t('columns.rent') },
      { key: 'renterName', label: t('columns.renterName') },
      { key: 'propertyTypeName', label: t('columns.description'), render: renderMultiRecordMax2 },
      { key: 'apartmentType', label: t('columns.apartmentType'), render: renderMultiRecord },
      { key: 'floor', label: t('columns.floor'), render: renderMultiRecord },
      { key: 'toiletCount', label: t('columns.toiletCount') },
      { key: 'mobileNo', label: t('columns.mobileNo') },
      { key: 'emailId', label: t('columns.emailId') },
    ];

    // Add Capital Value column for capital and dual-method sub-tabs
    if (activeSubTab === 'capital') {
      columns.push(getCapitalValueColumn('columns.newCV'));
    } else if (activeSubTab === 'dual-method') {
      columns.push(getCapitalValueColumn('columns.capitalValue'));
      columns.push(getTotalTaxCVColumn());
    }

    return withHeaderTooltips(columns, t);
  }

  // Amenities fallback
  const amenitiesColumns: Column<Record<string, unknown>>[] = [
    {
      key: 'Sr.No',
      label: t('columns.srNo'),
      groupRowSpan: true,
      headerClassName: 'w-[80px]',
      cellClassName: 'text-center',
    },
    {
      key: 'Records',
      label: t('columns.records'),
      render: renderTypeBadge,
      headerClassName: 'w-[100px]',
      cellClassName: 'text-center border-r',
    },
    { key: 'propertyNo', label: t('columns.propertyNo') },
    { key: 'floor', label: t('columns.floor'), render: renderMultiRecord },
    { key: 'constructionYear', label: t('columns.conYear'), render: renderMultiRecord },
    { key: 'assessmentYear', label: t('columns.asstYear'), render: renderMultiRecord },
    { key: 'apartmentType', label: t('columns.apartmentType'), render: renderMultiRecord },
    { key: 'typeOfUse', label: t('columns.use'), render: renderMultiRecord },
    { key: 'carpetArea', label: t('columns.carpetAreaSqFtMtr'), headerClassName: 'whitespace-pre-line text-center', render: (val, row) => renderAreaPair(val, row, 'carpet') },
    { key: 'builtupArea', label: t('columns.builtupAreaSqFtMtr'), headerClassName: 'whitespace-pre-line text-center', render: (val, row) => renderAreaPair(val, row, 'builtup') },
    { key: 'ocDate', label: t('columns.ocDate') },
    { key: 'oldRV', label: t('columns.oldRV') },
    { key: 'totalTax', label: t('columns.totalTax') },
  ];

  // Add Capital Value column for capital and dual-method sub-tabs (if applicable for amenities)
  if (activeSubTab === 'capital') {
    amenitiesColumns.push(getCapitalValueColumn('columns.newCV'));
  } else if (activeSubTab === 'dual-method') {
    amenitiesColumns.push(getTotalTaxCVColumn());
    amenitiesColumns.push(getCapitalValueColumn('columns.capitalValue'));
  }

  return withHeaderTooltips(amenitiesColumns, t);
};
