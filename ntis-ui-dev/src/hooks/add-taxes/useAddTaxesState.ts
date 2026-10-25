import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { InitOperationsResponse, ScopeOptionItem, Scope, Action } from '@/types/addTaxes.types';
import { useAddTaxesScopeSelection } from './useAddTaxesScopeSelection';
import { useAddTaxesFinanceYearStats } from './useAddTaxesFinanceYearStats';
import { buildScopeItems, buildEligibilityActions } from '@/components/modules/property-tax/add-taxes/addTaxesConsole.constants';

export type { Scope, Action };

/**
 * Composes the Add Taxes screen's scope-selection state (useAddTaxesScopeSelection) and
 * Finance-Year/stats state (useAddTaxesFinanceYearStats) — split into those two hooks, plus the
 * scopes/actions display-data builders moved to addTaxesConsole.constants.ts, per review feedback
 * on this hook's size. What's left here is purely: composition, the one effect that's genuinely
 * cross-cutting (keeping the URL's `scope` and `financeYearId` in sync together), and
 * `selectedAction`/`isInitialized` wiring.
 */
export function useAddTaxesState(
  initData: InitOperationsResponse | null,
  scopeOptions: ScopeOptionItem[],
  clientActions: {
    initOperationsAction: (financeYearId?: string | number) => Promise<InitOperationsResponse | null>;
  }
) {
  const t = useTranslations('addTaxes');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedAction, setSelectedAction] = useState<Action>('addTax');

  const {
    selectedScope,
    selectionData,
    handleSelectionChange,
    clearSelectionData,
    handleScopeChange,
    isInitialized,
  } = useAddTaxesScopeSelection(scopeOptions);

  const {
    financeYearId,
    defaultFinanceYearId,
    handleFinanceYearChange,
    isLoadingInit,
    refreshStats,
    stats,
    permissions,
    financeYearOptions,
    isFinanceYearActive,
    financeYearLabel,
  } = useAddTaxesFinanceYearStats(initData, clientActions);

  // Finance Year writes to the URL on its own, independent of scope — previously a single
  // combined guard (`!nextScope || !nextFy`) could delay/skip writing the DEFAULT finance year
  // into the URL on first load if `selectedScope` hadn't resolved yet on that same render. Now
  // this is mainly a fallback for client-side navigations after the initial load — the server
  // page (page.tsx) resolves and redirects to a canonical `financeYearId` before first paint.
  // This effect is the one genuinely cross-cutting piece between scope-selection and
  // Finance-Year/stats — it writes both into the URL together in one router.replace call, so it
  // stays here in the composer rather than in either split-out hook.
  useEffect(() => {
    const currentScope = searchParams.get('scope');
    const currentFy = searchParams.get('financeYearId') || searchParams.get('financeYear');

    const nextScope = currentScope || selectedScope;
    const nextFy = currentFy || financeYearId || defaultFinanceYearId;

    const fyOutOfSync = !!nextFy && (currentFy !== nextFy || !!searchParams.get('financeYear'));
    const scopeOutOfSync = !!nextScope && currentScope !== nextScope;

    if (!fyOutOfSync && !scopeOutOfSync) return;

    const params = new URLSearchParams(searchParams.toString());
    if (nextScope) params.set('scope', nextScope);
    if (nextFy) params.set('financeYearId', nextFy);
    params.delete('financeYear');

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, selectedScope, financeYearId, defaultFinanceYearId, pathname, router]);

  const scopes = buildScopeItems(scopeOptions, t);
  const actions = buildEligibilityActions(permissions, t);

  return {
    t,
    selectedScope,
    selectedAction,
    setSelectedAction,
    selectionData,
    handleSelectionChange,
    financeYearId,
    handleFinanceYearChange,
    handleScopeChange,
    stats,
    financeYearOptions,
    scopes,
    actions,
    scopeOptions,
    isInitialized,
    isFinanceYearActive,
    financeYearLabel,
    isLoadingInit,
    refreshStats,
    clearSelectionData,
  };
}
