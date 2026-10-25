'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';
import { Drawer, Tabs } from '@/components/common';
import { useDynamicTaxConditionValueLabels } from '@/hooks/dynamic-tax-register/condition/useDynamicTaxConditionValueLabels';
import type { ConditionOverviewRow } from '@/types/dynamic-tax-register.types';
import type { ConfigOverviewViewData, ConfigTab } from '@/app/[locale]/property-tax/dynamic-tax-register/config-data';
import { ValueOverviewTab } from './ValueOverviewTab';
import { ConditionOverviewTable } from './ConditionOverviewTable';
import { MasterOverviewTable } from './MasterOverviewTable';
import { HybridOverviewTab } from './HybridOverviewTab';

/** The list-behind params to carry back to the register when the drawer closes (the drawer's own
 *  `c*`/`h*`/`configTab` params are dropped). */
const REGISTER_KEYS = ['search', 'mode', 'status', 'page', 'pageSize'] as const;

/** The three masters a MASTER_BASED / HYBRID mapping can be keyed against — the Master filter's
 *  options (values match the backend's resolved MasterName). */
const MASTER_NAMES = ['PropertyType', 'OwnerType', 'TypeOfUse'] as const;

export interface ConfigOverviewDrawerProps {
  view: ConfigOverviewViewData;
}

/** "Show Config" — a read-only, bird's-eye overview of every tax's configuration, grouped by
 *  calculation mode into tabs. Opened as a route-driven overlay using the common Drawer; every
 *  filter, page, and page-size change is a URL param handled server-side by `loadConfigOverviewView`. */
export function ConfigOverviewDrawer({ view }: ConfigOverviewDrawerProps) {
  const t = useTranslations('dynamicTaxRegister');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [isPending, startTransition] = useTransition();

  // Optimistic active tab: highlight the clicked tab immediately, then let the server confirm.
  // Re-sync when the server's tab changes for reasons other than a click (e.g. browser back).
  const [optimisticTab, setOptimisticTab] = useState<ConfigTab>(view.tab);
  const [serverTab, setServerTab] = useState<ConfigTab>(view.tab);
  if (view.tab !== serverTab) {
    setServerTab(view.tab);
    setOptimisticTab(view.tab);
  }

  const pushQuery = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? '');
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all') next.delete(key);
        else next.set(key, value);
      });
      startTransition(() => router.replace(`${pathname}?${next.toString()}`));
    },
    [router, pathname, searchParams]
  );

  const handleClose = useCallback(() => {
    const next = new URLSearchParams();
    REGISTER_KEYS.forEach((key) => {
      const value = searchParams?.get(key);
      if (value) next.set(key, value);
    });
    const qs = next.toString();
    startTransition(() =>
      router.push(`/${locale}/property-tax/dynamic-tax-register${qs ? `?${qs}` : ''}`)
    );
  }, [router, searchParams, locale]);

  const handleTabChange = (value: string | number) => {
    const tab = String(value) as ConfigTab;
    setOptimisticTab(tab);
    pushQuery({ configTab: tab });
  };

  // API-sourced value-label resolver, over whichever condition rows are currently loaded
  // (the Condition tab's page and/or the Hybrid tab's condition-section page).
  const allConditionRows = useMemo<ConditionOverviewRow[]>(
    () => [...(view.condition?.conditionRows ?? []), ...(view.hybridCondition?.conditionRows ?? [])],
    [view.condition, view.hybridCondition]
  );
  const { resolveApiValueLabel } = useDynamicTaxConditionValueLabels(view.conditionFields, allConditionRows);

  const v = view.value;
  const c = view.condition;
  const m = view.master;
  const hc = view.hybridCondition;
  const hm = view.hybridMaster;

  const taxOptions = useMemo(
    () => [
      { label: t('overview.allTaxes'), value: 'all' },
      ...view.masterTaxOptions.map((x) => ({
        label: x.taxName || x.taxCode || String(x.taxId),
        value: String(x.taxId),
      })),
    ],
    [view.masterTaxOptions, t]
  );
  const masterOptions = useMemo(
    () => [{ label: t('overview.allMasters'), value: 'all' }, ...MASTER_NAMES.map((n) => ({ label: n, value: n }))],
    [t]
  );

  const label = (tab: ConfigTab, base: string, count: number | undefined) =>
    optimisticTab === tab && count !== undefined ? `${base} (${count})` : base;

  const title = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0">
        <LayoutGrid className="w-4.5 h-4.5" />
      </div>
      <div className="flex flex-col">
        <h2 className="text-[15px] font-black text-slate-900 tracking-tight leading-tight">{t('overview.title')}</h2>
        <span className="text-[11px] text-slate-500 font-medium">{t('overview.subtitle')}</span>
      </div>
    </div>
  );

  return (
    <Drawer open onClose={handleClose} title={title} width="xl">
      <div className="p-5">
        <Tabs
          value={optimisticTab}
          onChange={handleTabChange}
          variant="line"
          items={[
            {
              value: 'value',
              label: label('value', t('overview.tabs.value'), v?.totalCount),
              panelClassName: 'pt-4',
              content: (
                <ValueOverviewTab
                  taxes={v?.valueTaxes ?? []}
                  rows={v?.valueRows ?? []}
                  pageNumber={v?.pageNumber ?? 1}
                  pageSize={v?.pageSize ?? 25}
                  totalCount={v?.totalCount ?? 0}
                  onPageChange={(p) => pushQuery({ cvPage: String(p) })}
                  onPageSizeChange={(s) => pushQuery({ cvSize: String(s), cvPage: undefined })}
                  loading={isPending || !v}
                  yearRangeOptions={view.yearRangeOptions}
                  typeOfUseGroups={view.typeOfUseGroups}
                  descriptionOptions={view.descriptionOptions}
                  yearValue={view.filters.valYear}
                  typeValue={view.filters.valType}
                  descValue={view.filters.valDesc}
                  onYearChange={(val) => pushQuery({ cvYear: val, cvPage: undefined })}
                  onTypeChange={(val) => pushQuery({ cvType: val, cvDesc: undefined, cvPage: undefined })}
                  onDescChange={(val) => pushQuery({ cvDesc: val, cvPage: undefined })}
                  loadFailed={view.tab === 'value' && view.loadFailed}
                />
              ),
            },
            {
              value: 'condition',
              label: label('condition', t('overview.tabs.condition'), c?.totalCount),
              panelClassName: 'pt-4',
              content: (
                <ConditionOverviewTable
                  rows={c?.conditionRows ?? []}
                  fields={view.conditionFields}
                  resolveApiValueLabel={resolveApiValueLabel}
                  pageNumber={c?.pageNumber ?? 1}
                  pageSize={c?.pageSize ?? 25}
                  totalCount={c?.totalCount ?? 0}
                  onPageChange={(p) => pushQuery({ ccPage: String(p) })}
                  onPageSizeChange={(s) => pushQuery({ ccSize: String(s), ccPage: undefined })}
                  loading={isPending || !c}
                  loadFailed={view.tab === 'condition' && view.loadFailed}
                />
              ),
            },
            {
              value: 'master',
              label: label('master', t('overview.tabs.master'), m?.totalCount),
              panelClassName: 'pt-4',
              content: (
                <MasterOverviewTable
                  rows={m?.masterRows ?? []}
                  pageNumber={m?.pageNumber ?? 1}
                  pageSize={m?.pageSize ?? 25}
                  totalCount={m?.totalCount ?? 0}
                  onPageChange={(p) => pushQuery({ cmPage: String(p) })}
                  onPageSizeChange={(s) => pushQuery({ cmSize: String(s), cmPage: undefined })}
                  loading={isPending || !m}
                  loadFailed={view.tab === 'master' && view.loadFailed}
                  filters={{
                    taxOptions,
                    masterOptions,
                    taxValue: view.filters.mstTax,
                    masterValue: view.filters.mstMaster,
                    onTaxChange: (val) => pushQuery({ cmTax: val, cmPage: undefined }),
                    onMasterChange: (val) => pushQuery({ cmMaster: val, cmPage: undefined }),
                  }}
                />
              ),
            },
            {
              value: 'hybrid',
              label: t('overview.tabs.hybrid'),
              panelClassName: 'pt-4',
              content: (
                <HybridOverviewTab
                  fields={view.conditionFields}
                  resolveApiValueLabel={resolveApiValueLabel}
                  loading={isPending || !hc || !hm}
                  conditionRows={hc?.conditionRows ?? []}
                  conditionPageNumber={hc?.pageNumber ?? 1}
                  conditionPageSize={hc?.pageSize ?? 25}
                  conditionTotalCount={hc?.totalCount ?? 0}
                  onConditionPageChange={(p) => pushQuery({ hcPage: String(p) })}
                  onConditionPageSizeChange={(s) => pushQuery({ hcSize: String(s), hcPage: undefined })}
                  masterRows={hm?.masterRows ?? []}
                  masterPageNumber={hm?.pageNumber ?? 1}
                  masterPageSize={hm?.pageSize ?? 25}
                  masterTotalCount={hm?.totalCount ?? 0}
                  onMasterPageChange={(p) => pushQuery({ hmPage: String(p) })}
                  onMasterPageSizeChange={(s) => pushQuery({ hmSize: String(s), hmPage: undefined })}
                  loadFailed={view.tab === 'hybrid' && view.loadFailed}
                />
              ),
            },
          ]}
        />
      </div>
    </Drawer>
  );
}
