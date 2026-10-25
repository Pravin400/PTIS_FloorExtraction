import { useState, useRef, useEffect } from 'react';
import { ToggleSwitch } from '@/components/common';
import type { Column } from '@/components/common';
import { TaxCalculationItem } from '@/types/applicable-taxes.types';
import { Droplet, Flame, TreePine, Banknote, Building2, Map, BookOpen, Briefcase, Info, ChevronDown, ChevronUp } from 'lucide-react';

const getTaxIcon = (name: string) => {
  const lName = name.toLowerCase();
  if (lName.includes('fire')) return <Flame size={16} className="text-orange-500" />;
  if (lName.includes('tree')) return <TreePine size={16} className="text-green-500" />;
  if (lName.includes('water') || lName.includes('sewage')) return <Droplet size={16} className="text-blue-500" />;
  if (lName.includes('education')) return <BookOpen size={16} className="text-indigo-500" />;
  if (lName.includes('employment')) return <Briefcase size={16} className="text-stone-500" />;
  if (lName.includes('building')) return <Building2 size={16} className="text-red-500" />;
  if (lName.includes('road')) return <Map size={16} className="text-emerald-500" />;
  if (lName.includes('general')) return <span className="font-bold text-blue-600 text-[10px]">GT</span>;
  return <Banknote size={16} className="text-slate-500" />;
};

const formatNumberTwoDecimals = (val: unknown): string => {
  if (val === null || val === undefined || val === '') return '';
  const num = Number(val);
  if (!isNaN(num)) {
    return num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  return String(val);
};

const RuleRateCell = ({ val, row, t }: { val: unknown; row: TaxCalculationItem; t: (key: string) => string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasPercentagesBreakdown = Boolean(row.typeOfUseTaxPercentages && row.typeOfUseTaxPercentages.length > 0);
  const hasSlabBreakdown = Boolean(row.slabDetails && row.slabDetails.length > 0);
  const hasBreakdown = hasPercentagesBreakdown || hasSlabBreakdown;

  let mainDisplay = '—';
  if (val !== null && val !== undefined) {
    mainDisplay = `${formatNumberTwoDecimals(val)}%`;
  } else if (row.resultBases && row.resultValues) {
    mainDisplay = `${formatNumberTwoDecimals(row.resultBases)} / ${formatNumberTwoDecimals(row.resultValues)}`;
  } else if (row.resultBases) {
    mainDisplay = formatNumberTwoDecimals(row.resultBases);
  } else if (row.resultValues) {
    mainDisplay = formatNumberTwoDecimals(row.resultValues);
  }

  if (!hasBreakdown) {
    return <span>{mainDisplay}</span>;
  }

  return (
    <div className="relative inline-flex items-center justify-center gap-1.5" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border-2 transition-all text-xs font-bold focus:outline-none ${
          isOpen
            ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-xs'
            : 'border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-2xs'
        }`}
        title={t('viewRateBreakdown') || 'View rate breakdown'}
      >
        <Info size={13} className="stroke-[2.5]" />
        {isOpen ? <ChevronUp size={13} className="stroke-[2.5]" /> : <ChevronDown size={13} className="stroke-[2.5]" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white border border-slate-200/80 rounded-3xl shadow-[0_12px_30px_-5px_rgba(0,0,0,0.12)] p-4 z-50 text-left">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <span className="font-extrabold text-xs text-slate-800 truncate" title={row.taxName}>
              {row.taxName} {t('breakdown') || 'Breakdown'}
            </span>
          </div>

          {/* List of breakdown cards */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-0.5">
            {hasPercentagesBreakdown
              ? row.typeOfUseTaxPercentages?.map((item, idx) => (
                  <div
                    key={item.typeOfUseId ?? idx}
                    className="bg-slate-50/90 border border-slate-100/90 p-3 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate" title={item.description}>
                        {item.description}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">
                        {t('type') || 'TYPE'}: {item.type}
                        {item.baseType ? ` • ${t('base')?.toUpperCase() || 'BASE'}: ${item.baseType}` : ''}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-black text-slate-800 shadow-2xs shrink-0">
                      {formatNumberTwoDecimals(item.taxPercentage)}%
                    </div>
                  </div>
                ))
              : row.slabDetails?.map((slab, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50/90 border border-slate-100/90 p-3 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {formatNumberTwoDecimals(slab.minAmount)} - {formatNumberTwoDecimals(slab.maxAmount)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">
                        {t('type') || 'TYPE'}: {slab.type}
                        {slab.baseType ? ` • ${t('base')?.toUpperCase() || 'BASE'}: ${slab.baseType}` : ''}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-black text-slate-800 shadow-2xs shrink-0">
                      {formatNumberTwoDecimals(slab.rate)}%
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const getColumns = (
  t: (key: string) => string,
  handleToggleStatus: (id: number, newVal: boolean, taxHead: string) => void
): Column<TaxCalculationItem>[] => [
    {
      key: 'taxName' as keyof TaxCalculationItem,
      label: t('taxHead')?.toUpperCase() || 'TAX HEAD',
      width: '23%',
      cellClassName: 'py-3 px-3',
      render: (_val: unknown, row: TaxCalculationItem) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
            {getTaxIcon(row.taxName)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-800 text-sm truncate">{row.taxName}</span>
            <span className="text-xs text-slate-400 truncate max-w-[180px]">{row.descriptions || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'types' as keyof TaxCalculationItem,
      label: t('applicableTo') || 'APPLICABLE TO',
      width: '12%',
      headerClassName: 'text-center',
      cellClassName: 'py-3 px-2 text-xs text-slate-500 font-medium text-center',
      render: (val: unknown) => {
        const types = val as string;
        if (!types) return '—';
        if (types.includes('R') && types.includes('C')) return t('residentialAndShop') || 'Residential + Shop';
        if (types.includes('R')) return t('residential') || 'Residential';
        if (types.includes('C')) return t('commercialOnly') || 'Commercial';
        return t('wholeProperty') || 'Whole Property';
      },
    },
    {
      key: 'baseTypes' as keyof TaxCalculationItem,
      label: t('method') || 'METHOD',
      width: '8%',
      headerClassName: 'text-center',
      cellClassName: 'py-3 px-2 text-xs text-slate-500 font-medium text-center',
      render: (val: unknown, row: TaxCalculationItem) => (val as string) || row.resultModes || '—'
    },
    {
      key: 'averageTaxPercentage' as keyof TaxCalculationItem,
      label: t('ruleRate') || 'RULE / RATE',
      width: '11%',
      headerClassName: 'text-center',
      cellClassName: 'py-3 px-2 text-xs text-slate-500 font-medium text-center',
      render: (val: unknown, row: TaxCalculationItem) => <RuleRateCell val={val} row={row} t={t} />
    },
    {
      key: 'calculationMode' as keyof TaxCalculationItem,
      label: t('calculation') || 'CALCULATION',
      width: '13%',
      headerClassName: 'text-center',
      cellClassName: 'py-3 px-2 text-xs text-slate-500 font-medium text-center',
      render: (val: unknown) => (val as string) || '—'
    },
    {
      key: 'isActive' as keyof TaxCalculationItem,
      label: t('statusOnOff') || 'STATUS ON / OFF',
      width: '12%',
      align: 'center' as const,
      headerClassName: 'text-center',
      cellClassName: 'py-3 px-2 text-center',
      render: (_val: unknown, row: TaxCalculationItem) => {
        const isEffectiveActive = Boolean(row.isApplicable && row.isActive);
        return (
          <div className="flex items-center gap-1.5 justify-center">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${isEffectiveActive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-400'
                }`}
            >
              {isEffectiveActive ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
            </span>
            <ToggleSwitch
              checked={isEffectiveActive}
              onChange={(newVal) => handleToggleStatus(row.taxId, newVal, row.taxName)}
              showPopup={false}
              id={`toggle-${row.taxId}`}
            />
          </div>
        );
      },
    },
    {
      key: 'taxAmount' as keyof TaxCalculationItem,
      label: t('amount') || 'AMOUNT',
      width: '12%',
      align: 'center' as const,
      headerClassName: 'text-center',
      cellClassName: 'py-3 px-3 font-bold text-slate-800 text-[13px] whitespace-nowrap text-center',
      render: (val: unknown) => `${t('currencySymbol')} ${(val as number)?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`
    }
  ];