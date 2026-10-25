import { notFound } from 'next/navigation';
import RuleBuilder from '@/components/modules/property-tax/rule-engine/RuleBuilder';
import { getRuleById } from '@/lib/api/rule-engine/rule.service';
import {
  fetchScopesAction,
  fetchFieldsForScopeAction,
  saveRuleAction,
  fetchCorporationsAction,
  fetchEffectTypesAction,
  fetchEffectTypeConfigsAction,
  fetchRateSectionsAction,
  fetchRuleCategoriesAction,
} from '../actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function EditRulePage(props: PageProps) {
  const { locale, id } = await props.params;

  const [scopes, rule, corporations, effectTypes, effectTypeConfigs, rateSections, ruleCategoryOptions] = await Promise.all([
    fetchScopesAction(),
    getRuleById(id),
    fetchCorporationsAction(),
    fetchEffectTypesAction(),
    fetchEffectTypeConfigsAction(),
    fetchRateSectionsAction(),
    fetchRuleCategoriesAction(),
  ]);

  if (!rule) {
    notFound();
  }

  const initialFields = rule.ruleScopeId ? await fetchFieldsForScopeAction(rule.ruleScopeId) : [];

  return (
    <RuleBuilder
      initialRule={rule}
      scopes={scopes}
      initialFields={initialFields}
      locale={locale}
      onFetchFields={fetchFieldsForScopeAction}
      onSaveRule={saveRuleAction}
      corporations={corporations}
      effectTypes={effectTypes}
      categoryOptions={rateSections}
      ruleCategoryOptions={ruleCategoryOptions}
      effectTypeConfigs={effectTypeConfigs}
    />
  );
}
