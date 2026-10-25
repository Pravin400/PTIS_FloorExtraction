import DynamicTaxRegister from '@/components/modules/property-tax/dynamic-tax-register/DynamicTaxRegister';
import DynamicTaxDrawer from '@/components/modules/property-tax/dynamic-tax-register/settings/DynamicTaxDrawer';
import { loadRegisterView, loadTaxDrawerData, type RegisterSearchParams } from '../../register-data';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<
    RegisterSearchParams & {
      tab?: string;
      category?: string;
      valYear?: string;
      valGroup?: string;
      valPage?: string;
      valPageSize?: string;
      mstYear?: string;
      mstRule?: string;
      mstPage?: string;
      mstPageSize?: string;
    }
  >;
}

export default async function DynamicTaxAddPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const [view, drawer] = await Promise.all([
    loadRegisterView(sp),
    loadTaxDrawerData(id, {
      category: sp.category,
      valYear: sp.valYear,
      valGroup: sp.valGroup,
      valPage: sp.valPage,
      valPageSize: sp.valPageSize,
      mstYear: sp.mstYear,
      mstRule: sp.mstRule,
      mstPage: sp.mstPage,
      mstPageSize: sp.mstPageSize,
    }),
  ]);

  return (
    <>
      <DynamicTaxRegister {...view} />
      <DynamicTaxDrawer
        id={id}
        initialTab={sp.tab ?? 'general'}
        category={sp.category}
        taxRow={drawer.taxRow}
        ruleOptions={drawer.ruleOptions}
        yearRangeOptions={drawer.yearRangeOptions}
        valueRows={drawer.valueRows}
        valueRowsTotalCount={drawer.valueRowsTotalCount}
        masterRows={drawer.masterRows}
        masterRowsTotalCount={drawer.masterRowsTotalCount}
        hybridConfig={drawer.hybridConfig}
        masterSource={drawer.masterSource}
        typeOfUseOptions={drawer.typeOfUseOptions}
        masterKeyOptionsBySource={drawer.masterKeyOptionsBySource}
        conditionRows={drawer.conditionRows}
        conditionFields={drawer.conditionFields}
        conditionScopeId={drawer.conditionScopeId}
        taxCategoryOptions={drawer.taxCategoryOptions}
        referenceTaxOptions={drawer.referenceTaxOptions}
        valueLoadFailed={drawer.valueLoadFailed}
        masterLoadFailed={drawer.masterLoadFailed}
        hybridLoadFailed={drawer.hybridLoadFailed}
      />
    </>
  );
}
