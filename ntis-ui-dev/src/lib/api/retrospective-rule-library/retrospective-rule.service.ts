import type {
  RetrospectiveRule,
  RetrospectiveRuleStats,
  EvidenceCategory,
  RuleStatus,
  RetrospectiveRuleMasterItem,
  RetrospectiveRuleMasterListResponse,
  RetrospectiveRuleMasterDetail,
  RetrospectiveRuleDetailApiResponse,
} from '@/types/retrospective-rule.types';
import { fetchWithCertSupport } from '@/lib/api/ptis/tab/base-api';

export const INITIAL_RETROSPECTIVE_RULES: RetrospectiveRule[] = [];

export const INITIAL_RETROSPECTIVE_STATS: RetrospectiveRuleStats = {
  importedRulesCount: 0,
  readyActiveCount: 0,
  needReviewCount: 0,
  lookbackGuardrailYears: 0,
};

function formatDefaultDateLogic(item: RetrospectiveRuleMasterItem): string {
  if (item.remarks && !item.remarks.toLowerCase().includes('saved via')) {
    return item.remarks;
  }
  const parts: string[] = [];
  if (item.legalCapYears) {
    parts.push(`${item.legalCapYears} Years Legal Cap`);
  }
  if (item.noticeDays && item.noticeDays > 0) {
    parts.push(`${item.noticeDays}d notice`);
  }
  if (item.effectiveFrom) {
    try {
      const d = new Date(item.effectiveFrom);
      if (!isNaN(d.getTime())) {
        const formattedDate = d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        parts.push(`From ${formattedDate}`);
      }
    } catch {
      // ignore invalid date
    }
  }
  return parts.length > 0 ? parts.join(' • ') : 'Standard Lookback Rule';
}

function mapMasterItemToRetrospectiveRule(item: RetrospectiveRuleMasterItem): RetrospectiveRule {
  const isAuthorized =
    item.authorizationStatus === 'AUTHORIZED' ||
    (!item.authorizationStatus &&
      (item.ruleDescription?.toUpperCase().includes('OC') ||
        item.ruleDescription?.toUpperCase().includes('CC')));

  const evidenceCategory: EvidenceCategory = isAuthorized
    ? 'Authorized: OC or CC available'
    : 'Unauthorized: OC & CC unavailable';

  const startLogicTitle = formatDefaultDateLogic(item);

  let formattedDate = '';
  if (item.effectiveFrom) {
    try {
      const d = new Date(item.effectiveFrom);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch {
      formattedDate = item.effectiveFrom;
    }
  }

  const startLogicBoundary = formattedDate
    ? `Effective: ${formattedDate}`
    : `Legal Cap: ${item.legalCapYears || 6} yrs`;

  // Normalize status
  let status: RuleStatus = 'Active';
  if (item.ruleStatus) {
    const s = String(item.ruleStatus).toLowerCase();
    if (s.includes('inactive') || !item.isActive) status = 'Inactive';
    else if (s.includes('review') || s.includes('clarification') || s.includes('needsclarification')) status = 'Review';
    else if (s.includes('draft')) status = 'Draft';
    else status = 'Active';
  } else if (!item.isActive) {
    status = 'Inactive';
  }

  return {
    id: String(item.id),
    ruleCode: item.ruleCode || `RULE-${item.id}`,
    ruleTitle: item.ruleName || item.ruleCode,
    conditionDescription: item.ruleDescription || 'No condition specified',
    evidenceCategory,
    startLogicTitle,
    startLogicBoundary,
    commonTaxationBadge: 'Current-year for all years',
    commonTaxationDescription: 'Current-year percentage for all years',
    unauthorizedPenalty: isAuthorized
      ? 'Not applicable — OC/CC available'
      : 'Apply penalty as per the Act',
    status,
    priorityNo: item.priorityNo,
    matchType: item.matchType,
    isFallbackRule: item.isFallbackRule,
    authorizationStatus: item.authorizationStatus ?? undefined,
    legalCapEnabled: item.legalCapEnabled,
    legalCapYears: item.legalCapYears,
    noticeDays: item.noticeDays,
    versionNo: item.versionNo,
    resolutionRef: item.resolutionRef,
    effectiveFrom: item.effectiveFrom,
    effectiveTo: item.effectiveTo,
    remarks: item.remarks,
    isActive: item.isActive,
  };
}

export async function fetchRetrospectiveRulesServer(): Promise<{
  data: RetrospectiveRule[];
  stats: RetrospectiveRuleStats;
  success: boolean;
  error?: string;
}> {
  try {
    const res = await fetchWithCertSupport<RetrospectiveRuleMasterListResponse | RetrospectiveRuleMasterItem[]>(
      '/RetrospectiveRuleMaster?PageSize=-1'
    );

    if (res.success && res.data) {
      let rawItems: RetrospectiveRuleMasterItem[] = [];

      if (Array.isArray(res.data)) {
        rawItems = res.data;
      } else if (res.data && Array.isArray((res.data as RetrospectiveRuleMasterListResponse).items)) {
        rawItems = (res.data as RetrospectiveRuleMasterListResponse).items;
      }

      // Filter only rules where isActive is true
      const activeRawItems = rawItems.filter((item) => item.isActive === true);
      const mappedRules = activeRawItems.map(mapMasterItemToRetrospectiveRule);

      const activeCount = mappedRules.filter((r) => r.status === 'Active').length;
      const reviewCount = mappedRules.filter((r) => r.status === 'Review' || r.status === 'Draft').length;

      return {
        data: mappedRules,
        stats: {
          importedRulesCount: mappedRules.length,
          readyActiveCount: activeCount,
          needReviewCount: reviewCount,
          lookbackGuardrailYears: 6,
        },
        success: true,
      };
    }

    return {
      data: [],
      stats: INITIAL_RETROSPECTIVE_STATS,
      success: false,
      error: res.error?.message || 'Failed to fetch retrospective rules from API',
    };
  } catch (error) {
    return {
      data: [],
      stats: INITIAL_RETROSPECTIVE_STATS,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch retrospective rules',
    };
  }
}

export async function saveRetrospectiveRuleServer(
  input: unknown
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const res = await fetchWithCertSupport('/RetrospectiveRuleMaster/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (res.success) {
      return { success: true, data: res.data };
    }

    return {
      success: false,
      error: res.error?.message || 'Failed to save retrospective rule',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save retrospective rule',
    };
  }
}

export async function fetchTaxPolicyServer(): Promise<{
  success: boolean;
  item?: {
    rateMode: string;
    percentageMode: string;
    [key: string]: unknown;
  };
  error?: string;
}> {
  try {
    const res = await fetchWithCertSupport<{
      items?: Array<{
        rateMode: string;
        percentageMode: string;
        [key: string]: unknown;
      }>;
    }>('/RetrospectiveTaxPolicy');
    if (res.success && res.data?.items && res.data.items.length > 0) {
      return { success: true, item: res.data.items[0] };
    }
    return { success: true, item: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tax policy',
    };
  }
}

export async function saveTaxPolicyServer(
  input: unknown
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const res = await fetchWithCertSupport('/RetrospectiveTaxPolicy/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (res.success) {
      return { success: true, data: res.data };
    }

    return {
      success: false,
      error: res.error?.message || 'Failed to save retrospective tax policy',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save retrospective tax policy',
    };
  }
}

export async function deleteRetrospectiveRuleServer(
  ruleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetchWithCertSupport(`/RetrospectiveRuleMaster/${ruleId}`, {
      method: 'DELETE',
    });
    if (res.success) {
      return { success: true };
    }
    return {
      success: false,
      error: res.error?.message || 'Failed to delete rule',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete rule',
    };
  }
}

export async function fetchRuleDetailServer(ruleId: string | number): Promise<{
  success: boolean;
  data?: RetrospectiveRuleMasterDetail;
  error?: string;
}> {
  try {
    const res = await fetchWithCertSupport<RetrospectiveRuleDetailApiResponse>(
      `/RetrospectiveRuleMaster/${ruleId}/detail`
    );
    if (res.success && res.data) {
      const detailData =
        (res.data as unknown as { items?: RetrospectiveRuleMasterDetail }).items ||
        (res.data as unknown as RetrospectiveRuleMasterDetail);
      return { success: true, data: detailData };
    }
    return {
      success: false,
      error: res.error?.message || `Failed to fetch detail for rule ${ruleId}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch detail for rule ${ruleId}`,
    };
  }
}

export * from './retrospective-rule-lookup.service';
