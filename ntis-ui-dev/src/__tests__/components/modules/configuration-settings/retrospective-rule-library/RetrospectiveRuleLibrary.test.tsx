import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RetrospectiveRuleLibraryClient } from '@/components/modules/property-tax/retrospective-rule-library/RetrospectiveRuleLibraryClient';
import { INITIAL_RETROSPECTIVE_RULES, INITIAL_RETROSPECTIVE_STATS } from '@/lib/api/retrospective-rule-library/retrospective-rule.service';

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, values?: Record<string, string | number>) => {
    const dict: Record<string, string> = {
      'title': 'Retrospective Rule Library',
      'subtitle': 'Review, compare and configure corporation-specific rules.',
      'exportJson': 'Export JSON',
      'corporations.all': 'All Corporations',
      'defaultDateRules.title': 'Default Date Rules',
      'defaultDateRules.subtitle': 'Define default occupancy date rules for cases where actual occupancy date is not available.',
      'defaultDateRules.defaultBadge': 'Default',
      'defaultDateRules.columns.priority': 'Priority',
      'defaultDateRules.columns.ruleName': 'Rule Name',
      'defaultDateRules.columns.appliesTo': 'Applies To',
      'defaultDateRules.columns.condition': 'Condition',
      'defaultDateRules.columns.defaultDateLogic': 'Default Date Logic',
      'defaultDateRules.columns.effectiveFrom': 'Effective From',
      'defaultDateRules.columns.status': 'Status',
      'defaultDateRules.columns.actions': 'Actions',
      'defaultDateRules.showing': `Showing ${values?.start || 1} to ${values?.end || 5} of ${values?.total || 5} rules`,
      'ruleLibrary.title': 'Corporation Rule Library',
      'ruleLibrary.subtitle': 'Select a rule to inspect its source wording or open it in the builder.',
      'ruleLibrary.createRule': 'Create Rule',
      'ruleLibrary.searchPlaceholder': 'Search rule, evidence or result...',
      'ruleLibrary.statuses.all': 'All statuses',
      'ruleLibrary.evidenceFilters.all': 'All evidence',
      'ruleLibrary.columns.rule': 'RULE',
      'ruleLibrary.columns.condition': 'CONDITION',
      'ruleLibrary.columns.startLogic': 'START LOGIC',
      'ruleLibrary.columns.commonTaxation': 'COMMON TAXATION',
      'ruleLibrary.columns.unauthorizedPenalty': 'UNAUTHORIZED PENALTY',
      'ruleLibrary.columns.status': 'STATUS',
      'ruleLibrary.columns.actions': 'ACTIONS',
      'ruleLibrary.buttons.view': 'View',
      'ruleLibrary.buttons.edit': 'Edit',
      'stats.importedRules': 'Imported rules',
      'stats.readyActive': 'Ready / active',
      'stats.needReview': 'Need review',
      'stats.lookbackGuardrail': 'Statutory look-back guardrail',
      'stats.years': 'yrs',
      'builder.title': 'Configure Retrospective Rule',
      'builder.subtitle': 'Set taxation, define evidence conditions, and choose the resulting action.',
      'builder.pills.taxation': 'Taxation',
      'builder.pills.conditions': 'Conditions',
      'builder.pills.actions': 'Actions',
      'builder.taxation.title': 'Taxation Rate & Percentage',
      'builder.conditions.badge': 'WHEN',
      'builder.conditions.availableEvidence': 'Available evidence',
      'builder.actions.badge': 'THEN',
      'builder.actions.retrospectiveTaxTitle': 'Retrospective Tax',
    };
    const fullKey = namespace ? `${namespace}.${key}`.replace('retrospectiveRuleLibrary.', '') : key;
    return dict[fullKey] || dict[key] || key;
  },
  useLocale: () => 'en',
}));

describe('RetrospectiveRuleLibrary Component', () => {
  it('renders the header, title, and subtitle correctly', () => {
    render(
      <RetrospectiveRuleLibraryClient
        initialRules={INITIAL_RETROSPECTIVE_RULES}
        initialStats={INITIAL_RETROSPECTIVE_STATS}
      />
    );

    expect(screen.getByText('Retrospective Rule Library')).toBeInTheDocument();
    expect(
      screen.getByText('Review, compare and configure corporation-specific rules.')
    ).toBeInTheDocument();
  });

  const mockMasterRules = [
    {
      id: '1',
      ruleCode: 'THA-09',
      ruleTitle: 'OC + CC - 1.5x from CC to OC, then 1x',
      conditionDescription: 'OC or CC is available and NONE',
      evidenceCategory: 'Authorized: OC or CC available' as const,
      startLogicTitle: '6 Years Legal Cap • From 25-Aug-2026',
      startLogicBoundary: 'Effective: 25-Aug-2026',
      commonTaxationBadge: 'Current-year for all years',
      commonTaxationDescription: 'Current-year percentage for all years',
      unauthorizedPenalty: 'Not applicable — OC/CC available',
      status: 'Active' as const,
      priorityNo: 1,
      authorizationStatus: 'AUTHORIZED',
    },
    {
      id: '2',
      ruleCode: 'THA-01',
      ruleTitle: 'OC evidence - start from OC date',
      conditionDescription: 'Only OC is available. Retrospective tax applicable from OC date.',
      evidenceCategory: 'Authorized: OC or CC available' as const,
      startLogicTitle: 'OC evidence available.',
      startLogicBoundary: 'Effective: 01-Apr-2026',
      commonTaxationBadge: 'Current-year for all years',
      commonTaxationDescription: 'Current-year percentage for all years',
      unauthorizedPenalty: 'Not applicable — OC/CC available',
      status: 'Active' as const,
      priorityNo: 10,
      authorizationStatus: 'AUTHORIZED',
    },
    {
      id: '8',
      ruleCode: 'THA-07',
      ruleTitle: 'Change detection fallback',
      conditionDescription: 'OC, CC and electricity are not available. Change detection date is available.',
      evidenceCategory: 'Unauthorized: OC & CC unavailable' as const,
      startLogicTitle: 'Fallback rule based on change detection.',
      startLogicBoundary: 'Effective: 01-Apr-2026',
      commonTaxationBadge: 'Current-year for all years',
      commonTaxationDescription: 'Current-year percentage for all years',
      unauthorizedPenalty: 'Apply penalty as per the Act',
      status: 'Review' as const,
      priorityNo: 70,
      authorizationStatus: 'UNAUTHORIZED',
    },
  ];

  it('renders default date rules table with master API mapping correctly', () => {
    render(
      <RetrospectiveRuleLibraryClient
        initialRules={mockMasterRules}
        initialStats={INITIAL_RETROSPECTIVE_STATS}
      />
    );

    expect(screen.getAllByText('Default Date Rules')[0]).toBeInTheDocument();
    expect(screen.getByText('OC + CC - 1.5x from CC to OC, then 1x')).toBeInTheDocument();
    expect(screen.getByText('OC evidence - start from OC date')).toBeInTheDocument();
    expect(screen.getByText('Change detection fallback')).toBeInTheDocument();
  });

  it('filters rules by search query correctly', () => {
    render(
      <RetrospectiveRuleLibraryClient
        initialRules={mockMasterRules}
        initialStats={INITIAL_RETROSPECTIVE_STATS}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search rule, evidence or result...');
    fireEvent.change(searchInput, { target: { value: 'THA-07' } });

    expect(screen.getByText('Change detection fallback')).toBeInTheDocument();
    expect(screen.queryByText('OC + CC - 1.5x from CC to OC, then 1x')).not.toBeInTheDocument();
  });

  it('renders error banner when fetchError is provided', () => {
    render(
      <RetrospectiveRuleLibraryClient
        initialRules={[]}
        initialStats={INITIAL_RETROSPECTIVE_STATS}
        fetchError="Database connection timeout"
      />
    );

    expect(screen.getByText(/Database connection timeout/i)).toBeInTheDocument();
  });

  it('filters out rules where isActive is false', () => {
    const rulesWithInactive = [
      ...mockMasterRules,
      {
        id: '44',
        ruleCode: 'FUR-022',
        ruleTitle: 'Testing Inactive Rule',
        conditionDescription: 'OC is available and NONE',
        evidenceCategory: 'Authorized: OC or CC available' as const,
        startLogicTitle: '6 Years Legal Cap',
        startLogicBoundary: 'Effective: 01-Apr-2026',
        commonTaxationBadge: 'Current-year for all years',
        commonTaxationDescription: 'Current-year percentage for all years',
        unauthorizedPenalty: 'Not applicable',
        status: 'Draft' as const,
        priorityNo: 1,
        isActive: false,
      },
    ];

    render(
      <RetrospectiveRuleLibraryClient
        initialRules={rulesWithInactive}
        initialStats={INITIAL_RETROSPECTIVE_STATS}
      />
    );

    expect(screen.queryByText('Testing Inactive Rule')).not.toBeInTheDocument();
    expect(screen.getByText('OC + CC - 1.5x from CC to OC, then 1x')).toBeInTheDocument();
  });

  it('opens Rule Builder screen when edit button in Default Date Rules table is clicked', async () => {
    render(
      <RetrospectiveRuleLibraryClient
        initialRules={mockMasterRules}
        initialStats={INITIAL_RETROSPECTIVE_STATS}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBeGreaterThan(0);

    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Configure Retrospective Rule')).toBeInTheDocument();
    expect(screen.getByText('Taxation Rate & Percentage')).toBeInTheDocument();
  });

  it('opens Rule Builder screen when Create Rule button is clicked', () => {
    render(
      <RetrospectiveRuleLibraryClient
        initialRules={INITIAL_RETROSPECTIVE_RULES}
        initialStats={INITIAL_RETROSPECTIVE_STATS}
      />
    );

    const createBtns = screen.getAllByRole('button', { name: /create rule/i });
    fireEvent.click(createBtns[0]);

    expect(screen.getByText('Configure Retrospective Rule')).toBeInTheDocument();
    expect(screen.getByText('Taxation Rate & Percentage')).toBeInTheDocument();
    expect(screen.getByText('Available evidence')).toBeInTheDocument();
    expect(screen.getByText('Retrospective Tax')).toBeInTheDocument();
  });
});
