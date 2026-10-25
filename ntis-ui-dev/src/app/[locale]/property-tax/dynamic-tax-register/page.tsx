import DynamicTaxRegister from '@/components/modules/property-tax/dynamic-tax-register/DynamicTaxRegister';
import { loadRegisterView, type RegisterSearchParams } from './register-data';

interface PageProps {
  searchParams: Promise<RegisterSearchParams>;
}

export default async function page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const view = await loadRegisterView(sp);
  return <DynamicTaxRegister {...view} />;
}
