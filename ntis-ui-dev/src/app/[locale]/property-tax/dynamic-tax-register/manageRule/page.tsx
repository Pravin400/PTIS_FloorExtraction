import DynamicTaxRegister from '@/components/modules/property-tax/dynamic-tax-register/DynamicTaxRegister';
import ManageRuleDrawer from '@/components/modules/property-tax/dynamic-tax-register/settings/ManageRuleDrawer';
import {
  loadRegisterView,
  loadRuleMasterList,
  loadUsedRuleIds,
  loadCalculationModes,
  type RegisterSearchParams,
} from '../register-data';

interface PageProps {
  searchParams: Promise<RegisterSearchParams>;
}

export default async function ManageRulePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const [view, rules, usedRuleIds, calculationModes] = await Promise.all([
    loadRegisterView(sp),
    loadRuleMasterList(),
    loadUsedRuleIds(),
    loadCalculationModes(),
  ]);
  return (
    <>
      <DynamicTaxRegister {...view} />
      <ManageRuleDrawer initialRules={rules} usedRuleIds={usedRuleIds} calculationModes={calculationModes} />
    </>
  );
}
