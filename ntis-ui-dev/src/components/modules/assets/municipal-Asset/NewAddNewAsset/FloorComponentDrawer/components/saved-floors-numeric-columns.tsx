import type { FloorDetailsTableColumn } from '@/components/common';
import type { SavedFloorRow } from '@/types/asset/floor-details.types';
import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';

function plainHeader(label: React.ReactNode) {
  const HeaderComponent = () => (
    <span className="text-[10px] font-black uppercase tracking-wider text-[#1d4ed8]">{label}</span>
  );
  HeaderComponent.displayName = 'PlainHeaderNumeric';
  return HeaderComponent;
}

function factorColumn(key: string, label: string, valueKey: string): FloorDetailsTableColumn<SavedFloorRow> {
  return {
    key,
    label,
    headerRender: plainHeader(label),
    headerClassName: 'py-2.5 px-4 text-center',
    cellClassName: 'py-2.5 px-2 text-center font-mono font-semibold text-slate-600',
    render: (f) => Number(f[valueKey] || 0).toFixed(2),
  };
}

export function buildSavedFloorsNumericColumns(t: (key: string) => string): FloorDetailsTableColumn<SavedFloorRow>[] {
  return [
    {
      key: 'renter',
      label: t('floorDetails.renter') || 'Renter',
      headerRender: plainHeader(t('floorDetails.renter') || 'Renter'),
      headerClassName: 'py-2.5 px-4 text-left',
      cellClassName: 'py-2.5 px-4 text-left font-bold text-slate-800',
      render: (f) =>
        f.isRenter ? (
          <div className="flex flex-col text-[11px] leading-tight max-w-[140px]">
            <span className="font-bold text-slate-900 truncate" title={String(f.renterNameEnglish || "") || undefined}>
              {String(f.renterNameEnglish || "-")}
            </span>
            <span className="text-[9px] text-slate-500 font-medium">
              {f.agreementFromDate
                ? `${f.agreementFromDate}${f.agreementToDate ? ` to ${f.agreementToDate}` : ''}`
                : ''}
            </span>
            {f.rentMonthly ? (
              <span className="text-[9.5px] font-mono font-bold text-emerald-700">
                {`₹${Number(f.rentMonthly).toLocaleString()}/mo`}
              </span>
            ) : null}
          </div>
        ) : (
          '-'
        ),
    },
    {
      key: 'rooms',
      label: t('floorDetails.rooms'),
      headerRender: plainHeader(t('floorDetails.rooms')),
      headerClassName: 'py-2.5 px-4 text-center',
      cellClassName: 'py-2.5 px-4 text-center font-mono font-semibold text-slate-800',
      render: (f) => String(f.rooms ?? f.noOfRooms ?? "-"),
    },
    {
      key: 'carpetArea',
      label: t('floorDetails.carpetAreaSqFtSqM'),
      headerRender: plainHeader(t('floorDetails.carpetAreaSqFtSqM')),
      headerClassName: 'py-2.5 px-4 text-center',
      cellClassName: 'py-2.5 px-4 text-center font-mono font-bold text-blue-700',
      render: (f) => `${Number(f.carpetAreaSqFeet || 0).toFixed(2)} / ${(Number(f.carpetAreaSqFeet || 0) / 10.7639).toFixed(2)}`,
    },
    {
      key: 'builtupArea',
      label: t('floorDetails.builtupSqFtSqM'),
      headerRender: plainHeader(t('floorDetails.builtupSqFtSqM')),
      headerClassName: 'py-2.5 px-4 text-center',
      cellClassName: 'py-2.5 px-4 text-center font-mono font-bold text-emerald-700',
      render: (f) => `${Number(f.builtUpAreaSqFeet || 0).toFixed(2)} / ${(Number(f.builtUpAreaSqFeet || 0) / 10.7639).toFixed(2)}`,
    },
    {
      key: 'sdrr',
      label: t('floorDetails.sdrr'),
      headerRender: plainHeader(t('floorDetails.sdrr')),
      headerClassName: 'py-2.5 px-4 text-center',
      cellClassName: 'py-2.5 px-2 text-center font-mono font-semibold text-slate-600',
      render: (f) => Number(f.cvBaseRate || 0).toLocaleString(),
    },
    {
      key: 'baseValue',
      label: t('floorDetails.baseValue'),
      headerRender: plainHeader(t('floorDetails.baseValue')),
      headerClassName: 'py-2.5 px-4 text-center',
      cellClassName: 'py-2.5 px-2 text-center font-mono font-semibold text-slate-600',
      render: (f) => Number(f.baseValue || 0).toLocaleString(),
    },
    factorColumn('floorFactor', t('floorDetails.floorFactor'), 'cvFloorFactor'),
    factorColumn('ageFactor', t('floorDetails.ageFactor'), 'cvAgeFactor'),
    factorColumn('ntbFactor', t('floorDetails.ntbFactor'), 'cvNatureFactor'),
    factorColumn('useFactor', t('floorDetails.useFactor'), 'cvUseFactor'),
    {
      key: 'capitalValue',
      label: t('floorDetails.capitalValue'),
      headerRender: plainHeader(t('floorDetails.capitalValue')),
      headerClassName: 'py-2.5 px-4 text-center',
      cellClassName: 'py-2.5 px-4 text-center font-mono font-bold text-indigo-700 bg-indigo-50/30',
      render: (f) => {
        const isNotCalculated =
          f.cvCalculated === false ||
          !f.cvBaseRate ||
          Number(f.cvBaseRate) <= 0 ||
          (Number(f.cvFloorFactor || 0) === 0 &&
            Number(f.cvAgeFactor || 0) === 0 &&
            Number(f.cvNatureFactor || 0) === 0 &&
            Number(f.cvUseFactor || 0) === 0);

        return isNotCalculated ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-600"
            title={String(f.cvCalculationMessage || 'Capital value could not be calculated')}
          >{'Not calculated'}</span>
        ) : (
          formatIndianCurrencyAbbreviated(Number(f.capitalValue || 0), t)
        );
      },
    },
  ];
}
