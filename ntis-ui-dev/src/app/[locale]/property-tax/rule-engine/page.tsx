import RuleLibrary from '@/components/modules/property-tax/rule-engine/RuleLibrary';
import { fetchRulesPagedAction, fetchScopesAction, deleteRuleAction } from './actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
  }>;
}

export default async function RuleEnginePage(props: PageProps) {
  const { locale } = await props.params;
  const search = await props.searchParams;

  const pageNumber = search.page ? Number(search.page) : 1;
  const pageSize = search.pageSize ? Number(search.pageSize) : 10;
  const searchTerm = search.q?.trim() || undefined;

  const [rulesResult, scopes] = await Promise.all([
    fetchRulesPagedAction(pageNumber, pageSize, searchTerm),
    fetchScopesAction(),
  ]);

  return (
    <RuleLibrary
      initialRules={rulesResult.items || []}
      scopes={scopes}
      locale={locale}
      onDeleteRule={deleteRuleAction}
      pageNumber={rulesResult.pageNumber || pageNumber}
      pageSize={rulesResult.pageSize || pageSize}
      totalCount={rulesResult.totalCount || 0}
      totalPages={rulesResult.totalPages || 0}
      initialSearchTerm={searchTerm}
    />
  );
}
