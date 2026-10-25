import { redirect } from 'next/navigation';

export default async function OrganisationMastersRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<never> {
  const { locale } = await params;
  redirect(`/${locale}/payroll/organisation-masters/department-master`);
}
