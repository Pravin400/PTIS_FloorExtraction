import type { RetrospectiveRule, RetrospectiveRuleFilterState, RuleStatus } from '@/types/retrospective-rule.types';

/**
 * Filter retrospective rules based on search query, status, and evidence category filters.
 */
export function filterRetrospectiveRules(
  rules: RetrospectiveRule[],
  filterState: RetrospectiveRuleFilterState
): RetrospectiveRule[] {
  const { searchQuery, statusFilter, evidenceFilter } = filterState;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return rules.filter((rule) => {
    // Search query matching
    const matchesSearch =
      !normalizedQuery ||
      rule.ruleTitle.toLowerCase().includes(normalizedQuery) ||
      rule.ruleCode.toLowerCase().includes(normalizedQuery) ||
      rule.conditionDescription.toLowerCase().includes(normalizedQuery) ||
      rule.startLogicTitle.toLowerCase().includes(normalizedQuery) ||
      rule.commonTaxationBadge.toLowerCase().includes(normalizedQuery) ||
      rule.unauthorizedPenalty.toLowerCase().includes(normalizedQuery);

    // Status filter matching
    const matchesStatus =
      !statusFilter ||
      statusFilter === 'All statuses' ||
      rule.status.toLowerCase() === statusFilter.toLowerCase();

    // Evidence filter matching
    const matchesEvidence =
      !evidenceFilter ||
      evidenceFilter === 'All evidence' ||
      rule.evidenceCategory.toLowerCase().includes(evidenceFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesEvidence;
  });
}

/**
 * Returns status indicator dot & badge color classes according to rule status.
 */
export function getStatusBadgeStyle(status: RuleStatus): { dotColor: string; textColor: string; label: string } {
  switch (status) {
    case 'Active':
      return {
        dotColor: 'bg-emerald-500',
        textColor: 'text-emerald-700 font-medium',
        label: 'Active',
      };
    case 'Review':
      return {
        dotColor: 'bg-amber-500',
        textColor: 'text-amber-700 font-medium',
        label: 'Review',
      };
    case 'Draft':
      return {
        dotColor: 'bg-gray-400',
        textColor: 'text-gray-600 font-medium',
        label: 'Draft',
      };
    case 'Inactive':
      return {
        dotColor: 'bg-rose-500',
        textColor: 'text-rose-700 font-medium',
        label: 'Inactive',
      };
    default:
      return {
        dotColor: 'bg-gray-400',
        textColor: 'text-gray-700 font-medium',
        label: status,
      };
  }
}

/**
 * Export rules list to JSON file trigger.
 */
export function exportRulesToJson(rules: RetrospectiveRule[], filename = 'retrospective-rules.json'): void {
  if (typeof window === 'undefined') return;
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(rules, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
