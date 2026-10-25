'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RuleItem, RuleScope } from '@/types/rule-engine';
import { useRuleLibraryColumns, RuleItemRecord } from './useRuleLibraryColumns';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useToast } from '@/components/common/ToastProvider';
import { fetchRuleByIdAction, fetchFullRulesAction, saveRuleAction } from '@/app/[locale]/property-tax/rule-engine/actions';
import { assembleGlobalTestRule } from './useRuleLibraryHelpers';

interface UseRuleLibraryArgs {
  initialRules: RuleItem[];
  scopes: RuleScope[];
  locale: string;
  onDeleteRule: (id: number) => Promise<{ success: boolean; message: string }>;
  pageSize: number;
  initialSearchTerm?: string;
  t: (key: string) => string;
}

export function useRuleLibrary({
  initialRules,
  scopes,
  locale,
  onDeleteRule,
  pageSize,
  initialSearchTerm = '',
  t,
}: UseRuleLibraryArgs) {
  const router = useRouter();
  const confirmCtx = useConfirm();
  const toast = useToast();

  const [rules, setRules] = React.useState<RuleItem[]>(initialRules);
  const [filterCategory, setFilterCategory] = React.useState<string>('ALL');
  const [searchTerm, setSearchTerm] = React.useState<string>(initialSearchTerm);
  const [activeRuleForTest, setActiveRuleForTest] = React.useState<RuleItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [activeRuleForView, setActiveRuleForView] = React.useState<RuleItem | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = React.useState(false);
  const [loadingRuleId, setLoadingRuleId] = React.useState<number | null>(null);
  const [togglingRuleId, setTogglingRuleId] = React.useState<number | null>(null);

  const handleToggleActive = async (row: RuleItemRecord, newChecked: boolean) => {
    if (!row.id) return;
    setTogglingRuleId(row.id);
    try {
      const fullRule = await fetchRuleByIdAction(row.id);
      if (!fullRule) {
        toast.error('Failed to load rule details');
        return;
      }
      const res = await saveRuleAction({ ...fullRule, isActive: newChecked });
      if (res.success) {
        setRules((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive: newChecked } : r)));
        toast.success(newChecked ? t('library.enabledSuccess') : t('library.disabledSuccess'));
      } else {
        toast.error(res.message || 'Failed to update rule status');
      }
    } catch {
      toast.error('An error occurred while updating status');
    } finally {
      setTogglingRuleId(null);
    }
  };

  const handleFetchAndOpenDrawer = async (ruleId: number | undefined, onSuccess: (fullRule: RuleItem) => void) => {
    if (!ruleId) return;
    setLoadingRuleId(ruleId);
    try {
      const fullRule = await fetchRuleByIdAction(ruleId);
      if (fullRule) onSuccess(fullRule);
      else toast.error('Failed to load rule details');
    } catch {
      toast.error('An error occurred while loading rule details');
    } finally {
      setLoadingRuleId(null);
    }
  };

  const handleOpenTestDrawer = (rule: RuleItem) =>
    handleFetchAndOpenDrawer(rule.id, (fullRule) => {
      setActiveRuleForTest(fullRule);
      setIsDrawerOpen(true);
    });

  const handleOpenViewDrawer = (rule: RuleItem) =>
    handleFetchAndOpenDrawer(rule.id, (fullRule) => {
      setActiveRuleForView(fullRule);
      setIsViewDrawerOpen(true);
    });

  const handleOpenGlobalTestDrawer = async () => {
    setLoadingRuleId(-1);
    try {
      const targetCategory = filterCategory === 'ALL' ? 'ALL' : filterCategory;
      const scopeId = scopes[0]?.id || 1;
      const fullRulesResult = await fetchFullRulesAction(scopeId);
      const catRules = targetCategory === 'ALL'
        ? (fullRulesResult?.items || [])
        : (fullRulesResult?.items || []).filter((r) => r.ruleCategory === targetCategory);

      setActiveRuleForTest(assembleGlobalTestRule(catRules, targetCategory, scopeId));
      setIsDrawerOpen(true);
    } catch {
      toast.error('Failed to load full rule configurations for simulation');
    } finally {
      setLoadingRuleId(null);
    }
  };

  // NOTE: initialRules is set once via useState lazy initializer above.
  // No useEffect sync is needed — RSC re-renders pass new props which are only
  // consumed on full page revalidations, not client-side re-renders.

  const pushRoute = React.useCallback(
    (page: number, size: number | string) => {
      const q = searchTerm.trim();
      router.push(`/${locale}/property-tax/rule-engine?page=${page}&pageSize=${size}${q ? `&q=${encodeURIComponent(q)}` : ''}`);
    },
    [searchTerm, locale, router]
  );

  React.useEffect(() => {
    const currentTrimmed = searchTerm.trim();
    const initialTrimmed = initialSearchTerm.trim();
    if (currentTrimmed === initialTrimmed) return;
    const delayDebounceFn = setTimeout(() => pushRoute(1, pageSize), 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, initialSearchTerm, pushRoute, pageSize]);

  const handlePageChange = (page: number) => pushRoute(page, pageSize);
  const handlePageSizeChange = (size: string) => pushRoute(1, size);

  const handleDelete = (id: number) => {
    confirmCtx.confirm({
      variant: 'delete',
      title: t('library.deleteTitle'),
      description: t('library.deleteDescription'),
      confirmText: t('library.deleteConfirm'),
      cancelText: t('library.deleteCancel'),
      onConfirm: async () => {
        const res = await onDeleteRule(id);
        if (res.success) {
          setRules(rules.filter((r) => r.id !== id));
          toast.success(t('library.deleteSuccess'));
        } else {
          toast.error(res.message);
        }
      },
    });
  };

  const filteredRules = React.useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) {
      return rules.filter((r) => filterCategory === 'ALL' || r.ruleCategory === filterCategory);
    }
    const words = trimmed.split(' ').filter(Boolean);
    return rules.filter((r) => {
      const name = (r.ruleName || '').toLowerCase();
      const code = (r.ruleCode || '').toLowerCase();
      const matchesSearch = words.every((w) => name.includes(w) || code.includes(w));
      return matchesSearch && (filterCategory === 'ALL' || r.ruleCategory === filterCategory);
    });
  }, [rules, filterCategory, searchTerm]);

  const categoryFilterOptions = React.useMemo(() => {
    const cats = Array.from(new Set(rules.map((r) => r.ruleCategory).filter(Boolean)));
    return [
      { label: t('library.allCategories'), value: 'ALL' },
      ...cats.map((cat) => ({ label: cat as string, value: cat as string })),
    ];
  }, [rules, t]);

  const columns = useRuleLibraryColumns({ t, onToggleActive: handleToggleActive, togglingRuleId });

  return {
    rules,
    filterCategory,
    setFilterCategory,
    searchTerm,
    setSearchTerm,
    activeRuleForTest,
    isDrawerOpen,
    setIsDrawerOpen,
    activeRuleForView,
    isViewDrawerOpen,
    setIsViewDrawerOpen,
    loadingRuleId,
    togglingRuleId,
    handleToggleActive,
    handleOpenTestDrawer,
    handleOpenViewDrawer,
    handleOpenGlobalTestDrawer,
    handleDelete,
    handlePageChange,
    handlePageSizeChange,
    filteredRules,
    categoryFilterOptions,
    columns,
  };
}
