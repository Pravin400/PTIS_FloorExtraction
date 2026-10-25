'use client';

import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useConfirm, type TabValue } from '@/components/common';
import { CalculationMode, DynamicTaxRegisterRow, categoryForMode } from '@/types/dynamic-tax-register.types';

export interface DynamicTaxNavOverrides {
  tab?: TabValue;
  category?: string;
  valYear?: number;
  valGroup?: string;
  valPage?: number;
  valPageSize?: number;
  mstYear?: number;
  mstRule?: number;
  mstPage?: number;
  mstPageSize?: number;
}

const URL_FILTER_KEYS = [
  'valYear', 'valGroup', 'valPage', 'valPageSize',
  'mstYear', 'mstRule', 'mstPage', 'mstPageSize',
] as const;

/** The register list's own filter/pagination params — carried back when the drawer closes.
 *  Matches ConfigOverviewDrawer's REGISTER_KEYS. */
const REGISTER_LIST_KEYS = ['search', 'mode', 'status', 'page', 'pageSize'] as const;

/**
 * Owns routing/identity concerns shared across every drawer tab: which tax id
 * is open, whether it's new, which calculation-mode category is in view, and
 * a `buildConfigUrl` helper that clones the CURRENT query string so every
 * tab's own filter params survive tab switches instead of being dropped.
 */
export function useDynamicTaxNav(
  id: string,
  taxRow: DynamicTaxRegisterRow | null,
  category: string | undefined,
  initialTab: string
) {
  const t = useTranslations('dynamicTaxRegister');
  const { confirm } = useConfirm();
  const rawRouter = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [, startTransition] = useTransition();

  const numericId = Number(id);
  const isNew = id === '0' || !Number.isFinite(numericId) || numericId <= 0;

  // The calculation mode/category the CURRENTLY LOADED Configuration tab data
  // matches — driven by the `category` URL param (set when navigating via
  // "Configure"), not by unsaved edits in the Rule Name dropdown.
  const calcMode: CalculationMode = taxRow?.calculationMode ?? 'CONDITION_BASED';
  const effectiveCategory = category ?? categoryForMode(calcMode);
  const isHybrid = effectiveCategory === '-' || calcMode === 'HYBRID';

  const activeTab = (searchParams.get('tab') ?? initialTab) as TabValue;
  const routeBase = `/${locale}/property-tax/dynamic-tax-register`;

  // Tracks whether the admin has ever had the Configuration tab open this session — latched
  // (never unset) the moment activeTab reads 'config'. useDynamicTaxDrawer's handleSaveAll uses
  // this to refuse persisting whatever a tab's hooks auto-seeded just by mounting when the admin
  // saved straight from General without ever looking at Configuration. Set from an effect, not
  // during render — only ever read from event handlers, so the one-tick lag is immaterial.
  const hasVisitedConfigRef = useRef(activeTab === 'config');
  useEffect(() => {
    if (activeTab === 'config') hasVisitedConfigRef.current = true;
  }, [activeTab]);

  /**
   * Latest "is there unsaved config on the currently-relevant tab(s)?" check — kept private here
   * (never returned directly) and updated only through `registerDirtyCheck` below, since a
   * hook's return value must not be mutated by its caller. useDynamicTaxDrawer (which composes
   * the tab hooks that own the actual dirty flags, constructed after this one) calls
   * `registerDirtyCheck` from an effect every time those flags change; this is read only inside
   * event handlers here, never during render.
   */
  const dirtyCheckRef = useRef<() => boolean>(() => false);
  const registerDirtyCheck = useCallback((check: () => boolean) => {
    dirtyCheckRef.current = check;
  }, []);

  /** Promise wrapper around the callback-based `confirm` API — same idempotent-settle pattern as
   *  the mode-change confirmation in useDynamicTaxGeneral. Resolves false on any dismissal. */
  const confirmDiscard = useCallback(
    (): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        let settled = false;
        const settle = (result: boolean) => {
          if (settled) return;
          settled = true;
          resolve(result);
        };
        confirm({
          variant: 'warning',
          title: t('drawer.unsavedChanges.title'),
          description: t('drawer.unsavedChanges.description'),
          confirmText: t('drawer.unsavedChanges.confirm'),
          onConfirm: () => settle(true),
          onCancel: () => settle(false),
        });
      }),
    [confirm, t]
  );

  /** Runs `action` immediately when nothing is unsaved; otherwise asks for confirmation first and
   *  only runs it if the admin agrees to discard. Never runs `action` on a declined confirm. */
  const guardedNavigate = useCallback(
    (action: () => void) => {
      if (!dirtyCheckRef.current()) {
        action();
        return;
      }
      confirmDiscard().then((proceed) => {
        if (proceed) action();
      });
    },
    [confirmDiscard]
  );


  // Every drawer navigation — tab switch, Value/Master filter and page changes, Rule Name
  // changes, "Manage Rule Category" — goes through `router.push`/`router.replace` on this same
  // object (all threaded down as `nav.router`), so wrapping push/replace here is a single choke
  // point that guards all of them at once, with no changes needed at any individual call site.
  const router: typeof rawRouter = {
    ...rawRouter,
    push: (href, options) => guardedNavigate(() => rawRouter.push(href, options)),
    replace: (href, options) => guardedNavigate(() => rawRouter.replace(href, options)),
  };

  /** Rebuilds the drawer's query string, preserving every existing param unless overridden. */
  const buildConfigUrl = (overrides: DynamicTaxNavOverrides, selectedCategory?: string) => {
    const next = new URLSearchParams(searchParams.toString());
    const tab = overrides.tab ?? activeTab;
    const cat = overrides.category ?? (tab === 'config' ? selectedCategory ?? effectiveCategory : effectiveCategory);
    next.set('tab', String(tab));
    next.set('category', cat);
    for (const key of URL_FILTER_KEYS) {
      const value = overrides[key];
      if (value !== undefined) next.set(key, String(value));
    }
    return `${routeBase}/add/${id}?${next.toString()}`;
  };

  const rawClose = useCallback(() => {
    const next = new URLSearchParams();
    REGISTER_LIST_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) next.set(key, value);
    });
    const qs = next.toString();
    startTransition(() => rawRouter.push(`${routeBase}${qs ? `?${qs}` : ''}`));
  }, [searchParams, routeBase, rawRouter]);

  // Goes through the same guard as every other navigation here (backdrop click, header ✕, and
  // the footer Cancel button all call this one function) rather than rawRouter directly.
  // Preserves the register list's own filter/pagination params (search, mode, status, page,
  // pageSize) so closing the drawer doesn't dump the admin back on page 1 unfiltered after they
  // searched/filtered/paged to find this tax — mirrors ConfigOverviewDrawer's REGISTER_KEYS.
  const handleClose = useCallback(() => {
    guardedNavigate(rawClose);
  }, [rawClose, guardedNavigate]);

  return {
    router,
    rawRouter,
    rawClose,
    searchParams,
    locale,
    numericId,
    isNew,
    calcMode,
    effectiveCategory,
    isHybrid,
    activeTab,
    routeBase,
    buildConfigUrl,
    handleClose,
    startTransition,
    registerDirtyCheck,
    hasVisitedConfigRef,
  };
}

export type DynamicTaxNav = ReturnType<typeof useDynamicTaxNav>;

