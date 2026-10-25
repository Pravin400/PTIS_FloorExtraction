import DynamicTaxRegister from '@/components/modules/property-tax/dynamic-tax-register/DynamicTaxRegister';
import { ConfigOverviewDrawer } from '@/components/modules/property-tax/dynamic-tax-register/overview/ConfigOverviewDrawer';
import { loadRegisterView, type RegisterSearchParams } from '../register-data';
import { loadConfigOverviewView, type ConfigOverviewSearchParams } from '../config-data';

interface PageProps {
  searchParams: Promise<RegisterSearchParams & ConfigOverviewSearchParams>;
}

/**
 * "Show Config" overlay route — renders the register list behind the read-only Configuration
 * Overview drawer. Every filter / page / page-size change is a URL search param, so the drawer's
 * data is (re)loaded server-side by `loadConfigOverviewView` on each navigation.
 */
export default async function DynamicTaxConfigPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const [view, config] = await Promise.all([loadRegisterView(sp), loadConfigOverviewView(sp)]);

  return (
    <>
      <DynamicTaxRegister {...view} />
      <ConfigOverviewDrawer view={config} />
    </>
  );
}
