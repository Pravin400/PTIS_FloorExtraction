'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import {
  Zap,
  Sliders,
  Folder,
  Shuffle,
  BarChart3,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  PageContainer,
  Button,
  Card,
  SearchInput,
  Select,
  MasterTable,
  TableHeader,
} from '@/components/common';
import {
  DynamicTaxRegisterRow,
  DynamicTaxRegisterStats,
  CalculationMode,
  categoryForMode,
} from '@/types/dynamic-tax-register.types';
import { RefreshButton } from '@/components/common/ActionButtons';
import { getDynamicTaxRegisterColumns } from './dynamicTaxRegisterColumns';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

/** Calculation-mode stat cards shown above the register table — double as the Calculation
 *  Mode filter (clicking a card applies it; clicking the active one clears back to "All
 *  Modes"). Tailwind class names must stay literal (not templated) for the JIT compiler to
 *  pick them up. This is the ONE canonical mode→color mapping for the whole screen — the
 *  ruleCategory column below (MODE_BADGE_CLASS) must always match it. */
const MODE_STATS: {
  key: 'value' | 'condition' | 'master' | 'hybrid';
  icon: LucideIcon;
  countKey: keyof DynamicTaxRegisterStats;
  labelKey: string;
  iconBgClass: string;
  iconColorClass: string;
  activeClass: string;
  barClass: string;
}[] = [
  {
    key: 'value',
    icon: BarChart3,
    countKey: 'valueBased',
    labelKey: 'list.stats.valueBased',
    iconBgClass: 'bg-emerald-50',
    iconColorClass: 'text-emerald-600',
    activeClass: 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-100',
    barClass: 'bg-emerald-500',
  },
  {
    key: 'condition',
    icon: Sliders,
    countKey: 'conditionBased',
    labelKey: 'list.stats.conditionBased',
    iconBgClass: 'bg-amber-50',
    iconColorClass: 'text-amber-600',
    activeClass: 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-100',
    barClass: 'bg-amber-500',
  },
  {
    key: 'master',
    icon: Folder,
    countKey: 'masterBased',
    labelKey: 'list.stats.masterBased',
    iconBgClass: 'bg-purple-50',
    iconColorClass: 'text-purple-600',
    activeClass: 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-100',
    barClass: 'bg-purple-500',
  },
  {
    key: 'hybrid',
    icon: Shuffle,
    countKey: 'hybrid',
    labelKey: 'list.stats.hybrid',
    iconBgClass: 'bg-sky-50',
    iconColorClass: 'text-sky-600',
    activeClass: 'bg-sky-50/60 border-sky-300 ring-2 ring-sky-100',
    barClass: 'bg-sky-500',
  },
];

/** The ruleCategory table pill's color per mode — kept identical to MODE_STATS above so the
 *  same 4 modes never get two different color codings on this screen. */
const MODE_BADGE_CLASS: Record<CalculationMode, string> = {
  VALUE_BASED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CONDITION_BASED: 'bg-amber-50 text-amber-700 border-amber-200',
  MASTER_BASED: 'bg-purple-50 text-purple-700 border-purple-200',
  HYBRID: 'bg-sky-50 text-sky-700 border-sky-200',
};

const RULE_CATEGORY_LABEL_KEY: Record<CalculationMode, string> = {
  VALUE_BASED: 'list.modeOptions.value',
  CONDITION_BASED: 'list.modeOptions.condition',
  MASTER_BASED: 'list.modeOptions.master',
  HYBRID: 'list.modeOptions.hybrid',
};

export interface DynamicTaxRegisterProps {
  data: DynamicTaxRegisterRow[];
  stats: DynamicTaxRegisterStats;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  search: string;
  mode: string; // all | value | condition | master | hybrid
  status: string; // all | active | deactive
}

export default function DynamicTaxRegister({
  data,
  stats,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  search,
  mode,
  status,
}: DynamicTaxRegisterProps) {
  const t = useTranslations('dynamicTaxRegister');
  const assessmentStatusLabel = `${useAliasLabel('Assessment', t('aliasFallback.assessment'))} ${t('aliasFallback.statusSuffix')}`;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(search);

  // Push a new set of query params onto the current path (server refetch).
  const pushQuery = useCallback(
    (updates: Record<string, string | undefined>, resetPage = true) => {
      const next = new URLSearchParams(searchParams?.toString() ?? '');
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all') next.delete(key);
        else next.set(key, value);
      });
      if (resetPage) next.delete('page');
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  // Debounced search → URL
  useEffect(() => {
    if (searchQuery === search) return;
    const handle = setTimeout(() => {
      pushQuery({ search: searchQuery || undefined });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const goToConfigure = (row: DynamicTaxRegisterRow) => {
    const category = row.ruleCategory || categoryForMode(row.calculationMode);
    startTransition(() => {
      router.push(
        `/${locale}/property-tax/dynamic-tax-register/add/${row.taxId}?tab=config&category=${encodeURIComponent(category)}`
      );
    });
  };

  // "Show Config" opens the read-only Configuration Overview as a route-driven drawer overlay,
  // carrying the current list filters/page so the register behind it stays put.
  const openConfigOverview = () => {
    const qs = searchParams?.toString() ?? '';
    startTransition(() => {
      router.push(`/${locale}/property-tax/dynamic-tax-register/config${qs ? `?${qs}` : ''}`);
    });
  };

  // Column widths are deliberately tight: they sum to the table's preferred width, and MasterTable
  // renders a w-full table inside an overflow-auto container — so an oversized total is exactly
  // what produces a horizontal scrollbar. Keep the total under ~1450px when adding a column.
  const columns = getDynamicTaxRegisterColumns({ t, pageNumber, pageSize, MODE_BADGE_CLASS, RULE_CATEGORY_LABEL_KEY, goToConfigure, assessmentStatusLabel });

  return (
    <PageContainer className="p-6">
      <div className="flex flex-col gap-4">
        {/* Page header — title/subtitle/icon, primary action, general filters */}
        <TableHeader
          title={t('list.title')}
          subtitle={t('list.subtitle')}
          icon={Zap}
          actionLabel={t('list.addTax')}
          onActionClick={() =>
            startTransition(() => router.push(`/${locale}/property-tax/dynamic-tax-register/add/0`))
          }
          rightContent={
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('list.searchPlaceholder')}
              className="mb-0 w-full max-w-xs"
            />
          }
        />

        {/* Calculation-mode filter cards + all remaining filters/actions — grouped as two
            flex items (not four) so wrapping on narrow screens moves each group as a whole
            block instead of scattering individual controls onto their own orphaned lines. */}
        <Card variant="default" padding="sm" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            {MODE_STATS.map((s) => {
              const Icon = s.icon;
              const isActive = mode === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => pushQuery({ mode: isActive ? undefined : s.key })}
                  aria-pressed={isActive}
                  className={cn(
                    'group relative flex flex-1 items-center gap-2.5 min-w-[200px] pl-2.5 pr-4 py-2 rounded-xl border overflow-hidden',
                    'shadow-sm transition-all duration-200 active:scale-[0.97]',
                    isActive
                      ? s.activeClass
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
                  )}
                  title={t(s.labelKey)}
                >
                  <span className={cn('absolute inset-x-0 top-0 h-[3px]', s.barClass, !isActive && 'opacity-70')} />
                  <div
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-transform group-hover:scale-105',
                      s.iconBgClass
                    )}
                  >
                    <Icon className={cn('w-[18px] h-[18px]', s.iconColorClass)} />
                  </div>
                  <div className="flex flex-col items-start leading-none gap-1">
                    <span className="text-lg font-bold text-slate-800 leading-none tabular-nums">
                      {stats[s.countKey]}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase whitespace-nowrap">
                      {t(s.labelKey)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Calculation Mode dropdown removed — the stat cards above are the mode filter;
                keeping both was a redundant control. Status keeps a compact inline label
                (not Select's own `label` prop, which wraps in a `w-full` div and forces every
                sibling in this row onto its own line — fine for a vertical form, wrong here). */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                {t('list.statusLabel')}
              </span>
              <Select
                options={[
                  { label: t('list.statusOptions.all'), value: 'all' },
                  { label: t('list.statusOptions.active'), value: 'active' },
                  { label: t('list.statusOptions.deactive'), value: 'deactive' },
                ]}
                value={status}
                onChange={(_, val) => pushQuery({ status: val })}
                selectSize="sm"
                className="w-36"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={Sliders}
              onClick={() =>
                startTransition(() => router.push(`/${locale}/property-tax/dynamic-tax-register/manageRule`))
              }
            >
              {t('list.manageRules')}
            </Button>
            <Button variant="secondary" size="sm" icon={LayoutGrid} onClick={openConfigOverview}>
              {t('list.showConfig')}
            </Button>
            <RefreshButton
              label={t('list.refresh')}
              size="sm"
              onClick={() => startTransition(() => router.refresh())}
            />
          </div>
        </Card>

        {/* MasterTable Component */}
        <div className="min-w-0 overflow-x-auto">
          <MasterTable
            columns={columns}
            data={data}
            loading={isPending}
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={(p) => pushQuery({ page: String(p) }, false)}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageSizeChange={(size) => pushQuery({ pageSize: String(size) })}
            paginationConfig={{ enabled: true, showPageSizeSelector: true }}
            tableClassName="text-xs w-max min-w-full border-collapse"
            theadClassName="[&_th]:whitespace-nowrap [&_th]:p-3 [&_th]:border-r [&_th]:border-[#DCEAFF]"
            rowClassName={() => 'hover:bg-slate-50/40 transition-colors [&_td]:p-2.5 [&_td]:border-r [&_td]:border-slate-100'}
            height="lg"
            getRowKey={(row) => String((row as DynamicTaxRegisterRow).taxId)}
          />
        </div>
      </div>
    </PageContainer>
  );
}
