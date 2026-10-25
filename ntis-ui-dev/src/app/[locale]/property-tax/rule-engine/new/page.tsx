import RuleBuilder from '@/components/modules/property-tax/rule-engine/RuleBuilder';
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
  }>;
}

export default async function NewRulePage(props: PageProps) {
  const { locale } = await props.params;

  const scopes = await fetchScopesAction();
  const initialScopeId = scopes[0]?.id ?? 0;

  const [initialFields, corporations, effectTypes, effectTypeConfigs, rateSections, ruleCategoryOptions] = await Promise.all([
    initialScopeId > 0 ? fetchFieldsForScopeAction(initialScopeId) : Promise.resolve([]),
    fetchCorporationsAction(),
    fetchEffectTypesAction(),
    fetchEffectTypeConfigsAction(),
    fetchRateSectionsAction(),
    fetchRuleCategoriesAction(),
  ]);

  return (
    <RuleBuilder
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
